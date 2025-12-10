// ========== BLOG CONTENT GENERATOR (FINAL) ==========
let blogData = { title: "", content: [], imageCount: 0, fileProcessed: false };
let blogFAQData = { 
    faqData: [], 
    fileProcessed: false 
};

function uploadBlogFile() {
    const file = document.getElementById("blogFileInput").files[0];
    if (!file) { 
        utils.showNotification("Please select a file to upload.", "warning"); 
        return; 
    }

    const progressInterval = utils.showProgress("blogProgress", "blogProgressText", "Reading DOCX file...");
    const reader = new FileReader();
    
    reader.onload = async event => {
        try {
            document.getElementById("blogProgressText").textContent = "Converting DOCX to HTML...";
            const mammothResult = await mammoth.convertToHtml({ arrayBuffer: event.target.result });
            const rawHtml = mammothResult.value || "";

            // Store the raw HTML for FAQ extraction
            window.blogRawHTML = rawHtml;
            console.log("Raw HTML stored for FAQ extraction");

            document.getElementById("blogProgressText").textContent = "Optimizing HTML structure...";
            const optimizedHtml = enhancedCleanHTML(rawHtml);

            document.getElementById("blogProgressText").textContent = "Extracting blog content...";
            extractBlogContent(optimizedHtml, progressInterval);
            
        } catch (error) {
            console.error("Conversion error:", error);
            utils.hideProgress("blogProgress", progressInterval);
            utils.showNotification("Error processing the file. Please try again.", "error");
        }
    };
    
    reader.onerror = () => { 
        utils.hideProgress("blogProgress", progressInterval); 
        utils.showNotification("Error reading the file. Please try again.", "error"); 
    };
    
    reader.readAsArrayBuffer(file);
}

/** Enhanced HTML cleanup: remove meta blocks & unwanted lines, clean HTML */
function enhancedCleanHTML(html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const metaMarkers = ['Meta Description', 'Meta Title', 'meta description', 'meta title', 'Slug', 'Category', 'category', 'slug', 'relevant courses'];
    const lineRemoveMarkers = ['link:', 'alt-text', 'alt text:', 'title text:'];

    const allElements = Array.from(tempDiv.querySelectorAll('*'));
    let removeFromIndex = -1;
    
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        const text = (el.textContent || "").trim();
        if (!text) continue;
        const lowerText = text.toLowerCase();

        if (metaMarkers.some(m => lowerText.startsWith(m))) { 
            removeFromIndex = i; 
            break; 
        }
        
        if (lineRemoveMarkers.some(m => lowerText.startsWith(m))) { 
            el.remove(); 
        }
    }

    if (removeFromIndex !== -1) {
        for (let j = removeFromIndex; j < allElements.length; j++) {
            const nodeToRemove = allElements[j];
            if (nodeToRemove && nodeToRemove.parentNode) { 
                try { 
                    nodeToRemove.parentNode.removeChild(nodeToRemove); 
                } catch (e) { } 
            }
        }
    }

    cleanHTML(tempDiv);
    improveListStructure(tempDiv);
    return tempDiv.innerHTML;
}

/** Clean HTML: remove inline styles/classes, unwrap spans/divs, remove empty nodes */
function cleanHTML(element) {
    element.querySelectorAll('*[style]').forEach(el => el.removeAttribute('style'));
    element.querySelectorAll('*[class]').forEach(el => el.removeAttribute('class'));

    Array.from(element.querySelectorAll('span')).forEach(span => {
        const parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
    });

    Array.from(element.querySelectorAll('div')).forEach(div => {
        const parent = div.parentNode;
        if (!parent) return;
        while (div.firstChild) parent.insertBefore(div.firstChild, div);
        if (div.parentNode) parent.removeChild(div);
    });

    element.innerHTML = element.innerHTML.replace(/(<br\s*\/?>\s*){2,}/gi, '<br/>');

    Array.from(element.querySelectorAll('*')).forEach(el => {
        if (el.tagName === 'IMG') return;
        if (!el.textContent.trim() && el.children.length === 0) el.remove();
    });
}

