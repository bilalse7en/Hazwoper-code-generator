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
    
    // Extract FAQs from under FAQ heading
    extractFAQsUnderHeading();
    
    if (blogFAQData.faqData.length === 0) {
        utils.showNotification("No FAQ content found in the blog document.", "warning");
        return;
    }

    // Generate FAQ HTML
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

/** Extract FAQs from under FAQ heading only */
function extractFAQsUnderHeading() {
    blogFAQData.faqData = [];
    
    console.log("Extracting FAQs from under FAQ heading...");
    
    // Use the raw HTML
    if (!window.blogRawHTML) {
        console.warn("Raw HTML not available.");
        return;
    }
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = window.blogRawHTML;
    cleanHTML(tempDiv);
    
    // Step 1: Find FAQ heading
    let faqHeading = null;
    let faqHeadingLevel = null;
    
    // Look for FAQ heading patterns
    const faqPatterns = ['faq', 'frequently asked questions', 'questions and answers', 'faqs'];
    
    // Find all headings
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    for (let heading of headings) {
        const headingText = (heading.textContent || "").trim().toLowerCase();
        
        // Check if this is an FAQ heading
        if (faqPatterns.some(pattern => headingText.includes(pattern))) {
            faqHeading = heading;
            faqHeadingLevel = parseInt(heading.tagName.charAt(1));
            console.log(`Found FAQ heading: "${heading.textContent.trim()}" (H${faqHeadingLevel})`);
            break;
        }
    }
    
    if (!faqHeading) {
        console.log("No FAQ heading found");
        return;
    }
    
    // Step 2: Collect all content under this heading until next heading of same or higher level
    let currentElement = faqHeading.nextElementSibling;
    let faqContentElements = [];
    let foundMetaData = false;
    
    while (currentElement) {
        const tagName = currentElement.tagName.toUpperCase();
        
        // Stop if we hit another heading of same or higher level
        if (tagName.match(/^H[1-6]$/)) {
            const currentLevel = parseInt(tagName.charAt(1));
            if (currentLevel <= faqHeadingLevel) {
                break;
            }
        }
        
        // Check if we hit meta data section
        const text = currentElement.textContent.trim().toLowerCase();
        if (text.startsWith('meta description') || 
            text.startsWith('meta title') || 
            text.startsWith('slug') || 
            text.startsWith('category') || 
            text.startsWith('relevant courses')) {
            foundMetaData = true;
            break;
        }
        
        // Add this element to FAQ content (skip empty elements)
        if (currentElement.textContent.trim()) {
            faqContentElements.push(currentElement);
        }
        currentElement = currentElement.nextElementSibling;
    }
    
    console.log(`Found ${faqContentElements.length} content elements under FAQ heading`);
    
    // Step 3: Process FAQ content to extract questions and answers
    processFAQContent(faqContentElements);
}

/** Process FAQ content elements */
function processFAQContent(elements) {
    let currentFAQ = { question: '', answer: [] };
    let collectingAnswer = false;
    let stopProcessing = false;
    
    for (let element of elements) {
        if (stopProcessing) break;
        
        const text = element.textContent.trim();
        const tagName = element.tagName.toLowerCase();
        
        if (!text) continue;
        
        // Check if we've reached meta data or other non-FAQ content
        if (text.toLowerCase().startsWith('meta description') || 
            text.toLowerCase().startsWith('meta title') || 
            text.toLowerCase().startsWith('slug') || 
            text.toLowerCase().startsWith('category') || 
            text.toLowerCase().startsWith('relevant courses')) {
            stopProcessing = true;
            break;
        }
        
        // Check if this element contains a question
        const isQuestion = isQuestionElement(text, tagName);
        
        if (isQuestion) {
            // Save previous FAQ if we have one
            if (currentFAQ.question && currentFAQ.answer.length > 0) {
                blogFAQData.faqData.push({
                    question: currentFAQ.question,
                    answer: cleanAnswerText(currentFAQ.answer.join(' '))
                });
                currentFAQ = { question: '', answer: [] };
            }
            
            // Extract question from this element
            currentFAQ.question = extractQuestionText(text);
            collectingAnswer = true;
            
            // Extract answer from same element if it exists
            const answerPart = extractAnswerFromElement(text, currentFAQ.question);
            if (answerPart) {
                currentFAQ.answer.push(answerPart);
            }
            
        } else if (collectingAnswer && text) {
            // Check if this element starts with answer prefixes (like "A:", "Answer:")
            const cleanedText = removeAnswerPrefix(text);
            if (cleanedText) {
                currentFAQ.answer.push(cleanedText);
            }
        }
    }
    
    // Save the last FAQ
    if (currentFAQ.question && currentFAQ.answer.length > 0) {
        blogFAQData.faqData.push({
            question: currentFAQ.question,
            answer: cleanAnswerText(currentFAQ.answer.join(' '))
        });
    }
    
    console.log(`Extracted ${blogFAQData.faqData.length} FAQs`);
}

