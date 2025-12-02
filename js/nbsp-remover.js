// ========== ADVANCED HTML CLEANER TOOL ==========
class HTMLCleaner {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.initialize();
        this.originalContent = '';
        this.cleanHistory = []; // For undo functionality
        this.historyList = []; // For detailed history drawer
        this.maxHistory = 10; // Increased to 10 entries
        this.defaultOptions = {
            removeNBSP: true,
            removeClasses: true,
            removeIds: true,
            removeStyleAttrs: true,
            removeDataAttrs: true,
            removeEmptyTags: true,
            removeInlineStyles: true,
            removeFontTags: true,
            minifyHTML: true,
            beautifyHTML: false,
            preserveEssentialAttrs: true,
            convertLineBreaks: false,
            removeComments: true,
            normalizeWhitespace: true,
            removeScriptStyleTags: true,
            removeBrTags: false
        };
    }

    initElements() {
        this.elements = {
            // Editor elements
            editor: document.getElementById('htmlEditor'),
            preview: document.getElementById('htmlPreview'),
            historyList: document.getElementById('historyList'),
            
            // Action buttons
            cleanBtn: document.getElementById('cleanHTML'),
            copyBtn: document.getElementById('copyHTML'),
            clearBtn: document.getElementById('clearHTML'),
            undoBtn: document.getElementById('undoClean'),
            selectAllBtn: document.getElementById('selectAllBtn'),
            deselectAllBtn: document.getElementById('deselectAllBtn'),
            resetOptionsBtn: document.getElementById('resetOptionsBtn'),
            pasteExampleBtn: document.getElementById('pasteExample'),
            
            // Checkboxes
            removeNBSP: document.getElementById('removeNBSP'),
            removeClasses: document.getElementById('removeClasses'),
            removeIds: document.getElementById('removeIds'),
            removeStyleAttrs: document.getElementById('removeStyleAttrs'),
            removeDataAttrs: document.getElementById('removeDataAttrs'),
            removeEmptyTags: document.getElementById('removeEmptyTags'),
            removeInlineStyles: document.getElementById('removeInlineStyles'),
            removeFontTags: document.getElementById('removeFontTags'),
            minifyHTML: document.getElementById('minifyHTML'),
            beautifyHTML: document.getElementById('beautifyHTML'),
            preserveEssentialAttrs: document.getElementById('preserveEssentialAttrs'),
            convertLineBreaks: document.getElementById('convertLineBreaks'),
            removeComments: document.getElementById('removeComments'),
            normalizeWhitespace: document.getElementById('normalizeWhitespace'),
            removeScriptStyleTags: document.getElementById('removeScriptStyleTags'),
            removeBrTags: document.getElementById('removeBrTags'),
            
            // Stats
            charCount: document.getElementById('charCount'),
            wordCount: document.getElementById('wordCount'),
            nbspCount: document.getElementById('nbspCount'),
            tagCount: document.getElementById('tagCount'),
            cleanScore: document.getElementById('cleanScore'),
            reductionRate: document.getElementById('reductionRate'),
            lastCleanTime: document.getElementById('lastCleanTime')
        };
        
        // Check if all elements exist
        this.validateElements();
    }
    
    validateElements() {
        const missing = [];
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element && !key.startsWith('_')) {
                missing.push(key);
            }
        });
        
        if (missing.length > 0) {
            console.warn('Missing elements:', missing);
        }
    }

    bindEvents() {
        // Editor events
        if (this.elements.editor) {
            this.elements.editor.addEventListener('input', () => {
                this.updateStats();
                this.updatePreview();
            });
            // Also update preview on paste
            this.elements.editor.addEventListener('paste', () => {
                setTimeout(() => {
                    this.updateStats();
                    this.updatePreview();
                }, 100);
            });
        }
        
        // Button events
        if (this.elements.cleanBtn) this.elements.cleanBtn.addEventListener('click', () => this.cleanHTML());
        if (this.elements.copyBtn) this.elements.copyBtn.addEventListener('click', () => this.copyHTML());
        if (this.elements.clearBtn) this.elements.clearBtn.addEventListener('click', () => this.clearEditor());
        if (this.elements.undoBtn) this.elements.undoBtn.addEventListener('click', () => this.undoClean());
        if (this.elements.selectAllBtn) this.elements.selectAllBtn.addEventListener('click', () => this.selectAllOptions(true));
        if (this.elements.deselectAllBtn) this.elements.deselectAllBtn.addEventListener('click', () => this.selectAllOptions(false));
        if (this.elements.resetOptionsBtn) this.elements.resetOptionsBtn.addEventListener('click', () => this.resetOptions());
        if (this.elements.pasteExampleBtn) this.elements.pasteExampleBtn.addEventListener('click', () => this.loadExample());
        
        // Checkbox events
        const checkboxes = [
            'removeNBSP', 'removeClasses', 'removeIds', 'removeStyleAttrs', 'removeDataAttrs',
            'removeEmptyTags', 'removeInlineStyles', 'removeFontTags', 'minifyHTML', 'beautifyHTML',
            'preserveEssentialAttrs', 'convertLineBreaks', 'removeComments',
            'normalizeWhitespace', 'removeScriptStyleTags', 'removeBrTags'
        ];
        
        checkboxes.forEach(key => {
            if (this.elements[key]) {
                this.elements[key].addEventListener('change', () => {
                    // If beautify is checked, uncheck minify (they're mutually exclusive)
                    if (key === 'beautifyHTML' && this.elements.beautifyHTML?.checked) {
                        if (this.elements.minifyHTML) {
                            this.elements.minifyHTML.checked = false;
                        }
                    }
                    // If minify is checked, uncheck beautify (they're mutually exclusive)
                    if (key === 'minifyHTML' && this.elements.minifyHTML?.checked) {
                        if (this.elements.beautifyHTML) {
                            this.elements.beautifyHTML.checked = false;
                        }
                    }
                    this.updateCleanScore();
                });
            }
        });
    }

    initialize() {
        this.resetOptions();
        this.loadExample();
        this.updateStats();
    }

    loadExample() {
        const exampleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Example Content</title>
    <style>
        body { font-family: Arial; }
        .custom-style { color: red; font-size: 18px; }
    </style>
</head>
<body>
    <div id="main-container" class="container main-class" style="padding: 20px;">
        <h1 class="heading" style="font-family: 'Times New Roman'; color: blue;">
            Welcome&nbsp;to&nbsp;HTML&nbsp;Cleaner
        </h1>
        
        <!-- This is a comment -->
        <p class="paragraph" data-custom="value">
            This is <span style="color: red; font-weight: bold;">styled text</span> with 
            <font color="green" size="4">font tags</font> and&nbsp;nbsp entities.
        </p>
        
        <div style="background: #f0f0f0; padding: 10px;">
            <p></p> <!-- Empty paragraph -->
            <span id="empty-span"></span>
            <br><br><br> <!-- Multiple line breaks -->
        </div>
        
        <ul class="list" style="list-style: none;">
            <li class="item" data-index="1">Item 1</li>
            <li class="item" data-index="2">Item 2</li>
        </ul>
        
        <script>
            console.log("This script will be removed");
        </script>
        
        <p>More text with inline <strong style="font-weight: 900;">styles</strong> 
           and <em style="font-style: italic;">emphasis</em>.</p>
    </div>
</body>
</html>`;
        
        this.elements.editor.value = exampleHTML;
        this.updateStats();
        this.updatePreview();
    }

    updateStats() {
        const content = this.elements.editor.value;
        
        // Character count
        if (this.elements.charCount) {
            this.elements.charCount.textContent = content.length.toLocaleString();
        }
        
        // Word count
        const textOnly = content.replace(/<[^>]*>/g, '');
        const words = textOnly.trim() === '' ? 0 : textOnly.trim().split(/\s+/).length;
        if (this.elements.wordCount) {
            this.elements.wordCount.textContent = words.toLocaleString();
        }
        
        // &nbsp; count
        const nbspMatches = content.match(/&nbsp;/g);
        if (this.elements.nbspCount) {
            this.elements.nbspCount.textContent = nbspMatches ? nbspMatches.length : 0;
        }
        
        // Tag count
        const tagMatches = content.match(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi);
        if (this.elements.tagCount) {
            this.elements.tagCount.textContent = tagMatches ? tagMatches.length : 0;
        }
        
        this.updateCleanScore();
        this.updatePreview();
    }

    updatePreview() {
        // Preview is now shown in drawer via openHTMLPreview(), so we don't need to update the hidden preview div
        // This function is kept for compatibility but does nothing
        return;
    }

    updateCleanScore() {
        const content = this.elements.editor.value;
        if (!content.trim()) {
            if (this.elements.cleanScore) this.elements.cleanScore.textContent = '0%';
            if (this.elements.reductionRate) this.elements.reductionRate.textContent = '0%';
            return;
        }
        
        let score = 100;
        const checks = [
            // Text-based checks
            { regex: /&nbsp;/g, weight: 15, element: this.elements.removeNBSP },
            { regex: /<\/?\s*br\s*\/?>/gi, weight: 10, element: this.elements.removeBrTags },
            { regex: /<font[^>]*>|<\/font>/gi, weight: 10, element: this.elements.removeFontTags },
            { regex: /style="[^"]*"/gi, weight: 15, element: this.elements.removeInlineStyles },
            { regex: /class="[^"]*"/g, weight: 10, element: this.elements.removeClasses },
            { regex: /id="[^"]*"/g, weight: 10, element: this.elements.removeIds },
            { regex: /data-[a-z-]+="[^"]*"/gi, weight: 10, element: this.elements.removeDataAttrs },
            
            // Structural checks
            { regex: /<(\w+)(?:\s[^>]*)?>\s*<\/\1>/gi, weight: 15, element: this.elements.removeEmptyTags },
            { regex: /<script[^>]*>[\s\S]*?<\/script>/gi, weight: 10, element: this.elements.removeScriptStyleTags },
            { regex: /<style[^>]*>[\s\S]*?<\/style>/gi, weight: 10, element: this.elements.removeScriptStyleTags },
            { regex: /<!--[\s\S]*?-->/g, weight: 5, element: this.elements.removeComments }
        ];
        
        checks.forEach(check => {
            if (check.element?.checked && content.match(check.regex)) {
                const matches = content.match(check.regex).length;
                score -= Math.min(matches * 2, check.weight);
            }
        });
        
        if (this.elements.cleanScore) {
            this.elements.cleanScore.textContent = Math.max(0, Math.round(score)) + '%';
        }
    }

    cleanHTML() {
        let content = this.elements.editor.value;
        
        if (!content.trim()) {
            this.showNotification('Please enter some HTML content first!', true);
            return;
        }
        
        // Save to history
        const originalContent = content;
        const startTime = performance.now();
        
        try {
            // Store original content for undo
        this.saveToHistory(originalContent);
            
            // Step 1: Remove HTML comments
            if (this.elements.removeComments?.checked) {
                content = content.replace(/<!--[\s\S]*?-->/g, '');
            }
            
            // Step 2: Remove script and style tags
            if (this.elements.removeScriptStyleTags?.checked) {
                content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            }
            
            // Step 3: Parse HTML using DOMParser
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            // Step 4: Apply DOM-based cleaning
            this.cleanDOM(doc);
            
            // Step 5: Get cleaned HTML
            let cleanedHTML = doc.body.innerHTML;
            
            // Step 6: Apply text-based cleaning
            cleanedHTML = this.cleanText(cleanedHTML);
            
            // Step 7: Update editor with cleaned content
            this.elements.editor.value = cleanedHTML;
            
            // Step 8: Update stats and preview
            const endTime = performance.now();
            const timeTaken = Math.round(endTime - startTime);
            
            this.updateStats();
            
            // Step 9: Calculate reduction
            const originalLength = originalContent.length;
            const cleanedLength = cleanedHTML.length;
            const reduction = Math.round((originalLength - cleanedLength) / originalLength * 100);
            
            if (this.elements.lastCleanTime) {
                this.elements.lastCleanTime.textContent = `${timeTaken}ms`;
            }
            if (this.elements.reductionRate) {
                this.elements.reductionRate.textContent = `${reduction}%`;
            }
            
            // Add to history
            this.addToHistoryList(originalContent, cleanedHTML, timeTaken, reduction);
            
            // Ensure global instance is set
            window.htmlCleanerInstance = this;
            
            this.showNotification(
                `HTML cleaned in ${timeTaken}ms! ` +
                `Reduced by ${reduction}% (${originalLength-cleanedLength} chars removed). ` +
                `History: ${this.historyList ? this.historyList.length : 0} entries`
            );
            
        } catch (error) {
            console.error('Error cleaning HTML:', error);
            this.showNotification('Error cleaning HTML. Please check your input.', true);
        }
    }

    cleanDOM(doc) {
        // Remove <br> tags first if option is enabled
        if (this.elements.removeBrTags?.checked) {
            const brTags = doc.body.querySelectorAll('br');
            brTags.forEach(br => {
                // Replace br with a space to maintain text flow
                const space = document.createTextNode(' ');
                if (br.parentNode) {
                    br.parentNode.replaceChild(space, br);
                }
            });
        }
        
        // Get all elements
        const allElements = doc.body.querySelectorAll('*');
        
        allElements.forEach(element => {
            // Remove font and span tags (unpack their content)
            if (this.elements.removeFontTags?.checked) {
                if (element.tagName.toLowerCase() === 'font' || 
                    element.tagName.toLowerCase() === 'span') {
                    this.unpackElement(element);
                    return;
                }
            }
            
            // Remove attributes
            const attrs = Array.from(element.attributes);
            attrs.forEach(attr => {
                this.processAttribute(element, attr);
            });
            
            // Remove empty elements
            if (this.elements.removeEmptyTags?.checked) {
                this.removeIfEmpty(element);
            }
        });
        
        // Convert line breaks to paragraphs if enabled
        if (this.elements.convertLineBreaks?.checked) {
            this.convertLineBreaksToParagraphs(doc.body);
        }
        
        // Normalize whitespace in text nodes
        if (this.elements.normalizeWhitespace?.checked) {
            this.normalizeWhitespace(doc.body);
        }
    }

    processAttribute(element, attr) {
        const attrName = attr.name.toLowerCase();
        
        // Preserve essential attributes
        const essentialAttrs = ['href', 'src', 'alt', 'title', 'target', 'rel', 'type'];
        const shouldPreserve = this.elements.preserveEssentialAttrs?.checked && 
                              essentialAttrs.includes(attrName);
        
        if (shouldPreserve) {
            return;
        }
        
        // Remove specific attributes based on options
        if (this.elements.removeClasses?.checked && attrName === 'class') {
            element.removeAttribute('class');
        }
        else if (this.elements.removeIds?.checked && attrName === 'id') {
            element.removeAttribute('id');
        }
        else if (this.elements.removeStyleAttrs?.checked && attrName === 'style') {
            element.removeAttribute('style');
        }
        else if (this.elements.removeDataAttrs?.checked && attrName.startsWith('data-')) {
            element.removeAttribute(attrName);
        }
        else if (this.elements.removeInlineStyles?.checked && attrName === 'style') {
            element.removeAttribute('style');
        }
        // Remove all other attributes (except essential ones)
        else if (!essentialAttrs.includes(attrName)) {
            element.removeAttribute(attrName);
        }
    }

    unpackElement(element) {
        const parent = element.parentNode;
        if (!parent) return;
        
        // Move all children out of the element
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        
        // Remove the empty element
        parent.removeChild(element);
    }

    removeIfEmpty(element) {
        const emptyTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                          'li', 'td', 'th', 'section', 'article', 'aside', 'header', 'footer'];
        
        const tagName = element.tagName.toLowerCase();
        
        if (emptyTags.includes(tagName)) {
            const hasText = element.textContent.trim().length > 0;
            const hasChildren = element.children.length > 0;
            const hasMeaningfulAttributes = Array.from(element.attributes).some(attr => 
                ['href', 'src', 'alt', 'title'].includes(attr.name.toLowerCase())
            );
            
            if (!hasText && !hasChildren && !hasMeaningfulAttributes) {
                element.remove();
            }
        }
    }

    convertLineBreaksToParagraphs(element) {
        const html = element.innerHTML;
        // Replace consecutive line breaks with paragraph tags
        const paragraphs = html.split(/(?:\r?\n){2,}/);
        
        if (paragraphs.length > 1) {
            const newHTML = paragraphs.map(p => {
                const trimmed = p.trim();
                return trimmed ? `<p>${trimmed}</p>` : '';
            }).join('');
            
            element.innerHTML = newHTML;
        }
    }

    normalizeWhitespace(element) {
        // Process text nodes
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            textNode.textContent = textNode.textContent
                .replace(/\s+/g, ' ')
                .trim();
        });
    }

    cleanText(html) {
        // Replace &nbsp; with normal space (always do this, regardless of checkbox)
        // This ensures &nbsp; is always replaced with a regular space
        html = html.replace(/&nbsp;/gi, ' ');
        
        // Also handle other nbsp variations
        html = html.replace(/\u00A0/g, ' '); // Unicode non-breaking space
        
        // Remove <br> tags if option is enabled (handle all variations)
        if (this.elements.removeBrTags?.checked) {
            // Remove all variations: <br>, <br/>, <br />, </br>, </ br>
            html = html.replace(/<\/?\s*br\s*\/?>/gi, ' ');
            // Clean up multiple spaces that might result from br removal
            html = html.replace(/\s+/g, ' ');
        } else {
            // Remove multiple line breaks (only if not removing all br tags)
            html = html.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');
        }
        
        // Remove extra whitespace
        if (this.elements.normalizeWhitespace?.checked) {
            html = html
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/>\s+</g, '><')
                .trim();
        }
        
        // Beautify HTML (format with proper indentation)
        if (this.elements.beautifyHTML?.checked) {
            html = this.beautifyHTML(html);
        }
        // Minify HTML (only if beautify is not checked)
        else if (this.elements.minifyHTML?.checked) {
            html = html
                .replace(/\s+/g, ' ')
                .replace(/>\s+</g, '><')
                .replace(/\s+/g, ' ')
                .trim();
        }
        
        return html;
    }

    beautifyHTML(html) {
        let formatted = '';
        let indent = 0;
        const indentSize = 2; // 2 spaces per indent level
        const tab = ' '.repeat(indentSize);
        
        // List of self-closing/void tags
        const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        
        // Normalize whitespace between tags
        html = html.replace(/>\s+</g, '><');
        
        // Process the HTML
        let i = 0;
        while (i < html.length) {
            if (html[i] === '<') {
                // Find the end of the tag
                let tagEnd = html.indexOf('>', i);
                if (tagEnd === -1) break;
                
                const tag = html.substring(i, tagEnd + 1);
                const tagMatch = tag.match(/<\/?([a-z][a-z0-9]*)/i);
                const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
                const isClosing = tag.startsWith('</');
                const isSelfClosing = tag.endsWith('/>') || voidTags.includes(tagName);
                const isComment = tag.startsWith('<!--');
                
                if (isComment) {
                    // Handle comments on their own line
                    formatted += tab.repeat(indent) + tag + '\n';
                } else if (isClosing) {
                    // Decrease indent before closing tag
                    indent = Math.max(0, indent - 1);
                    formatted += tab.repeat(indent) + tag + '\n';
                } else if (isSelfClosing) {
                    // Self-closing tags don't change indent
                    formatted += tab.repeat(indent) + tag + '\n';
                } else {
                    // Opening tag - add it and increase indent
                    formatted += tab.repeat(indent) + tag + '\n';
                    indent++;
                }
                
                i = tagEnd + 1;
            } else {
                // Text content
                let textEnd = html.indexOf('<', i);
                if (textEnd === -1) textEnd = html.length;
                
                const text = html.substring(i, textEnd).trim();
                if (text) {
                    // Add text with current indent
                    formatted += tab.repeat(indent) + text + '\n';
                }
                
                i = textEnd;
            }
        }
        
        // Clean up extra blank lines and trailing whitespace
        return formatted
            .split('\n')
            .map(line => line.trimEnd())
            .filter((line, idx, arr) => {
                // Remove consecutive blank lines
                if (!line.trim() && idx > 0 && !arr[idx - 1].trim()) {
                    return false;
                }
                return true;
            })
            .join('\n')
            .trim();
    }

    saveToHistory(content) {
        // This is for undo functionality - store simple content
        // Ensure cleanHistory is initialized
        if (!this.cleanHistory) {
            this.cleanHistory = [];
        }
        
        this.cleanHistory.push({
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last N items
        if (this.cleanHistory.length > this.maxHistory) {
            this.cleanHistory.shift();
        }
    }

    addToHistoryList(original, cleaned, timeTaken, reduction) {
        // Store detailed history entry for history drawer
        const historyEntry = {
            original: original,
            cleaned: cleaned,
            timestamp: new Date().toISOString(),
            timeTaken: timeTaken,
            reduction: reduction,
            originalLength: original.length,
            cleanedLength: cleaned.length
        };
        
        // Use a separate array for detailed history (historyList)
        if (!this.historyList) {
            this.historyList = [];
        }
        
        // Add to beginning of history array
        this.historyList.unshift(historyEntry);
        
        // Keep only last N items
        if (this.historyList.length > this.maxHistory) {
            this.historyList = this.historyList.slice(0, this.maxHistory);
        }
        
        // Also store in global for easy access
        window.htmlCleanerHistory = this.historyList;
        
        // Debug: log to console
        console.log('History saved:', this.historyList.length, 'entries');
    }
    
    getHistory() {
        // Return the detailed history list
        const history = this.historyList || [];
        // Also update global store
        window.htmlCleanerHistory = history;
        return history;
    }
    
    restoreFromHistory(historyEntry, restoreType = 'original') {
        const content = restoreType === 'original' ? historyEntry.original : historyEntry.cleaned;
        this.elements.editor.value = content;
        this.updateStats();
        this.showNotification(`Restored ${restoreType} content from ${new Date(historyEntry.timestamp).toLocaleString()}`);
    }

    undoClean() {
        // Ensure cleanHistory is initialized
        if (!this.cleanHistory || this.cleanHistory.length === 0) {
            this.showNotification('Nothing to undo!', true);
            return;
        }
        
        const lastState = this.cleanHistory.pop();
        if (lastState && lastState.content) {
            this.elements.editor.value = lastState.content;
            this.updateStats();
            this.showNotification('Undo successful!');
        } else {
            this.showNotification('Error restoring previous state', true);
        }
    }

    copyHTML() {
        const content = this.elements.editor.value;
        
        if (!content.trim()) {
            this.showNotification('No HTML to copy!', true);
            return;
        }
        
        navigator.clipboard.writeText(content).then(() => {
            this.showNotification('HTML copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showNotification('Failed to copy HTML', true);
        });
    }

    clearEditor() {
        this.elements.editor.value = '';
        // Don't clear history - user might want to restore it
        // Keep both cleanHistory (for undo) and historyList (for drawer)
        this.updateStats();
        this.showNotification('Editor cleared! (History preserved - use History button to restore)');
    }

    selectAllOptions(select) {
        const checkboxes = [
            'removeNBSP', 'removeClasses', 'removeIds', 'removeStyleAttrs', 'removeDataAttrs',
            'removeEmptyTags', 'removeInlineStyles', 'removeFontTags', 'minifyHTML', 'beautifyHTML',
            'preserveEssentialAttrs', 'convertLineBreaks', 'removeComments',
            'normalizeWhitespace', 'removeScriptStyleTags', 'removeBrTags'
        ];
        
        checkboxes.forEach(key => {
            if (this.elements[key]) {
                this.elements[key].checked = select;
            }
        });
        
        this.updateCleanScore();
        this.showNotification(`All options ${select ? 'selected' : 'deselected'}!`);
    }

    resetOptions() {
        Object.keys(this.defaultOptions).forEach(key => {
            if (this.elements[key]) {
                this.elements[key].checked = this.defaultOptions[key];
            }
        });
        
        this.updateCleanScore();
        this.showNotification('Options reset to default!');
    }

    showNotification(message, isError = false) {
        // Create notification if it doesn't exist
        let notification = document.getElementById('cleanerNotification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'cleanerNotification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize the cleaner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.htmlCleanerInstance = new HTMLCleaner();
    // Initialize global history store
    window.htmlCleanerHistory = window.htmlCleanerInstance.historyList || [];
    console.log('HTML Cleaner initialized. Instance stored globally.');
});

// Function to open HTML preview in drawer
function openHTMLPreview() {
    const editor = document.getElementById('htmlEditor');
    if (!editor || !editor.value || !editor.value.trim()) {
        if (typeof utils !== 'undefined') {
            utils.showNotification('No HTML to preview. Please paste or generate HTML first.', 'warning');
        } else {
            alert('No HTML to preview. Please paste or generate HTML first.');
        }
        return;
    }
    
    const htmlContent = editor.value;
    
    // Escape HTML for display
    const escapedHTML = htmlContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // Create preview content with syntax highlighting
    const previewContent = `
        <div class="html-preview-container">
            <div class="mb-3">
                <p class="text-light mb-2">Cleaned HTML Code:</p>
                <div class="position-relative">
                    <button class="btn btn-sm btn-success position-absolute top-0 end-0 m-2" onclick="copyHTMLFromPreview()" style="z-index: 10;">
                        <i class="fas fa-copy me-1"></i> Copy HTML
                    </button>
                    <pre class="bg-dark text-light p-3 rounded" style="max-height: 70vh; overflow: auto; font-size: 13px; line-height: 1.5;"><code id="previewHTMLCode">${escapedHTML}</code></pre>
                </div>
            </div>
        </div>
    `;
    
    // Store HTML for copying
    window.previewHTMLContent = htmlContent;
    
    // Use the existing drawer function
    if (typeof openPreviewDrawerWithContent === 'function') {
        openPreviewDrawerWithContent(previewContent, 'HTML Preview');
        // Show copy button
        const copyBtn = document.getElementById('copyCodeDrawerBtn');
        if (copyBtn) {
            copyBtn.style.display = 'inline-block';
            copyBtn.onclick = function() {
                copyHTMLFromPreview();
            };
        }
    } else {
        // Fallback if function doesn't exist
        alert('Preview drawer not available');
    }
}

// Function to copy HTML from preview
function copyHTMLFromPreview() {
    if (window.previewHTMLContent) {
        navigator.clipboard.writeText(window.previewHTMLContent).then(() => {
            if (typeof utils !== 'undefined') {
                utils.showNotification('HTML copied to clipboard!', 'success');
            } else {
                alert('HTML copied to clipboard!');
            }
        }).catch(() => {
            if (typeof utils !== 'undefined') {
                utils.showNotification('Failed to copy HTML. Please try again.', 'error');
            } else {
                alert('Failed to copy HTML. Please try again.');
            }
        });
    }
}

// Function to open HTML history in drawer
function openHTMLHistory() {
    // Get the HTMLCleaner instance
    const editor = document.getElementById('htmlEditor');
    if (!editor) return;
    
    // Find the cleaner instance (stored globally)
    let cleanerInstance = window.htmlCleanerInstance;
    
    // Get history from instance or global store
    let history = [];
    if (cleanerInstance && typeof cleanerInstance.getHistory === 'function') {
        history = cleanerInstance.getHistory();
        // Also update global store
        window.htmlCleanerHistory = history;
    } else {
        // Fallback to global store
        history = window.htmlCleanerHistory || [];
    }
    
    // Debug logging
    console.log('Opening history drawer. Found:', history.length, 'entries');
    console.log('Cleaner instance:', cleanerInstance ? 'found' : 'not found');
    console.log('History:', history);
    
    if (!history || history.length === 0) {
        if (typeof utils !== 'undefined') {
            utils.showNotification('No history available. Clean some HTML first!', 'warning');
        } else {
            alert('No history available. Clean some HTML first!');
        }
        return;
    }
    
    // Build history content
    let historyContent = `
        <div class="html-history-container">
            <div class="mb-3">
                <p class="text-light mb-3">Select a version to restore:</p>
                <div class="list-group">
    `;
    
    history.forEach((entry, index) => {
        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleString();
        const reduction = entry.reduction || 0;
        const isPositive = reduction > 0;
        
        historyContent += `
            <div class="list-group-item bg-dark border-secondary mb-2" style="cursor: pointer;" onclick="restoreHTMLFromHistory(${index})">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="text-light mb-1">
                            <i class="fas fa-clock me-2"></i>${timeStr}
                        </h6>
                        <div class="mb-2">
                            <small class="text-muted">
                                Original: <span class="text-info">${entry.originalLength.toLocaleString()}</span> chars 
                                → Cleaned: <span class="text-success">${entry.cleanedLength.toLocaleString()}</span> chars
                            </small>
                        </div>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge ${isPositive ? 'bg-success' : 'bg-secondary'}">
                                ${isPositive ? '↓' : ''} ${Math.abs(reduction)}% ${isPositive ? 'reduced' : 'changed'}
                            </span>
                            <span class="badge bg-info">${entry.timeTaken}ms</span>
                        </div>
                    </div>
                </div>
                <div class="mt-2 d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); restoreHTMLFromHistory(${index}, 'original')">
                        <i class="fas fa-undo me-1"></i> Restore Original
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); restoreHTMLFromHistory(${index}, 'cleaned')">
                        <i class="fas fa-check me-1"></i> Restore Cleaned
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="event.stopPropagation(); previewHistoryEntry(${index})">
                        <i class="fas fa-eye me-1"></i> Preview
                    </button>
                </div>
            </div>
        `;
    });
    
    historyContent += `
                </div>
            </div>
        </div>
    `;
    
    // Store history globally for restore functions
    window.htmlCleanerHistory = history;
    if (cleanerInstance) {
        window.htmlCleanerInstance = cleanerInstance;
    }
    
    // Refresh history from instance if available
    if (cleanerInstance && typeof cleanerInstance.getHistory === 'function') {
        const freshHistory = cleanerInstance.getHistory();
        if (freshHistory && freshHistory.length > 0) {
            window.htmlCleanerHistory = freshHistory;
        }
    }
    
    // Use the existing drawer function
    if (typeof openPreviewDrawerWithContent === 'function') {
        openPreviewDrawerWithContent(historyContent, `HTML History (${history.length} entries)`);
        // Hide copy button for history
        const copyBtn = document.getElementById('copyCodeDrawerBtn');
        if (copyBtn) {
            copyBtn.style.display = 'none';
        }
    } else {
        alert('History drawer not available');
    }
}

// Function to restore HTML from history
function restoreHTMLFromHistory(index, type = 'original') {
    const history = window.htmlCleanerHistory || [];
    if (index < 0 || index >= history.length) {
        if (typeof utils !== 'undefined') {
            utils.showNotification('Invalid history entry!', 'error');
        }
        return;
    }
    
    const entry = history[index];
    const cleanerInstance = window.htmlCleanerInstance;
    
    if (cleanerInstance && typeof cleanerInstance.restoreFromHistory === 'function') {
        cleanerInstance.restoreFromHistory(entry, type);
    } else {
        // Fallback: directly set editor value
        const editor = document.getElementById('htmlEditor');
        if (editor) {
            const content = type === 'original' ? entry.original : entry.cleaned;
            editor.value = content;
            // Trigger update if possible
            if (editor.dispatchEvent) {
                editor.dispatchEvent(new Event('input'));
            }
        }
    }
    
    // Close drawer
    if (typeof closePreviewDrawer === 'function') {
        closePreviewDrawer();
    }
}

// Function to preview a history entry
function previewHistoryEntry(index) {
    const history = window.htmlCleanerHistory || [];
    if (index < 0 || index >= history.length) return;
    
    const entry = history[index];
    const htmlContent = entry.cleaned || entry.original;
    
    // Escape HTML for display
    const escapedHTML = htmlContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    const previewContent = `
        <div class="html-preview-container">
            <div class="mb-3">
                <p class="text-light mb-2">History Entry Preview (${new Date(entry.timestamp).toLocaleString()}):</p>
                <div class="position-relative">
                    <button class="btn btn-sm btn-success position-absolute top-0 end-0 m-2" onclick="copyHistoryEntry(${index})" style="z-index: 10;">
                        <i class="fas fa-copy me-1"></i> Copy
                    </button>
                    <pre class="bg-dark text-light p-3 rounded" style="max-height: 70vh; overflow: auto; font-size: 13px; line-height: 1.5;"><code>${escapedHTML}</code></pre>
                </div>
            </div>
        </div>
    `;
    
    if (typeof openPreviewDrawerWithContent === 'function') {
        openPreviewDrawerWithContent(previewContent, 'History Preview');
        const copyBtn = document.getElementById('copyCodeDrawerBtn');
        if (copyBtn) {
            copyBtn.style.display = 'inline-block';
            copyBtn.onclick = function() {
                copyHistoryEntry(index);
            };
        }
    }
}

// Function to copy history entry
function copyHistoryEntry(index) {
    const history = window.htmlCleanerHistory || [];
    if (index < 0 || index >= history.length) return;
    
    const entry = history[index];
    const content = entry.cleaned || entry.original;
    
    navigator.clipboard.writeText(content).then(() => {
        if (typeof utils !== 'undefined') {
            utils.showNotification('History entry copied to clipboard!', 'success');
        } else {
            alert('History entry copied to clipboard!');
        }
    }).catch(() => {
        if (typeof utils !== 'undefined') {
            utils.showNotification('Failed to copy!', 'error');
        }
    });
}