/** Improve lists: remove empty <li>, remove empty <ul>/<ol> */
function improveListStructure(element) {
    Array.from(element.querySelectorAll('ul,ol')).forEach(list => {
        Array.from(list.querySelectorAll('li')).forEach(li => {
            li.innerHTML = li.innerHTML.replace(/&gt;/g, '');
            if (!li.textContent.trim() && li.children.length === 0) li.remove();
        });
        if (!list.children.length) list.remove();
    });
}

/** Extract blog content: title + content array */
function extractBlogContent(html, progressInterval) {
    try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        blogData = { title: "", content: [], imageCount: 0, fileProcessed: false };
        cleanHTML(tempDiv);
        extractTitle(tempDiv);
        processContentElements(tempDiv);

        blogData.fileProcessed = true;
        utils.hideProgress("blogProgress", progressInterval);

        if (blogData.imageCount > 0) {
            document.getElementById("imageInputsContainer").style.display = "block";
            createImageInputs();
            utils.showNotification(`Blog content extracted successfully! Found ${blogData.imageCount} image placeholders.`, "success");
        } else {
            document.getElementById("imageInputsContainer").style.display = "none";
            utils.showNotification("Blog content extracted successfully! No images detected.", "success");
        }
    } catch (error) {
        console.error("Extraction error:", error);
        utils.hideProgress("blogProgress", progressInterval);
        utils.showNotification("Error extracting content. Please check the file format.", "error");
    }
}

/** Prefer H1 as title or fallback */
function extractTitle(element) {
    const h1 = element.querySelector('h1');
    if (h1 && h1.textContent.trim()) { 
        blogData.title = h1.textContent.trim(); 
        h1.remove(); 
        return; 
    }

    for (const p of Array.from(element.querySelectorAll('p'))) {
        const text = (p.textContent || "").trim();
        if (text && text.length > 10 && text.length < 200) { 
            blogData.title = text; 
            p.remove(); 
            return; 
        }
    }

    for (const el of Array.from(element.querySelectorAll('*'))) {
        const text = (el.textContent || "").trim();
        if (text && text.length > 5) { 
            blogData.title = text.split('.')[0]; 
            return; 
        }
    }
}

/** Process content nodes in order */
function processContentElements(rootElement) {
    const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_ELEMENT, null, false);
    const metaMarkers = ['meta description', 'meta title', 'slug', 'relevant courses'];
    let node;
    
    while (node = walker.nextNode()) {
        if (!node || !node.textContent) continue;
        const text = (node.textContent || "").trim();
        if (!text) continue;
        const lowerText = text.toLowerCase();
        
        if (metaMarkers.some(m => lowerText.startsWith(m))) break;

        const tag = node.tagName.toLowerCase();
        if (tag.match(/^h[1-6]$/)) {
            const level = parseInt(tag.charAt(1));
            blogData.content.push({ 
                type: 'heading', 
                level: level, 
                className: `fs-${level}`, 
                content: node.innerHTML.trim() 
            });
        } else if (tag === 'p') {
            const html = node.innerHTML.trim();
            if (html && html.replace(/<[^>]*>/g, '').trim().length > 0) {
                blogData.content.push({ 
                    type: 'paragraph', 
                    content: html 
                });
            }
        } else if (tag === 'ul' || tag === 'ol') {
            const items = Array.from(node.querySelectorAll('li'))
                .map(li => li.innerHTML.trim())
                .filter(i => i.length > 0);
            if (items.length) {
                blogData.content.push({ 
                    type: 'list', 
                    ordered: tag === 'ol', 
                    items: items 
                });
            }
        } else if (tag === 'img') {
            blogData.imageCount++;
            blogData.content.push({ 
                type: 'image', 
                alt: node.getAttribute('alt') || `Blog image ${blogData.imageCount}`, 
                placeholder: `[Image ${blogData.imageCount}]` 
            });
        }
    }
}

/** Create image input fields */
function createImageInputs() {
    const container = document.getElementById("imageInputs"); 
    if (!container) return; 
    container.innerHTML = "";
    
    for (let i = 1; i <= blogData.imageCount; i++) {
        const inputGroup = document.createElement("div");
        inputGroup.className = "mb-3";
        inputGroup.innerHTML = `
            <label class="form-label">Image ${i} URL:</label>
            <input type="text" class="form-control image-url-input" 
                   id="imageUrl${i}" 
                   placeholder="https://example.com/image${i}.jpg" 
                   data-index="${i}">
        `;
        container.appendChild(inputGroup);
    }
}

