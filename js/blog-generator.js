// ========== BLOG CONTENT GENERATOR WITH ENHANCED PARSING ==========
let blogData = {
    title: "",
    content: [],
    imageCount: 0,
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
    
    reader.onload = async (event) => {
        try {
            document.getElementById("blogProgressText").textContent = "Converting DOCX to HTML...";
            const mammothResult = await mammoth.convertToHtml({arrayBuffer: event.target.result});
            const rawHtml = mammothResult.value || "";

            document.getElementById("blogProgressText").textContent = "Optimizing HTML structure...";
            
            // Enhanced HTML processing without AI
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

function enhancedCleanHTML(html) {
    // Create a temporary container
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Remove content after meta information
    removeContentAfterMeta(tempDiv);
    
    // Enhanced cleaning
    cleanHTML(tempDiv);
    
    // Improve structure
    improveHTMLStructure(tempDiv);
    
    return tempDiv.innerHTML;
}

function removeContentAfterMeta(element) {
    const metaKeywords = [
        'meta title', 'meta description', 'blog category', 'category:', 
        'slug:', 'relevant courses:', 'link:', 'alt text:', 'title text:'
    ];
    
    let foundMeta = false;
    const allElements = Array.from(element.querySelectorAll('*'));
    
    for (const el of allElements) {
        if (foundMeta) {
            el.remove();
            continue;
        }
        
        const textContent = el.textContent.trim().toLowerCase();
        for (const keyword of metaKeywords) {
            if (textContent.startsWith(keyword.toLowerCase())) {
                foundMeta = true;
                el.remove();
                break;
            }
        }
    }
}

function improveHTMLStructure(element) {
    // Convert paragraphs that should be headings
    const paragraphs = element.querySelectorAll('p');
    
    paragraphs.forEach(p => {
        const text = p.textContent.trim();
        
        // Check if this paragraph should be a heading
        if (shouldBeHeading(text)) {
            // Create appropriate heading level
            const headingLevel = determineHeadingLevel(text, p);
            const heading = document.createElement(`h${headingLevel}`);
            heading.innerHTML = p.innerHTML;
            
            // Replace paragraph with heading
            p.parentNode.replaceChild(heading, p);
        }
        
        // Clean up paragraph content
        cleanParagraphContent(p);
    });
    
    // Ensure proper list structure
    improveListStructure(element);
}

function shouldBeHeading(text) {
    // Text ending with colon (like "Introduction:")
    if (text.endsWith(':')) return true;
    
    // Short, bold-looking text that might be headings
    if (text.length < 100) {
        // Check if it's in uppercase or has specific heading patterns
        if (text === text.toUpperCase() && text.length > 5) return true;
        
        // Common heading patterns
        const headingPatterns = [
            'introduction', 'overview', 'background', 'conclusion', 
            'summary', 'key points', 'important notes', 'steps to',
            'how to', 'what is', 'why', 'when', 'where'
        ];
        
        const lowerText = text.toLowerCase();
        return headingPatterns.some(pattern => lowerText.includes(pattern));
    }
    
    return false;
}

function determineHeadingLevel(text, element) {
    // If it's already a heading, preserve the level
    if (element.tagName.match(/^H[1-6]$/)) {
        return parseInt(element.tagName.charAt(1));
    }
    
    // Default logic for heading levels
    const lowerText = text.toLowerCase();
    
    // Main sections get H2
    if (lowerText.includes('introduction') || lowerText.includes('overview')) return 2;
    if (lowerText.includes('conclusion') || lowerText.includes('summary')) return 2;
    
    // Subsections get H3
    if (lowerText.includes('step') || lowerText.includes('phase')) return 3;
    if (lowerText.includes('key') || lowerText.includes('important')) return 3;
    
    // Default to H2 for section headings
    return 2;
}

function cleanParagraphContent(paragraph) {
    // Remove &gt; characters
    paragraph.innerHTML = paragraph.innerHTML.replace(/&gt;/g, '');
    
    // Clean up spans and unnecessary tags
    const spans = paragraph.querySelectorAll('span');
    spans.forEach(span => {
        const parent = span.parentNode;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
    });
    
    // Remove empty paragraphs
    if (!paragraph.textContent.trim() && paragraph.children.length === 0) {
        paragraph.remove();
    }
}

function improveListStructure(element) {
    const lists = element.querySelectorAll('ul, ol');
    
    lists.forEach(list => {
        // Ensure list items are properly structured
        const items = list.querySelectorAll('li');
        items.forEach(item => {
            // Clean up list item content
            item.innerHTML = item.innerHTML.replace(/&gt;/g, '');
            
            // Remove empty list items
            if (!item.textContent.trim() && item.children.length === 0) {
                item.remove();
            }
        });
        
        // Remove empty lists
        if (list.children.length === 0) {
            list.remove();
        }
    });
}

// Rest of your existing functions remain the same with minor improvements
function extractBlogContent(html, progressInterval) {
    try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        
        blogData = {
            title: "",
            content: [],
            imageCount: 0,
            fileProcessed: false
        };
        
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

function cleanHTML(element) {
    // Remove styles
    const styledElements = element.querySelectorAll('*[style]');
    styledElements.forEach(el => el.removeAttribute('style'));
    
    // Remove classes
    const classElements = element.querySelectorAll('*[class]');
    classElements.forEach(el => el.removeAttribute('class'));
    
    // Clean up spans
    const spanElements = element.querySelectorAll('span');
    spanElements.forEach(span => {
        const parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
    });
    
    // Clean up divs
    const divElements = element.querySelectorAll('div');
    divElements.forEach(div => {
        const parent = div.parentNode;
        while (div.firstChild) parent.insertBefore(div.firstChild, div);
        parent.removeChild(div);
    });
    
    // Clean up multiple line breaks
    const brTags = element.querySelectorAll('br');
    let previousWasBr = false;
    brTags.forEach(br => {
        if (previousWasBr) br.remove();
        previousWasBr = true;
    });
    
    // Remove empty elements
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
        if (!el.textContent.trim() && el.children.length === 0 && el.tagName !== 'IMG') {
            el.remove();
        }
    });
}

function extractTitle(element) {
    const h1Element = element.querySelector("h1");
    if (h1Element) {
        blogData.title = h1Element.textContent.trim();
        h1Element.remove();
        return;
    }
    
    const paragraphs = element.querySelectorAll("p");
    for (const p of paragraphs) {
        const text = p.textContent.trim();
        if (text && text.length > 10 && text.length < 200) {
            blogData.title = text;
            p.remove();
            return;
        }
    }
    
    const allElements = element.querySelectorAll('*');
    for (const el of allElements) {
        const text = el.textContent.trim();
        if (text && text.length > 5) {
            blogData.title = text.split('.')[0];
            return;
        }
    }
}

function processContentElements(element) {
    const elements = Array.from(element.children);
    let skipRemainingContent = false;
    
    for (const el of elements) {
        if (skipRemainingContent) {
            continue; // Skip all content after meta information
        }
        
        if (!el.textContent || !el.textContent.trim()) continue;
        
        const tagName = el.tagName.toLowerCase();
        const textContent = el.textContent.trim();
        
        if (textContent === blogData.title) continue;
        
        // Check for meta information - if found, skip this and all following content
        if (isMetaInformation(textContent)) {
            skipRemainingContent = true;
            continue;
        }
        
        if (tagName.match(/^h[1-6]$/)) {
            const headingLevel = parseInt(tagName.charAt(1));
            blogData.content.push({
                type: 'heading',
                level: headingLevel,
                content: cleanTextContent(el.innerHTML.trim())
            });
        } else if (tagName === 'p' && textContent.length > 0) {
            blogData.content.push({
                type: 'paragraph',
                content: cleanTextContent(el.innerHTML.trim())
            });
        } else if (tagName === 'ul' || tagName === 'ol') {
            blogData.content.push({
                type: 'list',
                ordered: tagName === 'ol',
                items: Array.from(el.querySelectorAll('li')).map(li => cleanTextContent(li.innerHTML.trim()))
            });
        } else if (tagName === 'img') {
            blogData.imageCount++;
            blogData.content.push({
                type: 'image',
                alt: el.getAttribute('alt') || `Blog image ${blogData.imageCount}`,
                placeholder: `[Image ${blogData.imageCount}]`
            });
        } else if (el.children.length > 0) {
            processChildElements(el, skipRemainingContent);
        }
    }
}

function isMetaInformation(text) {
    const metaKeywords = [
        'link:', 'alt text:', 'title text:', 'meta title', 'meta description:', 
        'blog category', 'category:', 'slug:', 'relevant courses:'
    ];
    
    const lowerText = text.toLowerCase();
    return metaKeywords.some(keyword => 
        lowerText.startsWith(keyword.toLowerCase())
    );
}

function processChildElements(parentElement, skipRemainingContent) {
    if (skipRemainingContent) return;
    
    const children = Array.from(parentElement.children);
    children.forEach(child => {
        if (skipRemainingContent) return;
        
        const textContent = child.textContent.trim();
        if (!textContent) return;
        
        // Check for meta information and skip if found
        if (isMetaInformation(textContent)) {
            skipRemainingContent = true;
            return;
        }
        
        const tagName = child.tagName.toLowerCase();
        
        if (tagName.match(/^h[1-6]$/)) {
            const headingLevel = parseInt(tagName.charAt(1));
            blogData.content.push({
                type: 'heading',
                level: headingLevel,
                content: cleanTextContent(child.innerHTML.trim())
            });
        } else if (tagName === 'p') {
            blogData.content.push({
                type: 'paragraph',
                content: cleanTextContent(child.innerHTML.trim())
            });
        } else if (tagName === 'ul' || tagName === 'ol') {
            blogData.content.push({
                type: 'list',
                ordered: tagName === 'ol',
                items: Array.from(child.querySelectorAll('li')).map(li => cleanTextContent(li.innerHTML.trim()))
            });
        } else if (tagName === 'img') {
            blogData.imageCount++;
            blogData.content.push({
                type: 'image',
                alt: child.getAttribute('alt') || `Blog image ${blogData.imageCount}`,
                placeholder: `[Image ${blogData.imageCount}]`
            });
        } else if (child.children.length > 0) {
            processChildElements(child, skipRemainingContent);
        }
    });
}

function cleanTextContent(content) {
    return content
        .replace(/&gt;/g, '') // Remove &gt; characters
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<span[^>]*>/gi, '')
        .replace(/<\/span>/gi, '')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/div>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function createImageInputs() {
    const container = document.getElementById("imageInputs");
    container.innerHTML = "";
    
    for (let i = 1; i <= blogData.imageCount; i++) {
        const inputGroup = document.createElement("div");
        inputGroup.className = "mb-3";
        inputGroup.innerHTML = `
            <label class="form-label">Image ${i} URL:</label>
            <input type="text" class="form-control image-url-input" id="imageUrl${i}" 
                   placeholder="https://example.com/image${i}.jpg" data-index="${i}">
        `;
        container.appendChild(inputGroup);
    }
}

function addImageInput() {
    blogData.imageCount++;
    const container = document.getElementById("imageInputs");
    const inputGroup = document.createElement("div");
    inputGroup.className = "mb-3";
    inputGroup.innerHTML = `
        <label class="form-label">Image ${blogData.imageCount} URL:</label>
        <input type="text" class="form-control image-url-input" id="imageUrl${blogData.imageCount}" 
               placeholder="https://example.com/image${blogData.imageCount}.jpg" data-index="${blogData.imageCount}">
    `;
    container.appendChild(inputGroup);
}

function generateBlogCode() {
    if (!blogData.fileProcessed) {
        utils.showNotification("Please upload and process a DOCX file first.", "warning");
        return;
    }

    const featuredImageUrl = document.getElementById("featuredImageUrl").value.trim();
    const featuredImageAlt = document.getElementById("featuredImageAlt").value.trim();
    const featuredImageTitle = document.getElementById("featuredImageTitle").value.trim();

    const imageUrls = [];
    const imageInputs = document.querySelectorAll('.image-url-input');
    imageInputs.forEach(input => {
        if (input.value.trim()) {
            const index = parseInt(input.getAttribute('data-index')) - 1;
            imageUrls[index] = input.value.trim();
        }
    });
    
    let imageIndex = 0;
    let blogHTML = "";

    if (blogData.title) {
        blogHTML += `<h1 class="text-center">${blogData.title}</h1><hr>\n\n`;
    }

    let imgTag = `<img`;
    if (featuredImageUrl) imgTag += ` src="${featuredImageUrl}"`;
    if (featuredImageAlt) imgTag += ` alt="${featuredImageAlt}"`;
    if (featuredImageTitle) imgTag += ` title="${featuredImageTitle}"`;
    imgTag += ` class="w-100">\n\n`;
    blogHTML += imgTag;

    for (const item of blogData.content) {
        switch (item.type) {
            case 'heading':
                // Only center H1 (title), others are left-aligned
                if (item.level === 1) {
                    blogHTML += `<h${item.level} class="text-center">${item.content}</h${item.level}>\n\n`;
                } else {
                    blogHTML += `<h${item.level}>${item.content}</h${item.level}>\n\n`;
                }
                break;
                
            case 'paragraph':
                const cleanContent = item.content.replace(/<[^>]*>/g, '').trim();
                if (cleanContent && cleanContent.length > 10) {
                    blogHTML += `<p>${item.content}</p>\n\n`;
                }
                break;
                
            case 'list':
                const tag = item.ordered ? 'ol' : 'ul';
                blogHTML += `<${tag}>\n`;
                item.items.forEach(listItem => {
                    blogHTML += `  <li>${listItem}</li>\n`;
                });
                blogHTML += `</${tag}>\n\n`;
                break;
                
            case 'image':
                const imageUrl = imageUrls[imageIndex] || "#";
                blogHTML += `<img src="${imageUrl}" alt="${item.alt}" class="w-100">\n\n`;
                imageIndex++;
                break;
        }
    }

    blogHTML += `
<div class="fancy-line"></div>
<style>
.fancy-line {
    width: 60%;
    margin: 20px auto;
    border-top: 2px solid #116466;
    text-align: center;
    position: relative;
}
.fancy-line::after {
    content: "✦ ✦ ✦";
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 0 10px;
    color: red;
}
</style>
`;

    document.getElementById("blogCode").value = blogHTML;
    showGeneratedCode('blog', 'blogCodeSection');
    utils.showNotification("Blog code generated successfully!", "success");
}