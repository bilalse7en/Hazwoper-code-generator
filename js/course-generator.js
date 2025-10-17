// ========== COURSE CONTENT GENERATOR ==========
const courseData = { 
    overview: "", courseObjectives: "", syllabus: "", courseTitle: "", faqData: [],
    overviewSections: [], courseObjectivesList: [], syllabusModules: [], courseObjectivesIntro: "",
    fileProcessed: false
};

function uploadCourseFile() {
    const file = document.getElementById("courseFileInput").files[0];
    const courseName = document.getElementById("courseNameInput").value.trim();
    
    if (!file) return utils.showNotification("Please select a file to upload.", "warning");
    if (!courseName) return utils.showNotification("Please enter a course name.", "warning");
    
    courseData.courseTitle = courseName;
    const progressInterval = utils.showProgress("courseProgress", "courseProgressText", "Reading DOCX file...");
    const reader = new FileReader();
    
    reader.onload = (event) => {
        document.getElementById("courseProgressText").textContent = "Converting DOCX to HTML...";
        mammoth.convertToHtml({arrayBuffer: event.target.result})
            .then(result => {
                document.getElementById("courseProgressText").textContent = "Extracting course content...";
                extractCourseContent(result.value, progressInterval);
            })
            .catch(error => {
                console.error("Conversion error:", error);
                utils.hideProgress("courseProgress", progressInterval);
                utils.showNotification("Error reading the file. Please try again.", "error");
            });
    };
    
    reader.onerror = () => {
        utils.hideProgress("courseProgress", progressInterval);
        utils.showNotification("Error reading the file. Please try again.", "error");
    };
    
    reader.readAsArrayBuffer(file);
}

function extractCourseContent(html, progressInterval) {
    try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        
        courseData.overviewSections = [];
        courseData.courseObjectivesList = [];
        courseData.syllabusModules = [];
        courseData.courseObjectivesIntro = "";
        courseData.faqData = [];
        
        const elementsArray = Array.from(tempDiv.children);
        
        extractOverview(elementsArray);
        extractCourseObjectives(elementsArray);
        extractSyllabus(elementsArray);
        extractFAQContent(elementsArray);
        
        courseData.fileProcessed = true;
        utils.hideProgress("courseProgress", progressInterval);
        utils.showNotification("Course content extracted successfully!", "success");
        
    } catch (error) {
        console.error("Extraction error:", error);
        utils.hideProgress("courseProgress", progressInterval);
        utils.showNotification("Error extracting content. Please check the file format.", "error");
    }
}

function extractOverview(elementsArray) {
    let overviewStart = -1;
    elementsArray.forEach((element, i) => {
        const text = element.textContent.trim().toLowerCase();
        if (text.includes("overview") && overviewStart === -1) overviewStart = i;
    });
    
    if (overviewStart !== -1) {
        const syllabusStart = elementsArray.findIndex(el => 
            el.textContent.trim().toLowerCase().includes("syllabus") || 
            el.textContent.trim().toLowerCase().includes("course syllabus")
        );
        const overviewEnd = syllabusStart !== -1 ? syllabusStart : elementsArray.length;
        const overviewElements = elementsArray.slice(overviewStart + 1, overviewEnd);
        courseData.overview = overviewElements.map(el => el.outerHTML).join("");
        courseData.overviewSections = [{ heading: "Overview", content: courseData.overview }];
    }
}

function extractCourseObjectives(elementsArray) {
    const syllabusStart = elementsArray.findIndex(el => 
        el.textContent.trim().toLowerCase().includes("syllabus")
    );
    
    if (syllabusStart !== -1) {
        const syllabusElements = elementsArray.slice(syllabusStart);
        
        let foundSyllabusHeading = false;
        for (const element of syllabusElements) {
            const text = element.textContent.trim();
            if (text.toLowerCase().includes("syllabus")) {
                foundSyllabusHeading = true;
                continue;
            }
            if (foundSyllabusHeading && element.tagName === 'P') {
                courseData.courseObjectivesIntro = element.innerHTML.trim();
                break;
            }
        }
        
        let inObjectives = false;
        for (const element of syllabusElements) {
            const text = element.textContent.trim().toLowerCase();
            if (text.includes("course objectives")) {
                inObjectives = true;
                continue;
            }
            if (inObjectives && element.tagName === 'UL') {
                const items = element.querySelectorAll('li');
                items.forEach(item => {
                    const itemText = item.innerHTML.trim();
                    if (!isUnwantedObjective(itemText)) {
                        courseData.courseObjectivesList.push(itemText);
                    }
                });
                break;
            }
        }
    }
}