/** Add image manually */
function addImageInput() {
    blogData.imageCount++;
    const container = document.getElementById("imageInputs"); 
    if (!container) return;
    
    const inputGroup = document.createElement("div");
    inputGroup.className = "mb-3";
    inputGroup.innerHTML = `
        <label class="form-label">Image ${blogData.imageCount} URL:</label>
        <input type="text" class="form-control image-url-input" 
               id="imageUrl${blogData.imageCount}" 
               placeholder="https://example.com/image${blogData.imageCount}.jpg" 
               data-index="${blogData.imageCount}">
    `;
    container.appendChild(inputGroup);
}

/** Generate final blog HTML */
function generateBlogCode() {
    if (!blogData.fileProcessed) { 
        utils.showNotification("Please upload and process a DOCX file first.", "warning"); 
        return; 
    }

    const featuredImageUrl = (document.getElementById("featuredImageUrl") || { value: "" }).value.trim();
    const featuredImageAlt = (document.getElementById("featuredImageAlt") || { value: "" }).value.trim();
    const featuredImageTitle = (document.getElementById("featuredImageTitle") || { value: "" }).value.trim();

    const imageUrls = []; 
    document.querySelectorAll('.image-url-input').forEach(input => { 
        if (input && input.value && input.value.trim()) { 
            const index = parseInt(input.getAttribute('data-index')) - 1; 
            imageUrls[index] = input.value.trim(); 
        } 
    });

    let imageIndex = 0, blogHTML = "";
    
    if (blogData.title) {
        blogHTML += `<h1 class="text-center fs-1">${escapeHtml(blogData.title)}</h1><hr>\n\n`;
    }
    
    if (featuredImageUrl) {
        let imgTag = `<img src="${escapeAttr(featuredImageUrl)}"`;
        if (featuredImageAlt) imgTag += ` alt="${escapeAttr(featuredImageAlt)}"`;
        if (featuredImageTitle) imgTag += ` title="${escapeAttr(featuredImageTitle)}"`;
        imgTag += ` class="w-100 mb-3">\n\n`;
        blogHTML += imgTag;
    }

    for (const item of blogData.content) {
        switch (item.type) {
            case 'heading': {
                const level = item.level || 2;
                const className = item.className ? ` ${item.className}` : '';
                blogHTML += level === 1 
                    ? `<h1 class="text-center${className}">${item.content}</h1>\n\n`
                    : `<h${level} class="${item.className}">${item.content}</h${level}>\n\n`;
                break;
            }
            case 'paragraph': {
                const content = (item.content || "").trim();
                if (content && content.replace(/<[^>]*>/g, '').trim().length > 0) {
                    blogHTML += `<p>${content}</p>\n\n`;
                }
                break;
            }
            case 'list': {
                const tag = item.ordered ? 'ol' : 'ul';
                blogHTML += `<${tag}>\n`;
                item.items.forEach(li => { 
                    if (li && li.trim().length > 0) {
                        blogHTML += `  <li>${li}</li>\n`; 
                    }
                });
                blogHTML += `</${tag}>\n\n`;
                break;
            }
            case 'image': {
                const imageUrl = imageUrls[imageIndex] || "#";
                blogHTML += `<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(item.alt)}" class="w-100 mb-3">\n\n`;
                imageIndex++;
                break;
            }
        }
    }

    blogHTML += `<div class="fancy-line"></div><style>.fancy-line{width:60%;margin:20px auto;border-top:2px solid #116466;text-align:center;position:relative}.fancy-line::after{content:"✦ ✦ ✦";position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:white;padding:0 10px;color:red}</style>`;

    const blogCodeEl = document.getElementById("blogCode");
    if (blogCodeEl) blogCodeEl.value = blogHTML;
    showGeneratedCode('blog', 'blogContentCodeSection');
    utils.showNotification("Blog code generated successfully!", "success");
}

