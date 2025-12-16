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
		mammoth.convertToHtml({ arrayBuffer: event.target.result })
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
		// Stop at Course Objectives (which comes before Syllabus now)
		const objectivesStart = elementsArray.findIndex((el, i) =>
			i > overviewStart &&
			(el.textContent.trim().toLowerCase().includes("course objectives") ||
				el.textContent.trim().toLowerCase().includes("1.2"))
		);

		// If Course Objectives not found, fall back to Syllabus
		const syllabusStart = objectivesStart === -1 ? elementsArray.findIndex((el, i) =>
			i > overviewStart &&
			(el.textContent.trim().toLowerCase().includes("syllabus") ||
				el.textContent.trim().toLowerCase().includes("course syllabus"))
		) : -1;

		const overviewEnd = objectivesStart !== -1 ? objectivesStart :
			(syllabusStart !== -1 ? syllabusStart : elementsArray.length);
		const overviewElements = elementsArray.slice(overviewStart + 1, overviewEnd);
		courseData.overview = overviewElements.map(el => el.outerHTML).join("");
		courseData.overviewSections = [{ heading: "Overview", content: courseData.overview }];
	}
}

function extractCourseObjectives(elementsArray) {
	// Find Course Objectives section - be flexible with detection
	let objectivesStart = -1;
	let objectivesEnd = -1;

	// First, find where Course Objectives section starts
	for (let i = 0; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim().toLowerCase();

		// Look for any mention of "course objectives" or "objectives" or "learning objectives"
		if (text.includes("course objectives") ||
			text.includes("learning objectives") ||
			(text.includes("objectives") && element.tagName.match(/^H[1-6]$/i)) ||
			text.match(/^\d+\.\d*\s*.*objectives/i)) {
			objectivesStart = i;
			break;
		}
	}

	if (objectivesStart === -1) {
		console.log("Course Objectives section not found");
		return;
	}

	// Find where Course Objectives section ends
	for (let i = objectivesStart + 1; i < elementsArray.length; i++) {
		const el = elementsArray[i];
		const text = el.textContent.trim().toLowerCase();
		const tagName = el.tagName;

		// Stop at next major section
		if (text.includes("syllabus") ||
			text.includes("course content") ||
			text.includes("faq") ||
			text.includes("frequently asked") ||
			text.match(/^1\.3/) ||
			(tagName.match(/^H[1-3]$/i) && !text.includes("objectives"))) {
			objectivesEnd = i;
			break;
		}
	}

	objectivesEnd = objectivesEnd !== -1 ? objectivesEnd : elementsArray.length;

	console.log("Course Objectives section found at index:", objectivesStart, "ends at:", objectivesEnd);

	// Extract ALL content from Course Objectives section
	const objectivesElements = elementsArray.slice(objectivesStart, objectivesEnd);

	for (const element of objectivesElements) {
		const text = element.textContent.trim();
		const lowerText = text.toLowerCase();
		const tagName = element.tagName;

		// Skip empty elements
		if (!text) continue;

		// Skip the heading itself
		if (lowerText.includes("objectives") && element.tagName.match(/^H[1-6]$/i)) {
			continue;
		}

		// Capture intro paragraph (first substantial paragraph)
		if (tagName === 'P' && !courseData.courseObjectivesIntro && text.length > 20) {
			courseData.courseObjectivesIntro = element.innerHTML.trim();
			continue;
		}

		// Capture ALL lists (UL, OL) in the section
		if (tagName === 'UL' || tagName === 'OL') {
			const items = element.querySelectorAll('li');
			items.forEach(item => {
				const itemText = item.innerHTML.trim();
				if (itemText) {
					courseData.courseObjectivesList.push(itemText);
				}
			});
		}

		// Also capture standalone LI elements (sometimes mammoth creates these)
		if (tagName === 'LI') {
			const itemText = element.innerHTML.trim();
			if (itemText) {
				courseData.courseObjectivesList.push(itemText);
			}
		}
	}

	console.log("Extracted Course Objectives:", courseData.courseObjectivesList.length);
	console.log("Intro text:", courseData.courseObjectivesIntro ? courseData.courseObjectivesIntro.substring(0, 50) + "..." : "Not found");
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


function splitLessonSegments(text) {
	if (!text) return [];

	const lessonRegex = /(lesson\s*\d+:[\s\S]*?)(?=(lesson\s*\d+:)|$)/gi;
	const segments = [];
	let match;

	while ((match = lessonRegex.exec(text)) !== null) {
		segments.push(match[1].trim());
	}

	return segments.length > 0 ? segments : [];
}

function getLessonNumber(title) {
	if (!title) return null;
	const match = title.match(/lesson\s*(\d+)/i);
	return match ? parseInt(match[1], 10) : null;
}

function getModuleNumber(title) {
	if (!title) return null;
	const match = title.match(/module\s*(\d+)/i);
	return match ? parseInt(match[1], 10) : null;
}

function sortNumberedEntries(entries, numberExtractor) {
	if (!Array.isArray(entries) || entries.length === 0) return entries || [];

	return entries
		.map((entry, index) => ({
			...entry,
			_originalIndex: index,
			_number: numberExtractor(entry)
		}))
		.sort((a, b) => {
			const hasNumA = typeof a._number === 'number';
			const hasNumB = typeof b._number === 'number';

			if (hasNumA && hasNumB) return a._number - b._number;
			if (hasNumA) return -1;
			if (hasNumB) return 1;
			return a._originalIndex - b._originalIndex;
		})
		.map(({ _originalIndex, _number, ...rest }) => rest);
}

function extractAllSyllabusContent(elementsArray) {
	const modules = [];
	let currentModule = null;
	let currentLesson = null;
	let foundSyllabusContent = false;

	// Find where the syllabus content actually starts
	// First, find Course Objectives section to ensure we start after it
	let objectivesEndIndex = -1;
	for (let i = 0; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim().toLowerCase();
		if ((text.includes("course objectives") || text.includes("1.2")) &&
			(element.tagName.match(/^H[1-6]$/i) || text.match(/^\d+\.\d*\s*.*course\s*objectives/i))) {
			// Find where Course Objectives section ends
			for (let j = i + 1; j < elementsArray.length; j++) {
				const nextText = elementsArray[j].textContent.trim().toLowerCase();
				if (nextText.includes("syllabus") || nextText.includes("1.3") ||
					nextText.includes("course content")) {
					objectivesEndIndex = j;
					break;
				}
			}
			break;
		}
	}

	let syllabusStartIndex = -1;
	for (let i = (objectivesEndIndex !== -1 ? objectivesEndIndex : 0); i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim().toLowerCase();

		// Look for syllabus/content headings (but skip Course Objectives)
		if ((text.includes("course content") ||
			text.includes("syllabus") ||
			text.includes("lessons") ||
			text.includes("modules")) &&
			!text.includes("course objectives")) {
			syllabusStartIndex = i;
			foundSyllabusContent = true;
			break;
		}
	}

	// If no specific syllabus heading found, start after Course Objectives
	if (syllabusStartIndex === -1) {
		syllabusStartIndex = objectivesEndIndex !== -1 ? objectivesEndIndex : 0;
	}

	console.log("Syllabus extraction starting from index:", syllabusStartIndex);

	for (let i = syllabusStartIndex; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		const tagName = element.tagName;

		if (!text) continue;

		const lowerText = text.toLowerCase();

		// Skip Course Objectives content
		if (lowerText.includes("course objectives") ||
			lowerText.match(/^\d+\.\d*\s*.*course\s*objectives/i)) {
			continue;
		}

		// Skip the main syllabus heading itself
		if (lowerText.includes("course content") ||
			lowerText.includes("syllabus") ||
			lowerText.includes("lessons") ||
			lowerText.includes("modules")) {
			continue;
		}

		// Stop if we hit final examination or another major section
		if (lowerText.includes("final examination") ||
			lowerText.includes("faq") ||
			lowerText.includes("frequently asked questions") ||
			(tagName.match(/^H[1-3]$/i) && i > syllabusStartIndex + 2)) {
			break;
		}

		// Handle MODULE pattern
		if (text.match(/^Module\s*\d+:/i) || text.match(/^MODULE\s*\d+/i)) {
			if (currentModule) {
				if (currentLesson) {
					currentModule.lessons.push(currentLesson);
					currentLesson = null;
				}
				modules.push(currentModule);
			}

			currentModule = {
				title: text,
				description: "",
				lessons: []
			};

			// Look for module description in next paragraphs
			for (let j = i + 1; j < Math.min(i + 3, elementsArray.length); j++) {
				const nextElement = elementsArray[j];
				const nextText = nextElement.textContent.trim();
				const nextTag = nextElement.tagName;

				if (nextTag === 'P' && nextText &&
					!nextText.match(/^Module\s*\d+:/i) &&
					!nextText.match(/^Lesson\s*\d+:/i) &&
					!nextText.match(/^MODULE\s*\d+/i) &&
					!nextText.match(/^LESSON\s*\d+/i) &&
					!nextText.toLowerCase().includes("final examination")) {
					currentModule.description = nextText;
					break;
				}

				if (nextText.toLowerCase().includes("final examination")) {
					break;
				}
			}
		}
		// Handle LESSON pattern (direct lessons without modules)
		else if (text.match(/lesson\s*\d+:/i)) {
			// If we encounter a lesson but no module exists, create a default module
			if (!currentModule) {
				currentModule = {
					title: `${courseData.courseTitle || 'Course'} Content`,
					description: "",
					lessons: []
				};
			}

			// Save previous lesson if exists
			if (currentLesson) {
				currentModule.lessons.push(currentLesson);
			}

			const lessonSegments = splitLessonSegments(text);
			currentLesson = {
				title: lessonSegments[0] || text,
				items: []
			};

			// Look for lesson content in nested lists or next elements
			const nestedList = element.querySelector('ul');
			if (nestedList) {
				const listItems = nestedList.querySelectorAll('li');
				listItems.forEach(item => {
					const itemText = item.innerHTML.trim();
					if (itemText && !itemText.match(/^Lesson\s*\d+:/i)) {
						currentLesson.items.push(itemText);
					}
				});
			}

			if (lessonSegments.length > 1 && currentModule) {
				lessonSegments.slice(1).forEach(segment => {
					if (segment.trim()) {
						currentModule.lessons.push({
							title: segment.trim(),
							items: []
						});
					}
				});
			}
		}
		// Handle list items for current lesson
		else if (tagName === 'UL' && currentLesson) {
			const listItems = element.querySelectorAll('li');
			listItems.forEach(item => {
				const itemText = item.innerHTML.trim();
				// Only add if it's not another lesson heading
				if (itemText && !itemText.match(/^Lesson\s*\d+:/i)) {
					currentLesson.items.push(itemText);
				}
			});
		}
		// Handle standalone list items that might be lessons
		else if (tagName === 'LI' && !text.match(/^Lesson\s*\d+:/i)) {
			// If we have a current lesson, add to its items
			if (currentLesson) {
				currentLesson.items.push(element.innerHTML.trim());
			}
			// If no current lesson but we have a module, create a lesson from this item
			else if (currentModule && text.length > 10) {
				currentLesson = {
					title: `Lesson ${currentModule.lessons.length + 1}: ${text.substring(0, 50)}...`,
					items: [element.innerHTML.trim()]
				};
			}
		}
		// Handle paragraphs that might be module descriptions
		else if (tagName === 'P' && text && currentModule && !currentModule.description) {
			// Only use as description if it's substantial text and not a heading
			if (text.length > 20 && !text.match(/^Module\s*\d+:/i) && !text.match(/^Lesson\s*\d+:/i)) {
				currentModule.description = text;
			}
		}
	}

	// Push any remaining module/lesson
	if (currentLesson) {
		if (currentModule) {
			currentModule.lessons.push(currentLesson);
		} else {
			// Create a default module if we have lessons but no module
			currentModule = {
				title: `${courseData.courseTitle || 'Course'} Content`,
				description: "",
				lessons: [currentLesson]
			};
		}
	}

	if (currentModule) {
		modules.push(currentModule);
	}

	// If no modules found but we have syllabus content, try alternative extraction
	if (modules.length === 0 && foundSyllabusContent) {
		console.log("No modules found with standard extraction, trying alternative method...");
		modules.push(...extractLessonsDirectly(elementsArray, syllabusStartIndex));
	}

	modules.forEach(module => {
		if (module.lessons && module.lessons.length > 0) {
			module.lessons = sortNumberedEntries(module.lessons, lesson => getLessonNumber(lesson.title));
		}
	});

	const sortedModules = sortNumberedEntries(modules, module => getModuleNumber(module.title));

	console.log("Extracted modules:", sortedModules.length);
	sortedModules.forEach((module, idx) => {
		console.log(`Module ${idx + 1}: ${module.title}, Lessons: ${module.lessons.length}`);
	});

	return sortedModules;
}

function extractLessonsDirectly(elementsArray, startIndex) {
	const modules = [];
	const defaultModule = {
		title: `${courseData.courseTitle || 'Course'} Content`,
		description: "",
		lessons: []
	};

	let currentLesson = null;
	let inSyllabusSection = false;

	for (let i = startIndex; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		const tagName = element.tagName;
		const lowerText = text.toLowerCase();

		if (!text) continue;

		// Skip Course Objectives content
		if (lowerText.includes("course objectives") ||
			lowerText.match(/^\d+\.\d*\s*.*course\s*objectives/i)) {
			continue;
		}

		// Check if we're in the syllabus section
		if (!inSyllabusSection &&
			(lowerText.includes("course content") ||
				lowerText.includes("syllabus") ||
				lowerText.includes("lessons"))) {
			inSyllabusSection = true;
			continue;
		}

		// Stop conditions
		if (inSyllabusSection &&
			(lowerText.includes("final examination") ||
				lowerText.includes("faq") ||
				(tagName.match(/^H[1-3]$/i) && i > startIndex + 3 && !lowerText.includes("lesson")))) {
			break;
		}

		if (!inSyllabusSection) continue;

		// Look for lesson patterns
		if (text.match(/^Lesson\s*\d+:/i) || text.match(/^LESSON\s*\d+/i) ||
			(tagName === 'P' && text.match(/\d+\./)) || // Numbered items
			(tagName.match(/^H[3-4]$/i) && text.length < 100)) { // Likely lesson headings

			if (currentLesson) {
				defaultModule.lessons.push(currentLesson);
			}

			currentLesson = {
				title: text,
				items: []
			};

			// Check for nested content
			const nestedList = element.querySelector('ul');
			if (nestedList) {
				const listItems = nestedList.querySelectorAll('li');
				listItems.forEach(item => {
					currentLesson.items.push(item.innerHTML.trim());
				});
			}
		}
		// Handle list items
		else if (tagName === 'UL' && currentLesson) {
			const listItems = element.querySelectorAll('li');
			listItems.forEach(item => {
				const itemText = item.innerHTML.trim();
				if (itemText && !itemText.match(/^Lesson\s*\d+:/i)) {
					currentLesson.items.push(itemText);
				}
			});
		}
		// Handle standalone list items
		else if (tagName === 'LI' && currentLesson && !text.match(/^Lesson\s*\d+:/i)) {
			currentLesson.items.push(element.innerHTML.trim());
		}
	}

	// Add the last lesson
	if (currentLesson) {
		defaultModule.lessons.push(currentLesson);
	}

	if (defaultModule.lessons.length > 0) {
		defaultModule.lessons = sortNumberedEntries(defaultModule.lessons, lesson => getLessonNumber(lesson.title));
		modules.push(defaultModule);
	}

	return modules;
}

function generateOverviewCode() {
	if (!courseData.fileProcessed) return utils.showNotification("Please upload and process a DOCX file first.", "warning");

	const videoHtml = `<!-- <div class="col-md-5 col-sm-12 elementor-col-40 elementor-column ml-md-3 p-0 pb-0 pt-0 verified-field-container" style="float:right"><div class="demo-video"><iframe title="${courseData.courseTitle || 'Course Video'}" src="https://player.vimeo.com/video/680313019?h=6c9335ab94" width="560" height="200" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen data-ready="true"></iframe><img src="" class="w-100 ps-3" alt="${courseData.courseTitle || 'Course Name'}"></div></div> -->`;

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
			tempDiv.querySelectorAll("ul, ol").forEach(list => { list.className = ""; });
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

	let listItemsHtml = "";

	if (courseData.courseObjectivesList.length > 0) {
		listItemsHtml = courseData.courseObjectivesList.map(item => `<li>${item}</li>`).join('\n');
	} else {
		listItemsHtml = "<li>No course objectives found in the document.</li>";
	}

	// Use extracted intro text if available, otherwise use default
	const introText = courseData.courseObjectivesIntro || "After completing this course, the learner will be able to:";
	const courseObjectivesHtml = `<h2 class="h3">Course Objectives</h2><p class="m-0"><strong>${introText}</strong></p><ul>${listItemsHtml}</ul>`;

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
                    <p>Description: ${module.description || 'No description'}</p>
                    <p>Lessons: ${module.lessons.length}</p>
            `;

			module.lessons.forEach((lesson, lessonIndex) => {
				debugInfo += `
                    <div style="margin-left: 20px; border-left: 2px solid #007bff; padding-left: 10px; margin: 10px 0;">
                        <h6 class="fs-5">Lesson ${lessonIndex + 1}: ${lesson.title}</h6>
                        <p>Items: ${lesson.items.length}</p>
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

	// Check if this is a lessons-only structure
	const isLessonsOnly = courseData.syllabusModules.length === 1 &&
		courseData.syllabusModules[0] &&
		(courseData.syllabusModules[0].title.includes('Content') ||
			courseData.syllabusModules[0].title.includes('Lessons'));

	if (courseData.syllabusModules.length > 0) {
		courseData.syllabusModules.forEach((module, moduleIndex) => {
			totalLessons += module.lessons.length;

			if (isLessonsOnly) {
				// LESSONS-ONLY STRUCTURE: Each lesson in separate sbox
				module.lessons.forEach((lesson, lessonIndex) => {
					let lessonItemsHTML = '';

					if (lesson.items && lesson.items.length > 0) {
						lessonItemsHTML = lesson.items.map(item => {
							const cleanItem = item.replace(/\s+/g, ' ').trim();
							return `<li>${cleanItem}</li>`;
						}).join('');

						modulesHTML += `
                            <div class="sbox">
                                <h4 class="fs-5 fw-normal font-poppins">${lesson.title}</h4>
                                <hr class="border-3 my-2" style="background: #ffcd05;opacity: 1;padding: 2px;">
                                <ul>
                                    ${lessonItemsHTML}
                                </ul>
                            </div>`;
					} else {
						modulesHTML += `
                            <div class="sbox">
                                <h4 class="fs-5 fw-normal font-poppins">${lesson.title}</h4>
                            </div>`;
					}
				});
			} else {
				// MODULE-BASED STRUCTURE: Module with lessons inside
				let lessonsHTML = '';

				module.lessons.forEach((lesson, lessonIndex) => {
					let lessonItemsHTML = '';

					if (lesson.items && lesson.items.length > 0) {
						lessonItemsHTML = lesson.items.map(item => {
							const cleanItem = item.replace(/\s+/g, ' ').trim();
							return `<li>${cleanItem}</li>`;
						}).join('');

						lessonsHTML += `
                            <li>
                                ${lesson.title}
                                <ul>
                                    ${lessonItemsHTML}
                                </ul>
                            </li>`;
					} else {
						lessonsHTML += `
                            <li>
                                <strong>${lesson.title}</strong>
                            </li>`;
					}
				});

				// MODULE STRUCTURE
				modulesHTML += `
                    <div class="sbox">
                        <h4 class="fs-5 fw-normal font-poppins">${module.title}</h4>
                        <hr class="border-3 my-2" style="background: #ffcd05;opacity: 1;padding: 2px;">`;

				if (module.description) {
					modulesHTML += `
                        <p class="pl-3 mb-2">${module.description}</p>`;
				}

				modulesHTML += `
                        <ul>
                            ${lessonsHTML}
                        </ul>
                    </div>`;
			}
		});
	} else {
		modulesHTML = '<div class="sbox"><p>No syllabus content could be extracted. Please check the document structure.</p></div>';
	}

	const courseTitle = courseData.courseTitle || 'Course';

	return `<h2 class="fs-2 mb-3">${courseTitle} Course Syllabus</h2>
        <p>This ${courseTitle} consists of ${totalLessons} lessons ${!isLessonsOnly && courseData.syllabusModules.length > 1 ? `divided into ${courseData.syllabusModules.length} modules` : ''}. Students are required to take each lesson in sequential order as listed below.</p>
        <div style="background: #f2f3f5;padding-bottom:1px;">
            <div class="border-0 pl-3 sbox" style="background-color: #ffcd05;">
                <div class="fs-5 fw-normal lh-sm m-0 text-uppercase">${isLessonsOnly ? 'Lessons' : 'Lessons'}</div>
            </div>
            <h3 class="font-poppins fs-5 fw-normal pl-3 sbox">Introduction</h3>
            ${modulesHTML}
            <div class="sbox">
                <h4 class="font-poppins fs-5 m-0 fw-normal">Final Examination</h4>
            </div>
        </div>`;
}

function downloadDemoFile() {
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = 'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354187/demo-file-of-website-content-for-3-section.docx';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a)
}