function extractSyllabus(elementsArray) {
    courseData.syllabusModules = extractAllSyllabusContent(elementsArray);
}

function extractFAQContent(elementsArray) {
    courseData.faqData = [];
    
    let faqStart = -1;
    elementsArray.forEach((element, i) => {
        const text = element.textContent.trim().toLowerCase();
        if ((text.includes("faq") || text.includes("frequently asked questions")) && 
            element.tagName.match(/^H[1-6]$/i) && faqStart === -1) {
            faqStart = i;
        }
    });
    
    if (faqStart === -1) {
        console.log("No FAQ section found");
        return;
    }
    
    console.log("FAQ section found at index:", faqStart);
    
     let faqEnd = elementsArray.length;
     for (let i = faqStart + 1; i < elementsArray.length; i++) {
         const element = elementsArray[i];
        const text = element.textContent.trim();
        
        if (text.includes("For Online Course Page:") || 
            (element.tagName.match(/^H[1-6]$/i) && 
             !text.toLowerCase().includes("faq") && 
             i > faqStart + 3)) {
            faqEnd = i;
            break;
        }
    }
    
    console.log("FAQ section ends at:", faqEnd);
    
    let currentQuestion = "";
    let currentAnswer = "";
    let collectingAnswer = false;
    
    for (let i = faqStart + 1; i < faqEnd; i++) {
        const element = elementsArray[i];
        const text = element.textContent.trim();
        const tagName = element.tagName;
        const innerHTML = element.innerHTML.trim();
        
        if (!text) continue;
        
        const isQuestion = (
            /^\d+\.\s+/.test(text) ||
            (innerHTML.includes('<strong>') && text.includes('?')) ||
            (innerHTML.includes('<b>') && text.includes('?')) ||
            (text.endsWith('?') && text.length < 200)
        );
        
        if (isQuestion) {
            if (currentQuestion && currentAnswer) {
                courseData.faqData.push({
                    question: cleanFAQText(currentQuestion),
                    answer: cleanFAQText(currentAnswer)
                });
                console.log("Saved FAQ:", currentQuestion.substring(0, 50) + "...");
            }
            
            currentQuestion = text;
            
            const questionMatch = text.match(/^\d+\.\s+(.*?)(?:\?)(.*)$/);
            if (questionMatch && questionMatch[2] && questionMatch[2].trim()) {
                currentAnswer = questionMatch[2].trim();
                collectingAnswer = true;
            } else {
                currentAnswer = "";
                collectingAnswer = true;
            }
        } else if (collectingAnswer && text) {
            if (currentAnswer) {
                currentAnswer += " " + element.outerHTML;
            } else {
                currentAnswer = element.outerHTML;
            }
            
            const nextIsQuestion = i + 1 < faqEnd && (
                /^\d+\.\s+/.test(elementsArray[i + 1].textContent.trim()) ||
                (elementsArray[i + 1].innerHTML.includes('<strong>') && 
                 elementsArray[i + 1].textContent.trim().includes('?'))
            );
            
            if (nextIsQuestion) {
                if (currentQuestion && currentAnswer) {
                    courseData.faqData.push({
                        question: cleanFAQText(currentQuestion),
                        answer: cleanFAQText(currentAnswer)
                    });
                    console.log("Saved FAQ (next question detected):", currentQuestion.substring(0, 50) + "...");
                }
                currentQuestion = "";
                currentAnswer = "";
                collectingAnswer = false;
            }
        }
    }
    
    if (currentQuestion && currentAnswer) {
        courseData.faqData.push({
            question: cleanFAQText(currentQuestion),
            answer: cleanFAQText(currentAnswer)
        });
        console.log("Saved final FAQ:", currentQuestion.substring(0, 50) + "...");
    }
    
    console.log("Total FAQ items extracted:", courseData.faqData.length);
    courseData.faqData.forEach((faq, index) => {
        console.log(`FAQ ${index + 1}:`, faq.question.substring(0, 100) + "...");
    });
}