// ========== ENHANCED BLOG FAQ GENERATOR ==========

function generateBlogFAQs() {
    if (!blogData.fileProcessed) {
        utils.showNotification("Please upload and process a DOCX file first.", "warning");
        return;
    }
    
    // Extract FAQs using the SAME logic as course generator
    extractBlogFAQContent();
    
    if (blogFAQData.faqData.length === 0) {
        utils.showNotification("No FAQ content found in the blog document.", "warning");
        return;
    }

    // Generate FAQ HTML using the SAME logic as course generator
    const faqHTML = generateBlogFAQHTML();
    
    // Display FAQ code
    const faqCodeElement = document.getElementById("blogFaqCode");
    if (faqCodeElement) {
        faqCodeElement.value = faqHTML;
    }
    
    // Show the FAQ code section
    showGeneratedCode('blog', 'blogFaqCodeSection');
    utils.showNotification(`Blog FAQ code generated successfully! Found ${blogFAQData.faqData.length} questions.`, "success");
}

/** Extract FAQ content - EXACTLY like course generator */
function extractBlogFAQContent() {
    blogFAQData.faqData = [];
    
    console.log("Extracting FAQs from blog content (using course logic)...");
    
    // Use the raw HTML
    if (!window.blogRawHTML) {
        console.warn("Raw HTML not available.");
        return;
    }
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = window.blogRawHTML;
    cleanHTML(tempDiv);
    
    // Convert to array of elements like course generator does
    const elementsArray = Array.from(tempDiv.children);
    
    let faqStart = -1;
    
    // Find FAQ heading - EXACTLY like course generator
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
    
    // Find where FAQ section ends - EXACTLY like course generator
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
    
    // Extract FAQs using EXACTLY the same logic as course generator
    let currentQuestion = "";
    let currentAnswer = "";
    let collectingAnswer = false;
    
    for (let i = faqStart + 1; i < faqEnd; i++) {
        const element = elementsArray[i];
        const text = element.textContent.trim();
        const tagName = element.tagName;
        const innerHTML = element.innerHTML.trim();
        
        if (!text) continue;
        
        // Check if this is a question - EXACTLY like course generator
        const isQuestion = (
            /^\d+\.\s+/.test(text) ||
            (innerHTML.includes('<strong>') && text.includes('?')) ||
            (innerHTML.includes('<b>') && text.includes('?')) ||
            (text.endsWith('?') && text.length < 200)
        );
        
        if (isQuestion) {
            if (currentQuestion && currentAnswer) {
                blogFAQData.faqData.push({
                    question: cleanBlogFAQText(currentQuestion),
                    answer: currentAnswer // Keep HTML formatting
                });
                console.log("Saved FAQ:", currentQuestion.substring(0, 50) + "...");
            }
            
            currentQuestion = text;
            
            // Check if answer is in same element - EXACTLY like course generator
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
                currentAnswer += " " + element.outerHTML; // Keep HTML
            } else {
                currentAnswer = element.outerHTML; // Keep HTML
            }
            
            // Check if next element is a new question - EXACTLY like course generator
            const nextIsQuestion = i + 1 < faqEnd && (
                /^\d+\.\s+/.test(elementsArray[i + 1].textContent.trim()) ||
                (elementsArray[i + 1].innerHTML.includes('<strong>') && 
                 elementsArray[i + 1].textContent.trim().includes('?'))
            );
            
            if (nextIsQuestion) {
                if (currentQuestion && currentAnswer) {
                    blogFAQData.faqData.push({
                        question: cleanBlogFAQText(currentQuestion),
                        answer: currentAnswer // Keep HTML formatting
                    });
                    console.log("Saved FAQ (next question detected):", currentQuestion.substring(0, 50) + "...");
                }
                currentQuestion = "";
                currentAnswer = "";
                collectingAnswer = false;
            }
        }
    }
    
    // Save the last FAQ
    if (currentQuestion && currentAnswer) {
        blogFAQData.faqData.push({
            question: cleanBlogFAQText(currentQuestion),
            answer: currentAnswer // Keep HTML formatting
        });
        console.log("Saved final FAQ:", currentQuestion.substring(0, 50) + "...");
    }
    
    console.log("Total FAQ items extracted:", blogFAQData.faqData.length);
    blogFAQData.faqData.forEach((faq, index) => {
        console.log(`FAQ ${index + 1}:`, faq.question.substring(0, 100) + "...");
    });
}