/** Extract answer from element text if question and answer are in same paragraph */
function extractAnswerFromElement(text, question) {
    // Remove the question part from the text
    const questionIndex = text.indexOf(question);
    if (questionIndex !== -1) {
        const afterQuestion = text.substring(questionIndex + question.length).trim();
        
        // Check for answer prefixes after the question
        if (afterQuestion) {
            // Look for common answer separators
            const separators = [':', '-', '—', '•', '○', '→'];
            for (const separator of separators) {
                const separatorIndex = afterQuestion.indexOf(separator);
                if (separatorIndex !== -1 && separatorIndex < 10) { // Separator near the start
                    const answer = afterQuestion.substring(separatorIndex + 1).trim();
                    if (answer) {
                        return answer;
                    }
                }
            }
            
            // If no separator found, check if it starts with answer prefixes
            const cleanedAnswer = removeAnswerPrefix(afterQuestion);
            if (cleanedAnswer) {
                return cleanedAnswer;
            }
            
            // Otherwise return the whole thing after question
            return afterQuestion;
        }
    }
    
    return null;
}

/** Check if element contains a question */
function isQuestionElement(text, tagName) {
    // Check for numbered/bulleted questions
    const questionPatterns = [
        /^q\d*:\s*/i,             // Q:, Q1:, Q2:
        /^question\s*\d*:\s*/i,    // Question:, Question 1:
        /^faq\s*\d*:\s*/i,        // FAQ:, FAQ 1:
        /^\d+\.\s+.*\?/            // 1. Question text?
    ];
    
    for (const pattern of questionPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }
    
    // For list items, if they contain a question mark, they're probably questions
    if (tagName === 'li' && text.includes('?')) {
        return true;
    }
    
    // Check if text contains a question mark and looks like a question
    if (text.includes('?')) {
        const questionWords = ['what', 'when', 'where', 'why', 'how', 'can', 'is', 'are', 'does', 'do'];
        const firstWord = text.toLowerCase().split(' ')[0];
        if (questionWords.some(word => firstWord.startsWith(word))) {
            return true;
        }
    }
    
    return false;
}

/** Extract question text from element */
function extractQuestionText(text) {
    let question = text.trim();
    
    // Remove numbering prefixes and Q: patterns
    const prefixes = [
        /^q\d*:\s*/i,
        /^question\s*\d*:\s*/i,
        /^faq\s*\d*:\s*/i,
        /^\d+\.\s*/,
        /^[a-zA-Z]\.\s*/,
        /^\(\d+\)\s*/,
        /^\[\d+\]\s*/
    ];
    
    for (const prefix of prefixes) {
        if (prefix.test(question)) {
            question = question.replace(prefix, '');
            break;
        }
    }
    
    // Ensure question ends with ?
    if (!question.endsWith('?')) {
        // If there's a question mark in the text, take everything up to it
        const questionMarkIndex = question.indexOf('?');
        if (questionMarkIndex !== -1) {
            question = question.substring(0, questionMarkIndex + 1);
        } else {
            question += '?';
        }
    }
    
    return question.trim();
}

/** Remove answer prefixes from text */
function removeAnswerPrefix(text) {
    let cleaned = text.trim();
    
    // Remove only the answer prefixes at the beginning
    const answerPrefixes = [
        /^a:\s*/i,
        /^answer:\s*/i,
        /^ans:\s*/i,
        /^a\)\s*/i,
        /^\(a\)\s*/i,
        /^\[a\]\s*/i,
        /^→\s*/,
        /^•\s*/,
        /^-\s*/,
        /^:\s*/  // Colon at start
    ];
    
    for (const prefix of answerPrefixes) {
        if (prefix.test(cleaned)) {
            cleaned = cleaned.replace(prefix, '');
            break;
        }
    }
    
    return cleaned.trim();
}