function cleanFAQText(text) {
    if (!text) return "";
    
    let cleaned = text;
    
    cleaned = cleaned.replace(/^\d+\.\s*/, '');
    cleaned = cleaned.replace(/^Q:\s*/i, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

function debugFAQs() {
    if (!courseData.fileProcessed) {
        utils.showNotification("Please upload and process a DOCX file first.", "warning");
        return;
    }
    
    let debugHTML = `<h3>FAQ Debug Information</h3>`;
    debugHTML += `<p>Total FAQ items found: ${courseData.faqData.length}</p>`;
    
    if (courseData.faqData.length === 0) {
        debugHTML += `<p>No FAQ items were extracted. This could be because:</p>`;
        debugHTML += `<ul>`;
        debugHTML += `<li>The FAQ section wasn't properly identified</li>`;
        debugHTML += `<li>The questions don't follow the expected format</li>`;
        debugHTML += `<li>There's an issue with the document structure</li>`;
        debugHTML += `</ul>`;
    } else {
        debugHTML += `<div class="faq-debug-items">`;
        courseData.faqData.forEach((faq, index) => {
            debugHTML += `<div class="debug-faq-item mb-4 p-3 border">`;
            debugHTML += `<h4>FAQ ${index + 1}:</h4>`;
            debugHTML += `<p><strong>Question:</strong> ${faq.question}</p>`;
            debugHTML += `<p><strong>Answer:</strong> ${faq.answer.substring(0, 200)}...</p>`;
            debugHTML += `</div>`;
        });
        debugHTML += `</div>`;
    }
    
    openPreviewDrawerWithContent(debugHTML, "FAQ Debug");
    utils.showNotification("FAQ debug information displayed", "info");
}

function isUnwantedObjective(itemText) {
    const unwantedPatterns = [
        "identify various categories", "assessing weather", "maintaining compliance", 
        "safely integrating hoists", "individuals who are appointed", "employees charged with checking", 
        "safety officers", "employees who want advanced training", "how to identify", 
        "methods for assessing", "techniques for maintaining", "methods for safely integrating", 
        "who should enroll"
    ];
    const lowerItem = itemText.toLowerCase();
    return unwantedPatterns.some(pattern => lowerItem.includes(pattern));
}

function extractAllSyllabusContent(elementsArray) {
    const modules = [];
    let currentModule = null;
    
    for (let i = 0; i < elementsArray.length; i++) {
        const element = elementsArray[i];
        const text = element.textContent.trim();
        if (!text) continue;
        
        if (text.match(/^Module\s*\d+:/i)) {
            if (currentModule) modules.push(currentModule);
            
            currentModule = {
                title: text,
                description: "",
                lessons: []
            };
            
            for (let j = i + 1; j < Math.min(i + 5, elementsArray.length); j++) {
                const nextElement = elementsArray[j];
                const nextText = nextElement.textContent.trim();
                
                if (nextElement.tagName === 'P' && nextText && 
                    !nextText.match(/^Module\s*\d+:/i) && 
                    !nextText.match(/^Lesson\s*\d+:/i) &&
                    !nextText.includes("LESSONS") &&
                    !nextText.includes("Course Content")) {
                    currentModule.description = nextText;
                    break;
                }
            }
        }
        else if (element.tagName === 'UL' && currentModule) {
            const listItems = element.querySelectorAll('li');
            let currentLesson = null;
            
            for (const item of listItems) {
                const itemText = item.textContent.trim();
                const itemHTML = item.innerHTML.trim();
                
                if (itemText.match(/^Lesson\s*\d+:/i)) {
                    if (currentLesson) {
                        if (!currentLesson.items.some(item => item.toLowerCase().includes("lesson quiz"))) {
                            currentLesson.items.push("Lesson quiz.");
                        }
                        currentModule.lessons.push(currentLesson);
                    }
                    
                    currentLesson = {
                        title: itemText,
                        items: []
                    };
                    
                    const nestedList = item.querySelector('ul');
                    if (nestedList) {
                        const nestedItems = nestedList.querySelectorAll('li');
                        nestedItems.forEach(nestedItem => {
                            const nestedText = nestedItem.innerHTML.trim();
                            if (nestedText && !nestedText.match(/^Lesson\s*\d+:/i)) {
                                currentLesson.items.push(nestedText);
                            }
                        });
                    }
                }
                else if (currentLesson && itemText && !itemText.match(/^Lesson\s*\d+:/i)) {
                    currentLesson.items.push(itemHTML);
                }
            }
            
            if (currentLesson) {
                if (!currentLesson.items.some(item => item.toLowerCase().includes("lesson quiz"))) {
                    currentLesson.items.push("Lesson quiz.");
                }
                currentModule.lessons.push(currentLesson);
            }
        }
    }
    
    if (currentModule) modules.push(currentModule);
    return modules;
}

function generateOverviewCode() {
    if (!courseData.fileProcessed) return utils.showNotification("Please upload and process a DOCX file first.", "warning");
    
    const videoHtml = `<!-- <div class="col-md-5 col-sm-12 elementor-col-40 elementor-column ml-md-3 p-0 pb-0 pt-0 verified-field-container" style="float:right"><div class="demo-video"><iframe title="${courseData.courseTitle || 'Course Video'}" src="https://player.vimeo.com/video/680313019?h=6c9335ab94" width="560" height="200" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen data-ready="true"></iframe><img src="" alt="${courseData.courseTitle || 'Course Name'}"></div></div> -->`;
    
    let contentHtml = "";
    if (courseData.overviewSections.length > 0) {
        courseData.overviewSections.forEach(section => {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = section.content;
            tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(heading => {
                const newHeading = document.createElement("h2");
                newHeading.className = "fs-4 text-warning";
                newHeading.innerHTML = heading.innerHTML;
                heading.parentNode.replaceChild(newHeading, heading);
            });
            tempDiv.querySelectorAll("ul, ol").forEach(list => { list.className = "objective-tab-list"; });
            tempDiv.querySelectorAll("a").forEach(link => { link.setAttribute("target", "_blank"); });
            contentHtml += tempDiv.innerHTML;
        });
    } else {
        contentHtml = "<p>No overview content found.</p>";
    }
    
    const overviewHtml = videoHtml + contentHtml;
    document.getElementById("overviewCode").value = overviewHtml;
    showGeneratedCode('course', 'overviewCodeSection');
    utils.showNotification("Overview code generated successfully!", "success");
}

function generateCourseObjectivesCode() {
    if (!courseData.fileProcessed) return utils.showNotification("Please upload and process a DOCX file first.", "warning");
    
    const introParagraph = courseData.courseObjectivesIntro || `This ${courseData.courseTitle || 'Course'} will equip workers with the information and authority required.`;
    let listItemsHtml = "";
    
    if (courseData.courseObjectivesList.length > 0) {
        listItemsHtml = courseData.courseObjectivesList.map(item => `<li>${item}</li>`).join('\n');
    } else {
        listItemsHtml = "<li>No course objectives found in the document.</li>";
    }
    
    const courseObjectivesHtml = `<p>${introParagraph}</p><h2 class="h3">Course Objectives</h2><p class="m-0"><b>After completing this course, the learner will be able to:</b></p><ul class="objective-tab-list">${listItemsHtml}</ul>`;
    
    document.getElementById("courseObjectivesCode").value = courseObjectivesHtml;
    showGeneratedCode('course', 'courseObjectivesCodeSection');
    utils.showNotification("Course Objectives code generated successfully!", "success");
}

function generateSyllabusCode() {
    if (!courseData.fileProcessed) return utils.showNotification("Please upload and process a DOCX file first.", "warning");

    const syllabusHtml = generateSyllabusHTML();
    document.getElementById("syllabusCode").value = syllabusHtml;
    showGeneratedCode('course', 'syllabusCodeSection');
    utils.showNotification("Syllabus code generated successfully!", "success");
}

function generateFAQCode() {
    if (!courseData.fileProcessed) {
        utils.showNotification("Please upload and process a DOCX file first.", "warning");
        return;
    }
    
    if (courseData.faqData.length === 0) {
        utils.showNotification("No FAQ content found in the document.", "warning");
        return;
    }

    let faqHTML = `<div class="faq-section">\n`;
    
    courseData.faqData.forEach((faq, index) => {
        const question = cleanFAQText(faq.question);
        let answer = cleanFAQText(faq.answer);
        
        answer = answer.replace(/^A:\s*/i, '').trim();
        
        if (question && answer) {
            faqHTML += `  <div class="faq-item">\n`;
            faqHTML += `    <div class="faq-question">${index + 1}. ${question}</div>\n`;
            faqHTML += `    <div class="faq-answer">${answer}</div>\n`;
            faqHTML += `  </div>\n`;
            
            if (index < courseData.faqData.length - 1) {
                faqHTML += `  <hr>\n`;
            }
        }
    });
    
    faqHTML += `</div>`;
    
    document.getElementById("faqCode").value = faqHTML;
    showGeneratedCode('course', 'faqCodeSection');
    utils.showNotification(`FAQ code generated successfully! Found ${courseData.faqData.length} questions.`, "success");
}

function debugExtraction() {
    if (!courseData.fileProcessed) return utils.showNotification("Please upload and process a DOCX file first.", "warning");
    
    let debugInfo = `
        <h3>Debug Information</h3>
        <h4>Course Title: ${courseData.courseTitle || 'Not found'}</h4>
        <h4>Overview Sections: ${courseData.overviewSections.length}</h4>
        <h4>Course Objectives: ${courseData.courseObjectivesList.length}</h4>
        <h4>Syllabus Modules: ${courseData.syllabusModules.length}</h4>
        <h4>FAQ Items: ${courseData.faqData.length}</h4>
        <hr>
    `;
    
    if (courseData.syllabusModules.length > 0) {
        debugInfo += '<h4>Modules Details:</h4>';
        courseData.syllabusModules.forEach((module, index) => {
            debugInfo += `
                <div style="border: 1px solid #ccc; margin: 10px 0; padding: 10px;">
                    <h5>Module ${index + 1}: ${module.title}</h5>
                    <p><strong>Description:</strong> ${module.description || 'No description'}</p>
                    <p><strong>Lessons:</strong> ${module.lessons.length}</p>
            `;
            
            module.lessons.forEach((lesson, lessonIndex) => {
                debugInfo += `
                    <div style="margin-left: 20px; border-left: 2px solid #007bff; padding-left: 10px; margin: 10px 0;">
                        <h6>Lesson ${lessonIndex + 1}: ${lesson.title}</h6>
                        <p><strong>Items:</strong> ${lesson.items.length}</p>
                        <ul>
                `;
                lesson.items.forEach((item, itemIndex) => {
                    debugInfo += `<li>${itemIndex + 1}. ${item.substring(0, 100)}${item.length > 100 ? '...' : ''}</li>`;
                });
                debugInfo += '</ul></div>';
            });
            debugInfo += '</div>';
        });
    } else {
        debugInfo += '<p>No modules found. Check the document structure.</p>';
    }
    
    openPreviewDrawerWithContent(debugInfo, "Extraction Debug");
    utils.showNotification("Debug information displayed", "info");
}

function generateSyllabusHTML() {
    let totalLessons = 0;
    let modulesHTML = '';
    
    if (courseData.syllabusModules.length > 0) {
        courseData.syllabusModules.forEach((module, moduleIndex) => {
            totalLessons += module.lessons.length;
            let lessonsHTML = '';
            
            module.lessons.forEach((lesson, lessonIndex) => {
                let lessonItemsHTML = '';
                if (lesson.items && lesson.items.length > 0) {
                    lessonItemsHTML = lesson.items.map(item => {
                        const cleanItem = item.replace(/\s+/g, ' ').trim();
                        return `<li>${cleanItem}</li>`;
                    }).join('');
                } else {
                    lessonItemsHTML = '<li>No content available for this lesson.</li>';
                }
                
                lessonsHTML += `
                    <li>
                        <b>${lesson.title}</b>
                        <ul class="objective-tab-list">
                            ${lessonItemsHTML}
                        </ul>
                    </li>`;
            });

            modulesHTML += `
                <div class="sbox">
                    <h4 class="h6 fw-normal font-poppins"><strong>${module.title}</strong></h4>
                    <hr class="border-3 my-2" style="background: #ffcd05;opacity: 1;padding: 2px;">
                    ${module.description ? `<p class="pl-3">${module.description}</p>` : ''}
                    <ul>
                        ${lessonsHTML}
                    </ul>
                </div>`;
        });
    } else {
        modulesHTML = '<div class="sbox"><p>No syllabus content could be extracted. Please check the document structure.</p></div>';
    }

    const courseTitle = courseData.courseTitle || 'Course';
    const syllabusTitle = `${courseTitle} Syllabus`;
    
    return `<style>
        .sbox {
            margin: 10px 0;
            border: 1px solid #f5f5f5;
            background: #fff;
            padding: 10px 18px;
            box-shadow: 0 0 0px 1px rgba(20,23,28,.1), 0 3px 1px 0 rgba(20,23,28,.1);
            color: #000;
        }
        </style>
        <h2 class="font-poppins fw-bold fs-6"><strong>${courseTitle} Course Syllabus</strong></h2>
        <p>This ${courseTitle} course consists of ${totalLessons} lessons divided into ${courseData.syllabusModules.length} modules. Students are required to complete each lesson in the sequence listed below.</p>
        <div class="h3 font-poppins">Course Content</div>
        <div style="background: #f2f3f5;padding-bottom:1px;">
            <div class="border-0 pl-3 sbox" style="background-color: #ffcd05;">
                <div class="fs-6 fw-normal lh-sm m-0 text-uppercase"><strong>Lessons</strong></div>
            </div>
            <h3 class="font-poppins fs-6 fw-normal pl-3 sbox"><strong>Introduction</strong></h3>
            ${modulesHTML}
            <div class="sbox">
                <h4 class="font-poppins fs-5 m-0 fw-normal"><strong>Final Examination</strong></h4>
            </div>
        </div>`;
}

function downloadDemoFile(){
    const a=document.createElement('a');
    a.style.display='none';
    a.href='https://staging-media.hazwoper-osha.com/wp-content/uploads/2025/10/1759820370/demo-file-of-website-content-for-3-section.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a)
}