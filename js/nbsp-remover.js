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
            removeInlineStyles: true,
            preserveEssentialAttrs: true,
            removeComments: true,
            normalizeWhitespace: true,
            removeScriptStyleTags: true,
            removeBrTags: true,
            convertLineBreaks: true,
            removeEmptyTags: true,
            removeFontTags: false,
            minifyHTML: false,
            beautifyHTML: false
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

    showLoader() {
        const loader = document.getElementById('htmlEditorLoader');
        if (loader) {
            loader.style.display = 'flex';
        }
        // Disable editor during processing
        if (this.elements.editor) {
            this.elements.editor.disabled = true;
        }
    }
    
    hideLoader() {
        const loader = document.getElementById('htmlEditorLoader');
        if (loader) {
            loader.style.display = 'none';
        }
        // Enable editor after processing
        if (this.elements.editor) {
            this.elements.editor.disabled = false;
        }
    }

    async cleanHTML() {
        let content = this.elements.editor.value;
        
        if (!content.trim()) {
            this.showNotification('Please enter some HTML content first!', true);
            return;
        }
        
        // Check if any option is selected
        const hasAnyOption = [
            this.elements.removeNBSP,
            this.elements.removeComments,
            this.elements.removeScriptStyleTags,
            this.elements.removeBrTags,
            this.elements.removeFontTags,
            this.elements.removeClasses,
            this.elements.removeIds,
            this.elements.removeStyleAttrs,
            this.elements.removeDataAttrs,
            this.elements.removeEmptyTags,
            this.elements.removeInlineStyles,
            this.elements.normalizeWhitespace,
            this.elements.convertLineBreaks,
            this.elements.minifyHTML,
            this.elements.beautifyHTML
        ].some(el => el?.checked);
        
        if (!hasAnyOption) {
            this.showNotification('Please select at least one cleaning option!', true);
            return;
        }
        
        // Show loader
        this.showLoader();
        const loaderStartTime = performance.now();
        const minLoaderDuration = 2000; // Minimum 2 seconds
        
        // Save to history
        const originalContent = content;
        const startTime = performance.now();
        
        try {
            // Store original content for undo
        this.saveToHistory(originalContent);
            
            // Process operations in specific order, one by one
            // Step 1: Remove &nbsp;
            if (this.elements.removeNBSP?.checked) {
                content = content.replace(/&nbsp;/gi, ' ');
                content = content.replace(/\u00A0/g, ' ');
                this.showSuccessNotification('✓ Removed &nbsp; entities');
            }
            
            // Step 2: Remove classes
            if (this.elements.removeClasses?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const allElements = doc.body.querySelectorAll('*');
                allElements.forEach(element => {
                    element.removeAttribute('class');
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed class attributes');
            }
            
            // Step 3: Remove ids
            if (this.elements.removeIds?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const allElements = doc.body.querySelectorAll('*');
                allElements.forEach(element => {
                    element.removeAttribute('id');
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed id attributes');
            }
            
            // Step 4: Remove style attrs
            if (this.elements.removeStyleAttrs?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const allElements = doc.body.querySelectorAll('*');
                allElements.forEach(element => {
                    element.removeAttribute('style');
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed style attributes');
            }
            
            // Step 5: Remove data attrs
            if (this.elements.removeDataAttrs?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const allElements = doc.body.querySelectorAll('*');
                allElements.forEach(element => {
                    const attrs = Array.from(element.attributes);
                    attrs.forEach(attr => {
                        if (attr.name.startsWith('data-')) {
                            element.removeAttribute(attr.name);
                        }
                    });
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed data attributes');
            }
            
            // Step 6: Remove inline styles
            if (this.elements.removeInlineStyles?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const allElements = doc.body.querySelectorAll('*');
                allElements.forEach(element => {
                    element.removeAttribute('style');
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed inline styles');
            }
            
            // Step 7: Remove font/span tags
            if (this.elements.removeFontTags?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                // Get all font and span tags
                const fontTags = doc.body.querySelectorAll('font');
                const spanTags = doc.body.querySelectorAll('span');
                
                // Process in reverse order to avoid issues with nested tags
                const allTags = Array.from([...fontTags, ...spanTags]).reverse();
                
                // Remove font and span tags by unpacking their content
                allTags.forEach(element => {
                    this.unpackElement(element);
                });
                
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed font/span tags');
            }
            
            // Step 8: Preserve essentials (this is a setting, not an operation)
            if (this.elements.preserveEssentialAttrs?.checked) {
                this.showSuccessNotification('✓ Preserving essential attributes');
            }
            
            // Step 9: Remove comments
            if (this.elements.removeComments?.checked) {
                content = content.replace(/<!--[\s\S]*?-->/g, '');
                this.showSuccessNotification('✓ Removed HTML comments');
            }
            
            // Step 9: Normalize whitespace
            if (this.elements.normalizeWhitespace?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
                const textNodes = [];
                let node;
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                }
                textNodes.forEach(textNode => {
                    textNode.textContent = textNode.textContent.replace(/\s+/g, ' ').trim();
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Normalized whitespace');
            }
            
            // Step 10: Remove script/style tags
            if (this.elements.removeScriptStyleTags?.checked) {
                content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                this.showSuccessNotification('✓ Removed script and style tags');
            }
            
            // Step 11: Remove br tags
            if (this.elements.removeBrTags?.checked) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
                const brTags = doc.body.querySelectorAll('br');
                brTags.forEach(br => {
                    const space = document.createTextNode(' ');
                    if (br.parentNode) {
                        br.parentNode.replaceChild(space, br);
                    }
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed br tags');
            }
            
            // Step 12: Convert line breaks
            if (this.elements.convertLineBreaks?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const html = doc.body.innerHTML;
                const paragraphs = html.split(/(?:\r?\n){2,}/);
                if (paragraphs.length > 1) {
                    const newHTML = paragraphs.map(p => {
                        const trimmed = p.trim();
                        return trimmed ? `<p>${trimmed}</p>` : '';
                    }).join('');
                    doc.body.innerHTML = newHTML;
                }
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Converted line breaks to paragraphs');
            }
            
            // Step 13: Remove font/span tags
            if (this.elements.removeFontTags?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                // Get all font and span tags
                const fontTags = doc.body.querySelectorAll('font');
                const spanTags = doc.body.querySelectorAll('span');
                
                // Remove font tags by unpacking their content
                fontTags.forEach(element => {
                    this.unpackElement(element);
                });
                
                // Remove span tags by unpacking their content
                spanTags.forEach(element => {
                    this.unpackElement(element);
                });
                
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed font/span tags');
            }
            
            // Step 14: Remove empty tags (last)
            if (this.elements.removeEmptyTags?.checked) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const allElementsReverse = Array.from(doc.body.querySelectorAll('*')).reverse();
                allElementsReverse.forEach(element => {
                    this.removeIfEmpty(element);
                });
                content = doc.body.innerHTML;
                this.showSuccessNotification('✓ Removed empty tags');
            }
            
            // Apply beautify or minify if checked
            if (this.elements.beautifyHTML?.checked) {
                content = this.beautifyHTML(content);
                this.showSuccessNotification('✓ Beautified HTML');
            } else if (this.elements.minifyHTML?.checked) {
                content = content.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
                this.showSuccessNotification('✓ Minified HTML');
            }
            
            // Update editor with cleaned content
            this.elements.editor.value = content;
            
            // Update stats and preview
            const endTime = performance.now();
            const timeTaken = Math.round(endTime - startTime);
            
            this.updateStats();
            
            // Calculate reduction
            const originalLength = originalContent.length;
            const cleanedLength = content.length;
            const reduction = Math.round((originalLength - cleanedLength) / originalLength * 100);
            
            if (this.elements.lastCleanTime) {
                this.elements.lastCleanTime.textContent = `${timeTaken}ms`;
            }
            if (this.elements.reductionRate) {
                this.elements.reductionRate.textContent = `${reduction}%`;
            }
            
            // Add to history
            this.addToHistoryList(originalContent, content, timeTaken, reduction);
            
            // Ensure global instance is set
            window.htmlCleanerInstance = this;
            
            // Calculate how long loader has been showing
            const loaderElapsed = performance.now() - loaderStartTime;
            const remainingTime = Math.max(0, minLoaderDuration - loaderElapsed);
            
            // Hide loader after minimum duration
            setTimeout(() => {
                this.hideLoader();
            }, remainingTime);
            
            // Final success notification (show after loader hides)
            setTimeout(() => {
                this.showNotification(
                    `✓ All operations completed in ${timeTaken}ms! Reduced by ${reduction}%`,
                    false,
                    3000
                );
            }, remainingTime);
            
        } catch (error) {
            console.error('Error cleaning HTML:', error);
            // Calculate how long loader has been showing
            const loaderElapsed = performance.now() - loaderStartTime;
            const remainingTime = Math.max(0, minLoaderDuration - loaderElapsed);
            
            // Hide loader after minimum duration
            setTimeout(() => {
                this.hideLoader();
            }, remainingTime);
            
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
        
        // First pass: remove empty elements (we need to do this in reverse order to handle nested empty tags)
        if (this.elements.removeEmptyTags?.checked) {
            // Get all elements in reverse order (from deepest to shallowest)
            const allElementsReverse = Array.from(doc.body.querySelectorAll('*')).reverse();
            allElementsReverse.forEach(element => {
                this.removeIfEmpty(element);
            });
        }
        
        // Second pass: process other operations
        const allElements = doc.body.querySelectorAll('*');
        allElements.forEach(element => {
            // Remove font tags (unpack their content) - ONLY if checked
            if (this.elements.removeFontTags?.checked) {
                if (element.tagName.toLowerCase() === 'font') {
                    this.unpackElement(element);
                    return;
                }
            }
            
            // Only process attributes if at least one attribute removal option is checked
            const needsAttributeProcessing = this.elements.removeClasses?.checked ||
                                           this.elements.removeIds?.checked ||
                                           this.elements.removeStyleAttrs?.checked ||
                                           this.elements.removeDataAttrs?.checked ||
                                           this.elements.removeInlineStyles?.checked;
            
            if (needsAttributeProcessing) {
            const attrs = Array.from(element.attributes);
            attrs.forEach(attr => {
                this.processAttribute(element, attr);
            });
            }
        });
        
        // Convert line breaks to paragraphs if enabled - ONLY if checked
        if (this.elements.convertLineBreaks?.checked) {
            this.convertLineBreaksToParagraphs(doc.body);
        }
        
        // Normalize whitespace in text nodes - ONLY if checked
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
        
        // Remove specific attributes ONLY if corresponding checkbox is checked
        if (this.elements.removeClasses?.checked && attrName === 'class') {
            element.removeAttribute('class');
        }
        else if (this.elements.removeIds?.checked && attrName === 'id') {
            element.removeAttribute('id');
        }
        else if ((this.elements.removeStyleAttrs?.checked || this.elements.removeInlineStyles?.checked) && attrName === 'style') {
            element.removeAttribute('style');
        }
        else if (this.elements.removeDataAttrs?.checked && attrName.startsWith('data-')) {
            element.removeAttribute(attrName);
        }
        // Don't remove other attributes unless explicitly checked
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
        // List of tags that can be removed if empty
        const emptyTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                          'li', 'td', 'th', 'section', 'article', 'aside', 'header', 'footer',
                          'em', 'strong', 'i', 'b', 'u', 'small', 'sub', 'sup', 'mark', 'del', 'ins',
                          'code', 'pre', 'blockquote', 'cite', 'abbr', 'dfn', 'kbd', 'samp', 'var',
                          'a', 'label', 'button'];
        
        const tagName = element.tagName.toLowerCase();
        
        if (emptyTags.includes(tagName)) {
            // Check if element has any meaningful text content
            const hasText = element.textContent.trim().length > 0;
            
            // Check if element has meaningful attributes (that should preserve it)
            const hasMeaningfulAttributes = Array.from(element.attributes).some(attr => {
                const attrName = attr.name.toLowerCase();
                // Preserve if has href (links), src (images), alt (images), title (tooltips), id, or class
                return ['href', 'src', 'alt', 'title', 'id', 'class'].includes(attrName) && attr.value.trim().length > 0;
            });
            
            // Check if element has meaningful children
            // A child is meaningful if it has text OR has meaningful attributes OR has meaningful children
            let hasMeaningfulChildren = false;
            for (let child of element.children) {
                const childTagName = child.tagName.toLowerCase();
                const childHasText = child.textContent.trim().length > 0;
                const childHasAttrs = Array.from(child.attributes).some(attr => {
                    const attrName = attr.name.toLowerCase();
                    return ['href', 'src', 'alt', 'title', 'id', 'class'].includes(attrName) && attr.value.trim().length > 0;
                });
                
                // If child has text or meaningful attributes, it's meaningful
                if (childHasText || childHasAttrs) {
                    hasMeaningfulChildren = true;
                    break;
                }
                
                // For certain tags, even if empty, they might be meaningful if they have attributes
                if (childHasAttrs) {
                    hasMeaningfulChildren = true;
                    break;
                }
            }
            
            // Remove if no text, no meaningful children, and no meaningful attributes
            if (!hasText && !hasMeaningfulChildren && !hasMeaningfulAttributes) {
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
        // Only replace &nbsp; if the checkbox is checked
        if (this.elements.removeNBSP?.checked) {
        html = html.replace(/&nbsp;/gi, ' ');
        // Also handle other nbsp variations
        html = html.replace(/\u00A0/g, ' '); // Unicode non-breaking space
        }
        
        // Remove leading spaces after opening tags (e.g., <h1> Welcome</h1> -> <h1>Welcome</h1>)
        // This pattern matches: > followed by whitespace, followed by a non-whitespace character
        // It removes the whitespace between the tag and the first character
        html = html.replace(/>(\s+)([^\s<])/g, '>$2');
        
        // Remove <br> tags if option is enabled (handle all variations)
        if (this.elements.removeBrTags?.checked) {
            // Remove all variations: <br>, <br/>, <br />, </br>, </ br>
            html = html.replace(/<\/?\s*br\s*\/?>/gi, ' ');
            // Clean up multiple spaces that might result from br removal
            html = html.replace(/\s+/g, ' ');
        }
        
        // Remove extra whitespace - ONLY if normalizeWhitespace is checked
        if (this.elements.normalizeWhitespace?.checked) {
            html = html
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/>\s+</g, '><')
                .trim();
        }
        
        // Beautify HTML (format with proper indentation) - ONLY if checked
        if (this.elements.beautifyHTML?.checked) {
            html = this.beautifyHTML(html);
        }
        // Minify HTML (only if beautify is not checked) - ONLY if checked
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
        // First, normalize the HTML - remove extra whitespace between tags
        html = html.replace(/>\s+</g, '><').trim();
        
        let formatted = '';
        let indent = 0;
        const indentSize = 2;
        const tab = ' '.repeat(indentSize);
        
        // List of self-closing/void tags
        const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        
        // List of inline elements that should stay on the same line
        const inlineTags = ['a', 'abbr', 'acronym', 'b', 'bdi', 'bdo', 'big', 'cite', 'code', 'del', 'dfn', 'em', 'font', 
                           'i', 'ins', 'kbd', 'label', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 
                           'time', 'tt', 'u', 'var', 'wbr'];
        
        let i = 0;
        let currentLine = ''; // Track current line being built
        let isInInlineContext = false; // Track if we're in an inline context
        
        while (i < html.length) {
            if (html[i] === '<') {
                // Find the complete tag
                let tagEnd = html.indexOf('>', i);
                if (tagEnd === -1) break;
                
                const tag = html.substring(i, tagEnd + 1);
                const tagMatch = tag.match(/<\/?([a-z][a-z0-9]*)/i);
                const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
                const isClosing = tag.startsWith('</');
                const isSelfClosing = tag.endsWith('/>') || voidTags.includes(tagName);
                const isComment = tag.startsWith('<!--');
                const isInline = inlineTags.includes(tagName);
                
                // Get text content between this tag and the next tag
                let nextTagStart = html.indexOf('<', tagEnd + 1);
                if (nextTagStart === -1) nextTagStart = html.length;
                const textContent = html.substring(tagEnd + 1, nextTagStart).trim();
                
                if (isComment) {
                    // Comments on their own line
                    if (currentLine.trim()) {
                        formatted += currentLine + '\n';
                        currentLine = '';
                    }
                    formatted += tab.repeat(indent) + tag + '\n';
                } else if (isClosing) {
                    if (isInline) {
                        // Inline closing tag - add to current line
                        currentLine += tag;
                        // If there's text after, add space and text to the same line
                        if (textContent) {
                            currentLine += ' ' + textContent;
                        }
                    } else {
                        // Block closing tag - new line
                        if (currentLine.trim()) {
                            formatted += currentLine + '\n';
                            currentLine = '';
                        }
                    indent = Math.max(0, indent - 1);
                    formatted += tab.repeat(indent) + tag + '\n';
                        // Handle text content after closing tag
                        if (textContent) {
                            currentLine = tab.repeat(indent + 1) + textContent;
                        }
                    }
                } else if (isSelfClosing) {
                    if (isInline) {
                        // Inline self-closing tag - add to current line
                        currentLine += tag;
                        if (textContent) {
                            currentLine += ' ' + textContent;
                        }
                    } else {
                        // Block self-closing tag - new line
                        if (currentLine.trim()) {
                            formatted += currentLine + '\n';
                            currentLine = '';
                        }
                    formatted += tab.repeat(indent) + tag + '\n';
                        if (textContent) {
                            currentLine = tab.repeat(indent) + textContent;
                        }
                    }
                } else {
                    // Opening tag
                    if (isInline) {
                        // Inline opening tag - add to current line
                        if (!currentLine.trim()) {
                            // Start new line with proper indent if current line is empty
                            currentLine = tab.repeat(indent);
                        }
                        // Add space before inline element if current line doesn't end with space or >
                        if (currentLine.trim() && !currentLine.trim().endsWith('>') && !currentLine.trim().endsWith(' ')) {
                            currentLine += ' ';
                        }
                        currentLine += tag;
                        // If there's text content before nested tags, add it
                        if (textContent) {
                            currentLine += textContent;
                        }
                    } else {
                        // Block opening tag - check if it has nested tags or just simple text
                        let hasNestedBlockTags = false;
                        let hasOnlyInlineTags = true;
                        let matchingClosePos = -1;
                        
                        // Find matching closing tag and check for nested tags
                        let searchPos = tagEnd + 1;
                        let depth = 1;
                        while (searchPos < html.length && depth > 0) {
                            let nextOpen = html.indexOf('<', searchPos);
                            if (nextOpen === -1) break;
                            
                            let nextClose = html.indexOf('>', nextOpen);
                            if (nextClose === -1) break;
                            
                            let nextTag = html.substring(nextOpen, nextClose + 1);
                            let nextTagMatch = nextTag.match(/<\/?([a-z][a-z0-9]*)/i);
                            let nextTagName = nextTagMatch ? nextTagMatch[1].toLowerCase() : '';
                            let isNextClosing = nextTag.startsWith('</');
                            let isNextSelfClosing = nextTag.endsWith('/>') || voidTags.includes(nextTagName);
                            
                            if (isNextClosing && nextTagName === tagName) {
                                depth--;
                                if (depth === 0) {
                                    matchingClosePos = nextClose + 1;
                                    break;
                                }
                            } else if (!isNextClosing && !isNextSelfClosing) {
                                depth++;
                                // Check if nested tag is a block element
                                if (!inlineTags.includes(nextTagName)) {
                                    hasNestedBlockTags = true;
                                    hasOnlyInlineTags = false;
                                }
                            }
                            
                            searchPos = nextClose + 1;
                        }
                        
                        // If it only contains inline tags and text, keep everything on one line
                        if (!hasNestedBlockTags && matchingClosePos > 0) {
                            if (currentLine.trim()) {
                                formatted += currentLine + '\n';
                                currentLine = '';
                            }
                            // Extract the entire content between opening and closing tags
                            let fullContent = html.substring(tagEnd + 1, html.lastIndexOf('</', matchingClosePos));
                            let closeTagStart = html.lastIndexOf('</', matchingClosePos);
                            let closeTag = html.substring(closeTagStart, matchingClosePos);
                            
                            // Normalize spaces: ensure space before inline elements
                            // Pattern: text character followed by <inline-tag> should have a space
                            fullContent = fullContent.replace(/([^\s>])(<)([a-z]+)/gi, (match, before, bracket, tagName) => {
                                if (inlineTags.includes(tagName.toLowerCase())) {
                                    return before + ' ' + bracket + tagName;
                                }
                                return match;
                            });
                            
                            // Also ensure space after closing inline tags before text
                            fullContent = fullContent.replace(/(<\/[^>]+>)([^\s<])/gi, '$1 $2');
                            
                            // Clean up multiple spaces but preserve single spaces
                            fullContent = fullContent.replace(/\s+/g, ' ').trim();
                            
                            // Format: <tag>content</tag> on one line
                            formatted += tab.repeat(indent) + tag + fullContent + closeTag + '\n';
                            i = matchingClosePos;
                            continue;
                        } else {
                            // Complex tag with nested block content - format each part on its own line
                            if (currentLine.trim()) {
                                formatted += currentLine + '\n';
                                currentLine = '';
                            }
                    formatted += tab.repeat(indent) + tag + '\n';
                            
                            // Add text content if present (before any nested tags)
                            if (textContent) {
                                currentLine = tab.repeat(indent + 1) + textContent;
                            } else {
                                // Start a new line for nested content
                                currentLine = tab.repeat(indent + 1);
                            }
                            
                    indent++;
                        }
                    }
                }
                
                i = tagEnd + 1;
            } else {
                // This shouldn't happen in normalized HTML, but handle it
                i++;
            }
        }
        
        // Add any remaining current line
        if (currentLine.trim()) {
            formatted += currentLine + '\n';
        }
        
        // Clean up: remove extra blank lines but preserve structure
        let lines = formatted.split('\n');
        let cleaned = [];
        let lastWasEmpty = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                // Only add one blank line max between content
                if (!lastWasEmpty && i > 0 && i < lines.length - 1) {
                    cleaned.push('');
                    lastWasEmpty = true;
                }
            } else {
                cleaned.push(lines[i]); // Keep original line with indentation
                lastWasEmpty = false;
            }
        }
        
        // Final cleanup: remove more than 2 consecutive blank lines
        formatted = cleaned.join('\n');
        formatted = formatted.replace(/\n{3,}/g, '\n\n');
        
        return formatted.trim();
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


    showNotification(message, isError = false, duration = 2000) {
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
        }, duration);
    }
    
    showSuccessNotification(message) {
        // Show notification but don't block - process continues immediately
        this.showNotification(message, false, 1500);
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