/** Clean answer text - preserve important words, remove duplicate questions */
function cleanAnswerText(text) {
    if (!text) return "";
    
    let cleaned = text.trim();
    
    // Check if answer starts with a duplicate question (has question words)
    const questionPatterns = [
        /^when should i choose\s*/i,
        /^what are the\s*/i,
        /^how long does\s*/i,
        /^is training\s*/i,
        /^can sar\s*/i
    ];
    
    for (const pattern of questionPatterns) {
        if (pattern.test(cleaned)) {
            // Find the end of the question (marked by ?)
            const questionMarkIndex = cleaned.indexOf('?');
            if (questionMarkIndex !== -1) {
                // Keep everything after the question mark
                cleaned = cleaned.substring(questionMarkIndex + 1).trim();
                break;
            }
        }
    }
    
    // Remove extra whitespace and normalize
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter if needed
    if (cleaned.length > 0 && cleaned[0] !== cleaned[0].toUpperCase()) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    return cleaned;
}

/** Generate FAQ HTML */
function generateBlogFAQHTML() {
    if (blogFAQData.faqData.length === 0) {
        return "<!-- No FAQs found in the FAQ section -->";
    }
    
    let faqHTML = `<div class="faq-section">\n`;
    faqHTML += `  <h2 class="text-center mb-4">Frequently Asked Questions</h2>\n`;
    faqHTML += `  <div class="accordion" id="faqAccordion">\n`;
    
    blogFAQData.faqData.forEach((faq, index) => {
        const question = escapeHtml(faq.question);
        let answer = escapeHtml(faq.answer);
        
        if (question && answer) {
            const itemId = `faqItem${index}`;
            const headingId = `faqHeading${index}`;
            const collapseId = `faqCollapse${index}`;
            
            faqHTML += `    <div class="accordion-item">\n`;
            faqHTML += `      <h3 class="accordion-header" id="${headingId}">\n`;
            faqHTML += `        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">\n`;
            faqHTML += `          ${question}\n`;
            faqHTML += `        </button>\n`;
            faqHTML += `      </h3>\n`;
            faqHTML += `      <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#faqAccordion">\n`;
            faqHTML += `        <div class="accordion-body">\n`;
            faqHTML += `          ${answer}\n`;
            faqHTML += `        </div>\n`;
            faqHTML += `      </div>\n`;
            faqHTML += `    </div>\n`;
        }
    });
    
    faqHTML += `  </div>\n`;
    faqHTML += `</div>`;
    
    return faqHTML;
}

function debugBlogFAQs() {
    if (!blogData.fileProcessed) {
        utils.showNotification("Please upload and process a DOCX file first.", "warning");
        return;
    }
    
    // Extract FAQs first
    extractFAQsUnderHeading();
    
    let debugHTML = `<h3>Blog FAQ Debug Information</h3>`;
    debugHTML += `<p>Total FAQ items found: ${blogFAQData.faqData.length}</p>`;
    debugHTML += `<p><strong>Note:</strong> Only extracting content under FAQ/Frequently Asked Questions heading</p>`;
    
    if (blogFAQData.faqData.length === 0) {
        debugHTML += `<p>No FAQ items were extracted. This could be because:</p>`;
        debugHTML += `<ul>`;
        debugHTML += `<li>The blog doesn't have a FAQ section</li>`;
        debugHTML += `<li>The FAQ heading is not recognized (should contain "FAQ" or "Frequently Asked Questions")</li>`;
        debugHTML += `<li>There's no FAQ content under the FAQ heading</li>`;
        debugHTML += `<li>The FAQ content doesn't contain recognizable questions (Q:, Question:, etc.)</li>`;
        debugHTML += `</ul>`;
    } else {
        debugHTML += `<div class="faq-debug-items">`;
        blogFAQData.faqData.forEach((faq, index) => {
            debugHTML += `<div class="debug-faq-item mb-4 p-3 border">`;
            debugHTML += `<h4>FAQ ${index + 1}:</h4>`;
            debugHTML += `<p><strong>Question:</strong> ${faq.question}</p>`;
            debugHTML += `<p><strong>Answer:</strong> ${faq.answer}</p>`;
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