// ========== HACKER THEME LANDING LOADER ANIMATION ==========
(function() {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited');
    const loader = document.getElementById('landingLoader');
    const mainContent = document.getElementById('mainContent');
    
    if (!hasVisited) {
        // First visit - show loader animation
        if (loader) {
            loader.style.display = 'flex';
        }
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // Terminal typing animation
        const typingText = document.querySelector('.typing-text');
        const progressText = document.querySelector('.progress-text');
        const welcomeMessage = 'Welcome to Course Content Generator Suite';
        let charIndex = 0;
        
        function typeText() {
            if (charIndex < welcomeMessage.length && typingText) {
                typingText.textContent += welcomeMessage.charAt(charIndex);
                charIndex++;
                setTimeout(typeText, 80); // Typing speed
            }
        }
        
        // Start typing animation
        setTimeout(() => {
            if (typingText) {
                typingText.textContent = '';
                typeText();
            }
        }, 500);
        
        // Update progress text dynamically
        const progressMessages = [
            '[INITIALIZING SYSTEM...]',
            '[LOADING MODULES...]',
            '[CONNECTING TO SERVER...]',
            '[PREPARING INTERFACE...]',
            '[SYSTEM READY]'
        ];
        
        let progressIndex = 0;
        const progressInterval = setInterval(() => {
            if (progressText && progressIndex < progressMessages.length) {
                progressText.textContent = progressMessages[progressIndex];
                progressIndex++;
            } else {
                clearInterval(progressInterval);
            }
        }, 600);
        
        // After animation completes, hide loader and show main content
        setTimeout(() => {
            if (loader) {
                loader.classList.add('hide');
            }
            
            setTimeout(() => {
                if (loader) {
                    loader.style.display = 'none';
                }
                if (mainContent) {
                    mainContent.style.display = 'block';
                }
                // Mark as visited in localStorage
                localStorage.setItem('hasVisited', 'true');
                clearInterval(progressInterval);
            }, 800); // Wait for fade out animation
        }, 6000); // Show loader for 4 seconds (increased for better effect)
    } else {
        // Returning visitor - hide loader immediately
        if (loader) {
            loader.style.display = 'none';
        }
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }
})();

// ========== PREVIEW DRAWER STATE MANAGEMENT ==========
const previewDrawerState = {
    isOpen: false,
    currentCodeElementId: '',
    currentTitle: '',
    generatedCode: '',
    currentFaqIndex: 0,
    faqArray: [],
    resourceTableHTML: ''
};

// ========== DYNAMIC CODE SECTION MANAGEMENT ==========
const codeSectionState = {
    currentTab: 'course',
    activeSection: null
};

// ========== ANIMATED FAVICON ==========
function createAnimatedFavicon() {
    const frameUrls = [
        'https://api.imghippo.com/files/xaDF5036Pg.webp',
        'https://api.imghippo.com/files/Byw8441LyU.webp',
        'https://api.imghippo.com/files/OMRB5894PM.webp',
        'https://api.imghippo.com/files/aWwT8956okE.webp',
        'https://api.imghippo.com/files/szpK3253uQ.webp',
        'https://api.imghippo.com/files/OCNp9289B.webp',
        'https://api.imghippo.com/files/Cve4428hjE.webp',
        'https://api.imghippo.com/files/oEdX3633KQ.webp',
        'https://api.imghippo.com/files/pe5312jh.webp',
        'https://api.imghippo.com/files/tN6032k.webp',
        'https://api.imghippo.com/files/ALhs5878PIM.webp',
        'https://api.imghippo.com/files/jJ7827D.webp',
        'https://api.imghippo.com/files/hHv5541MA.webp',
        'https://api.imghippo.com/files/JTKk1632gk.webp',
        'https://api.imghippo.com/files/cy6079QM.webp',
        'https://api.imghippo.com/files/hzUt2965X.webp',
        'https://api.imghippo.com/files/Tngt2746aI.webp',
        'https://api.imghippo.com/files/tNI6716EY.webp',
        'https://api.imghippo.com/files/fdzK3248hwE.webp',
        'https://api.imghippo.com/files/WmU5310QWs.webp',
        'https://api.imghippo.com/files/btnl8092nWk.webp',
        'https://api.imghippo.com/files/mBT8928I.webp',
        'https://api.imghippo.com/files/uV5779NE.webp',
        'https://api.imghippo.com/files/wdgF7812gz.webp',
        'https://api.imghippo.com/files/HgWv5913es.webp'
    ];
    
    let currentFrame = 0;
    const favicon = document.getElementById('animatedFavicon');
    
    function rotateFavicon() {
        if (frameUrls.length > 0) {
            favicon.href = frameUrls[currentFrame];
            currentFrame = (currentFrame + 1) % frameUrls.length;
        }
    }
    
    if (frameUrls.length > 1) {
        setInterval(rotateFavicon, 100);
    } else if (frameUrls.length === 1) {
        favicon.href = frameUrls[0];
    }
}