/** Clean FAQ text - EXACTLY like course generator */
function cleanBlogFAQText(text) {
    if (!text) return "";
    
    let cleaned = text;
    
    cleaned = cleaned.replace(/^\d+\.\s*/, '');
    cleaned = cleaned.replace(/^Q:\s*/i, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

/** Generate FAQ HTML - EXACTLY like course generator */
function generateBlogFAQHTML() {
    if (blogFAQData.faqData.length === 0) {
        return "<!-- No FAQs found in the FAQ section -->";
    }
    
    // Use EXACTLY the same HTML structure as course generator
    let faqHTML = `<div class="faq-section">\n`;
    
    blogFAQData.faqData.forEach((faq, index) => {
        const question = cleanBlogFAQText(faq.question);
        let answer = faq.answer; // Keep original HTML
        
        // Clean up answer like course generator does
        answer = answer.replace(/^A:\s*/i, '').trim();
        
        if (question && answer) {
            faqHTML += `  <div class="faq-item">\n`;
            faqHTML += `    <div class="faq-question">${index + 1}. ${escapeHtml(question)}</div>\n`;
            faqHTML += `    <div class="faq-answer">${answer}</div>\n`; // Keep HTML formatting
            faqHTML += `  </div>\n`;
            
            if (index < blogFAQData.faqData.length - 1) {
                faqHTML += `  <hr>\n`;
            }
        }
    });
    
    faqHTML += `</div>`;
    
    return faqHTML;
}

function debugBlogFAQs() {
    if (!blogData.fileProcessed) {
        utils.showNotification("Please upload and process a DOCX file first.", "warning");
        return;
    }
    
    // Extract FAQs using new method
    extractBlogFAQContent();
    
    let debugHTML = `<h3>Blog FAQ Debug Information</h3>`;
    debugHTML += `<p>Total FAQ items found: ${blogFAQData.faqData.length}</p>`;
    debugHTML += `<p><strong>Note:</strong> Using EXACT same extraction logic as course FAQs</p>`;
    
    if (blogFAQData.faqData.length === 0) {
        debugHTML += `<p>No FAQ items were extracted. This could be because:</p>`;
        debugHTML += `<ul>`;
        debugHTML += `<li>The blog doesn't have a FAQ section</li>`;
        debugHTML += `<li>The FAQ section wasn't properly identified</li>`;
        debugHTML += `<li>The questions don't follow the expected format</li>`;
        debugHTML += `</ul>`;
    } else {
        debugHTML += `<div class="faq-debug-items">`;
        blogFAQData.faqData.forEach((faq, index) => {
            debugHTML += `<div class="debug-faq-item mb-4 p-3 border">`;
            debugHTML += `<h4>FAQ ${index + 1}:</h4>`;
            debugHTML += `<p><strong>Question:</strong> ${faq.question}</p>`;
            debugHTML += `<p><strong>Answer (RAW with HTML):</strong></p>`;
            debugHTML += `<div style="background: #f8f9fa; padding: 10px; border: 1px solid #dee2e6; border-radius: 5px;">${faq.answer}</div>`;
            debugHTML += `<p><strong>Answer Length:</strong> ${faq.answer.length} characters</p>`;
            debugHTML += `</div>`;
        });
        debugHTML += `</div>`;
    }
    
    openPreviewDrawerWithContent(debugHTML, "Blog FAQ Debug");
    utils.showNotification("Blog FAQ debug information displayed", "info");
}

/** Helpers */
function escapeHtml(str) { 
    if (str === null || str === undefined) return ''; 
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(str) { 
    if (str === null || str === undefined) return ''; 
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function showGeneratedCode(type, sectionId) {
    const emptyState = document.getElementById(`${type}EmptyState`);
    if (emptyState) emptyState.classList.add('d-none');
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
}
function downloadDemoFile2(){
    const a=document.createElement('a');
    a.style.display='none';
    a.href='https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354092/Blog_Sample_File.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a)
}