// ========== CODE SECTION MANAGEMENT ==========
function showCodeSection(sectionId) {
    // Hide all sections in the current tab
    const allSections = document.querySelectorAll(`#${codeSectionState.currentTab}CodeSections .code-section`);
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        codeSectionState.activeSection = sectionId;
    }
}

function activateCodeArea(tab) {
    // Hide empty state
    const emptyState = document.getElementById(`${tab}EmptyState`);
    if (emptyState) emptyState.classList.add('d-none');
    
    // Show code area
    const codeArea = document.getElementById(`${tab}CodeArea`);
    if (codeArea) {
        codeArea.classList.add('generated-content-area');
    }
    
    // For course tab, show selector if it exists
    if (tab === 'course') {
        const selector = document.getElementById('courseCodeSelector');
        if (selector) selector.style.display = 'flex';
    }
}

function showGeneratedCode(tab, sectionId) {
    // Activate the code area
    activateCodeArea(tab);
    
    // Show the specific section
    if (sectionId) {
        showCodeSection(sectionId);
        
        // Update selector button if it exists
        if (tab === 'course') {
            const buttons = document.querySelectorAll('#courseCodeSelector .code-selector-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-target') === sectionId) {
                    btn.classList.add('active');
                }
            });
        }
    }
}

// ========== PREVIEW DRAWER FUNCTIONS ==========
function openPreviewDrawer(codeElementId, title) {
    const codeElement = document.getElementById(codeElementId);
    const code = codeElement.value;
    
    if (!code || code.trim() === '') {
        utils.showNotification(`No ${title.toLowerCase()} code to preview. Please generate code first.`, "warning");
        return;
    }
    
    // Update state
    previewDrawerState.currentCodeElementId = codeElementId;
    previewDrawerState.currentTitle = title;
    previewDrawerState.generatedCode = code;
    
    // Special handling for FAQ preview
    if (codeElementId === 'faqCode' && courseData.faqData && courseData.faqData.length > 0) {
        previewDrawerState.faqArray = courseData.faqData;
        
        // Update drawer for FAQ preview
        document.getElementById('previewDrawerTitle').innerHTML = `<i class="fas fa-eye me-2"></i>FAQ Preview (${previewDrawerState.faqArray.length} Questions)`;
        
        // Create FAQ preview with all questions and copy buttons
        let faqPreviewContent = `
            <div class="faq-preview-container">
                <div class="mb-4">
                    <p class="text-light">All ${previewDrawerState.faqArray.length} questions are displayed below. You can copy individual questions and answers.</p>
                </div>
        `;
        
        previewDrawerState.faqArray.forEach((faq, index) => {
            faqPreviewContent += `
                <div class="faq-preview-item">
                    <div class="faq-question-section">
                        <h5>Question ${index + 1}:</h5>
                        <div class="faq-content-box">
                            <button class="copy-btn-small" onclick="copyFaqQuestion(${index})">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                            <div>${faq.question}</div>
                        </div>
                    </div>
                    <div class="faq-answer-section">
                        <h5>Answer ${index + 1}:</h5>
                        <div class="faq-content-box">
                            <button class="copy-btn-small" onclick="copyFaqAnswer(${index})">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                            <div>${faq.answer}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        faqPreviewContent += `</div>`;
        
        document.getElementById('previewDrawerContent').innerHTML = faqPreviewContent;
        
    } else if (codeElementId === 'htmlOutput' && previewDrawerState.resourceTableHTML) {
        // Special handling for Resources preview with table
        document.getElementById('previewDrawerTitle').innerHTML = `<i class="fas fa-eye me-2"></i>${title} Preview`;
        document.getElementById('previewDrawerContent').innerHTML = `
            <div class="resource-table-preview">
                <h4>Resource Table Preview</h4>
                <p>This table shows the resources extracted from your Excel file:</p>
                ${previewDrawerState.resourceTableHTML}
            </div>
        `;
    } else {
        // Regular preview for other content types
        document.getElementById('previewDrawerTitle').innerHTML = `<i class="fas fa-eye me-2"></i>${title} Preview`;
        document.getElementById('previewDrawerContent').innerHTML = code;
    }
    
    // Show/hide copy code button (hide for FAQ as we have individual copy buttons)
    const copyBtn = document.getElementById('copyCodeDrawerBtn');
    copyBtn.style.display = (codeElementId === 'faqCode' || codeElementId === 'htmlOutput') ? 'none' : 'inline-block';
    
    // Open the drawer with animation
    document.getElementById('previewDrawer').classList.add('open');
    document.getElementById('previewDrawerOverlay').classList.add('active');
    previewDrawerState.isOpen = true;
    
    // Set focus to the drawer for accessibility
    document.getElementById('previewDrawer').focus();
    
    // Add event listener for Escape key
    document.addEventListener('keydown', handleEscapeKey);
}

// Simple FAQ copying functions
function copyFaqQuestion(index) {
    if (!previewDrawerState.faqArray || !previewDrawerState.faqArray[index]) {
        utils.showNotification("No question found to copy!", "warning");
        return;
    }
    
    const question = previewDrawerState.faqArray[index].question;
    copyToClipboardSimple(question, "Question");
}

function copyFaqAnswer(index) {
    if (!previewDrawerState.faqArray || !previewDrawerState.faqArray[index]) {
        utils.showNotification("No answer found to copy!", "warning");
        return;
    }
    
    const answer = previewDrawerState.faqArray[index].answer;
    copyToClipboardSimple(answer, "Answer");
}

function copyToClipboardSimple(text, type) {
    // Create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.focus();
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
            utils.showNotification(`${type} copied to clipboard!`, "success");
        } else {
            utils.showNotification(`Failed to copy ${type.toLowerCase()}. Please try again.`, "error");
        }
    } catch (err) {
        document.body.removeChild(textarea);
        utils.showNotification(`Failed to copy ${type.toLowerCase()}. Please try again.`, "error");
    }
}

function closePreviewDrawer() {
    document.getElementById('previewDrawer').classList.remove('open');
    document.getElementById('previewDrawerOverlay').classList.remove('active');
    previewDrawerState.isOpen = false;
    
    // Reset FAQ state
    previewDrawerState.currentFaqIndex = 0;
    previewDrawerState.faqArray = [];
    
    // Remove event listener
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(event) {
    if (event.key === 'Escape' && previewDrawerState.isOpen) {
        closePreviewDrawer();
    }
}

// Copy code from drawer
document.getElementById('copyCodeDrawerBtn').addEventListener('click', function() {
    if (previewDrawerState.generatedCode) {
        navigator.clipboard.writeText(previewDrawerState.generatedCode).then(() => {
            utils.showNotification("Code copied to clipboard!", "success");
        }).catch(() => {
            utils.showNotification("Failed to copy code. Please try again.", "error");
        });
    } else {
        utils.showNotification("No code to copy!", "warning");
    }
});

// Focus trap for accessibility
document.getElementById('previewDrawer').addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        const focusableElements = this.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
});

// ========== COPY TO CLIPBOARD FUNCTION ==========
function copyToClipboard(elementId) {
    utils.copyToClipboard(elementId);
}

// Helper function to open preview drawer with custom content
function openPreviewDrawerWithContent(content, title) {
    // Update state
    previewDrawerState.currentCodeElementId = '';
    previewDrawerState.currentTitle = title;
    previewDrawerState.generatedCode = '';
    
    // Update drawer content
    document.getElementById('previewDrawerTitle').innerHTML = `<i class="fas fa-eye me-2"></i>${title}`;
    document.getElementById('previewDrawerContent').innerHTML = content;
    
    // Hide copy code button for debug content
    const copyBtn = document.getElementById('copyCodeDrawerBtn');
    copyBtn.style.display = 'none';
    
    // Open the drawer with animation
    document.getElementById('previewDrawer').classList.add('open');
    document.getElementById('previewDrawerOverlay').classList.add('active');
    previewDrawerState.isOpen = true;
    
    // Set focus to the drawer for accessibility
    document.getElementById('previewDrawer').focus();
    
    // Add event listener for Escape key
    document.addEventListener('keydown', handleEscapeKey);
}

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", function() {
    createAnimatedFavicon();
    
    // Set up code selector buttons for course tab
    const courseCodeSelector = document.getElementById('courseCodeSelector');
    if (courseCodeSelector) {
        courseCodeSelector.addEventListener('click', function(e) {
            if (e.target.classList.contains('code-selector-btn')) {
                // Update active button
                document.querySelectorAll('#courseCodeSelector .code-selector-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Show selected section
                const targetId = e.target.getAttribute('data-target');
                showCodeSection(targetId);
            }
        });
    }
    
    // Set up tab change listeners
    const tabEl = document.querySelector('#myTab');
    if (tabEl) {
        tabEl.addEventListener('shown.bs.tab', function (event) {
            const targetTab = event.target.getAttribute('aria-controls');
            codeSectionState.currentTab = targetTab;
        });
    }
    
    // Initialize file input listeners
    const fileInputs = [
        { id: "courseFileInput", infoId: "courseFileInfo" },
        { id: "blogFileInput", infoId: "blogFileInfo" },
        { id: "glossaryFileInput", infoId: "glossaryFileInfo" },
        { id: "resourceFileInput", infoId: "resourceFileInfo" }
    ];
    
    fileInputs.forEach(({id, infoId}) => {
        document.getElementById(id).addEventListener("change", function() {
            utils.showFileInfo(this, infoId);
        });
    });
});

// Set OpenAI API key from input
document.getElementById('openaiKey')?.addEventListener('input', function(e) {
    window.OPENAI_API_KEY = e.target.value;
});
// ... rest of your existing courseData and other functions remain exactly the same ...