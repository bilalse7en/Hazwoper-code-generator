// ========== HACKER THEME LANDING LOADER ANIMATION ==========
(function () {
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
                setTimeout(typeText, 80);
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
                localStorage.setItem('hasVisited', 'true');
                clearInterval(progressInterval);
            }, 800);
        }, 6000);
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

    // For blog tab, show selector if it exists
    if (tab === 'blog') {
        const selector = document.getElementById('blogCodeSelector');
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

        // Update selector button for blog tab
        if (tab === 'blog') {
            const buttons = document.querySelectorAll('#blogCodeSelector .code-selector-btn');
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
    if (codeElementId === 'faqCode' && courseData && courseData.faqData && courseData.faqData.length > 0) {
        previewDrawerState.faqArray = courseData.faqData;

        // Update drawer for FAQ preview
        document.getElementById('previewDrawerTitle').innerHTML = `<i class="fas fa-eye me-2"></i>FAQ Preview (${previewDrawerState.faqArray.length} Questions)`;

        // Create FAQ preview with all questions and copy buttons
        let faqPreviewContent = `
            <div class="faq-preview-container">
                <div class="mb-4">
                    <p>All ${previewDrawerState.faqArray.length} questions are displayed below. You can copy individual questions and answers.</p>
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

    } else if (codeElementId === 'blogFaqCode' && blogFAQData && blogFAQData.faqData && blogFAQData.faqData.length > 0) {
        // Special handling for Blog FAQ preview
        previewDrawerState.faqArray = blogFAQData.faqData;

        // Update drawer for Blog FAQ preview
        document.getElementById('previewDrawerTitle').innerHTML = `<i class="fas fa-eye me-2"></i>Blog FAQ Preview (${previewDrawerState.faqArray.length} Questions)`;

        // Create Blog FAQ preview with all questions and copy buttons
        let faqPreviewContent = `
            <div class="faq-preview-container">
                <div class="mb-4">
                    <p>All ${previewDrawerState.faqArray.length} blog FAQ questions are displayed below.</p>
                </div>
        `;

        previewDrawerState.faqArray.forEach((faq, index) => {
            faqPreviewContent += `
                <div class="faq-preview-item">
                    <div class="faq-question-section">
                        <h5>Question ${index + 1}:</h5>
                        <div class="faq-content-box">
                            <button class="copy-btn-small" onclick="copyBlogFaqQuestion(${index})">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                            <div>${faq.question}</div>
                        </div>
                    </div>
                    <div class="faq-answer-section">
                        <h5>Answer ${index + 1}:</h5>
                        <div class="faq-content-box">
                            <button class="copy-btn-small" onclick="copyBlogFaqAnswer(${index})">
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
    copyBtn.style.display = (codeElementId === 'faqCode' || codeElementId === 'blogFaqCode' || codeElementId === 'htmlOutput') ? 'none' : 'inline-block';

    // Open the drawer with animation
    document.getElementById('previewDrawer').classList.add('open');
    document.getElementById('previewDrawerOverlay').classList.add('active');
    previewDrawerState.isOpen = true;

    // Set focus to the drawer for accessibility
    document.getElementById('previewDrawer').focus();

    // Add event listener for Escape key
    document.addEventListener('keydown', handleEscapeKey);
}

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

function copyBlogFaqQuestion(index) {
    if (!previewDrawerState.faqArray || !previewDrawerState.faqArray[index]) {
        utils.showNotification("No blog question found to copy!", "warning");
        return;
    }

    const question = previewDrawerState.faqArray[index].question;
    copyToClipboardSimple(question, "Blog Question");
}

function copyBlogFaqAnswer(index) {
    if (!previewDrawerState.faqArray || !previewDrawerState.faqArray[index]) {
        utils.showNotification("No blog answer found to copy!", "warning");
        return;
    }

    const answer = previewDrawerState.faqArray[index].answer;
    copyToClipboardSimple(answer, "Blog Answer");
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
document.getElementById('copyCodeDrawerBtn').addEventListener('click', function () {
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
document.getElementById('previewDrawer').addEventListener('keydown', function (e) {
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

function copyToClipboard(elementId) {
    utils.copyToClipboard(elementId);
}

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

// ========== PERFECT ANIMATED THEME MANAGER ==========
const themeManager = {
    currentTheme: localStorage.getItem('theme') || 'dark',
    isAnimating: false,

    init() {
        // Add smooth transition styles
        this.addTransitionStyles();

        // Apply theme without animation on initial load
        document.body.classList.add(`${this.currentTheme}-theme`);
        this.updateThemeToggleButton();
        this.setupThemeToggle();
        this.setupSystemThemeListener();
    },

    applyTheme(theme, animate = true) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const oldTheme = this.currentTheme;

        if (animate) {
            // Add transition class for smooth animations
            document.body.classList.add('theme-changing');

            // Fade out current theme
            document.body.style.opacity = '0.7';
            document.body.style.transition = 'opacity 200ms ease-in-out';

            setTimeout(() => {
                // Switch themes during the fade
                document.body.classList.remove(`${oldTheme}-theme`);
                document.body.classList.add(`${theme}-theme`);

                // Update state
                localStorage.setItem('theme', theme);
                this.currentTheme = theme;

                // Update UI
                this.updateThemeToggleButton();

                // Fade back in
                setTimeout(() => {
                    document.body.style.opacity = '1';

                    // Clean up after animation
                    setTimeout(() => {
                        document.body.classList.remove('theme-changing');
                        document.body.style.transition = '';
                        this.isAnimating = false;
                    }, 200);
                }, 50);

            }, 200);

        } else {
            // Apply theme instantly (no animation)
            document.body.classList.remove(`${oldTheme}-theme`);
            document.body.classList.add(`${theme}-theme`);

            localStorage.setItem('theme', theme);
            this.currentTheme = theme;
            this.updateThemeToggleButton();
            this.isAnimating = false;
        }
    },

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';

        // Add button animation
        const button = document.getElementById('globalThemeToggle');
        if (button) {
            button.classList.add('theme-toggling');
            setTimeout(() => {
                button.classList.remove('theme-toggling');
            }, 300);
        }

        this.applyTheme(newTheme, true);
    },

    updateThemeToggleButton() {
        const button = document.getElementById('globalThemeToggle');
        const mobileButton = document.getElementById('mobileThemeToggle');
        const sidebar = document.getElementById('appSidebar');
        const isCollapsed = sidebar && sidebar.classList.contains('collapsed');

        if (button) {
            if (this.currentTheme === 'dark') {
                button.innerHTML = isCollapsed
                    ? '<i class="fas fa-sun"></i>'
                    : '<i class="fas fa-sun"></i><span class="nav-text">Switch to Light Mode</span>';
            } else {
                button.innerHTML = isCollapsed
                    ? '<i class="fas fa-moon"></i>'
                    : '<i class="fas fa-moon"></i><span class="nav-text">Switch to Dark Mode</span>';
            }

            const icon = button.querySelector('i');
            if (icon) {
                icon.style.transform = 'rotate(180deg) scale(1.2)';
                setTimeout(() => {
                    icon.style.transform = 'rotate(0) scale(1)';
                }, 300);
            }
        }

        // Update mobile theme toggle
        if (mobileButton) {
            mobileButton.innerHTML = this.currentTheme === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        }
    },

    setupThemeToggle() {
        const button = document.getElementById('globalThemeToggle');
        if (button) {
            // Remove any existing listeners and re-add
            button.replaceWith(button.cloneNode(true));
            const newButton = document.getElementById('globalThemeToggle');

            newButton.addEventListener('click', () => this.toggleTheme());

            // Add keyboard support
            newButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }
    },

    setupSystemThemeListener() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleThemeChange = (e) => {
            if (!localStorage.getItem('theme')) {
                const theme = e.matches ? 'dark' : 'light';
                this.applyTheme(theme, true);
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleThemeChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleThemeChange);
        }

        // Set initial theme based on system preference if no user preference
        if (!localStorage.getItem('theme')) {
            const theme = mediaQuery.matches ? 'dark' : 'light';
            this.applyTheme(theme, false);
        }
    },

    addTransitionStyles() {
        // Add CSS for animations if not already present
        if (!document.getElementById('theme-transition-styles')) {
            const style = document.createElement('style');
            style.id = 'theme-transition-styles';
            style.textContent = `
                /* Theme transition animations */
                body.theme-changing * {
                    transition: background-color 300ms ease-in-out,
                                color 300ms ease-in-out,
                                border-color 300ms ease-in-out,
                                box-shadow 300ms ease-in-out !important;
                }
                
                /* Button animation */
                #globalThemeToggle.theme-toggling {
                    transform: scale(0.95);
                    transition: transform 150ms ease-in-out;
                }
                
                #globalThemeToggle i {
                    transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                /* Smooth opacity transitions for page content */
                body {
                    opacity: 1;
                    transition: opacity 300ms ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", function () {
    themeManager.init();
    createAnimatedFavicon();

    // Add keyboard shortcut for theme toggle (Ctrl/Cmd + T)
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 't' && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            themeManager.toggleTheme();
        }
    });

    // ========== NEW SIDEBAR FUNCTIONALITY ==========
    const sidebar = document.getElementById('appSidebar');
    const collapseBtn = document.getElementById('sidebarCollapseToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');

    // Initialize sidebar state from localStorage (for desktop)
    if (sidebar) {
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (collapsed && window.innerWidth >= 992) {
            sidebar.classList.add('collapsed');
        }
    }

    // Desktop collapse toggle
    if (collapseBtn && sidebar) {
        const updateCollapseBtn = () => {
            const isCollapsed = sidebar.classList.contains('collapsed');
            if (isCollapsed) {
                collapseBtn.innerHTML = '<i class="fas fa-angle-double-right"></i><span class="nav-text">Expand</span>';
            } else {
                collapseBtn.innerHTML = '<i class="fas fa-angle-double-left"></i><span class="nav-text">Collapse Sidebar</span>';
            }
            themeManager.updateThemeToggleButton();
        };

        updateCollapseBtn();

        collapseBtn.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            updateCollapseBtn();
        });
    }

    // Mobile menu toggle
    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        const openMobileSidebar = () => {
            sidebar.classList.add('mobile-open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeMobileSidebar = () => {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        mobileMenuBtn.addEventListener('click', openMobileSidebar);
        sidebarOverlay.addEventListener('click', closeMobileSidebar);

        // Close mobile sidebar when a nav item is clicked
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 992) {
                    closeMobileSidebar();
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) {
                closeMobileSidebar();
            }
        });
    }

    // Mobile theme toggle
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', () => themeManager.toggleTheme());
    }

    // Set up code selector buttons for course tab
    const courseCodeSelector = document.getElementById('courseCodeSelector');
    if (courseCodeSelector) {
        courseCodeSelector.addEventListener('click', function (e) {
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

    // Set up code selector buttons for blog tab
    const blogCodeSelector = document.getElementById('blogCodeSelector');
    if (blogCodeSelector) {
        blogCodeSelector.addEventListener('click', function (e) {
            if (e.target.classList.contains('code-selector-btn')) {
                // Update active button
                document.querySelectorAll('#blogCodeSelector .code-selector-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');

                // Show selected section
                const targetId = e.target.getAttribute('data-target');
                const allSections = document.querySelectorAll('#blogCodeSections .code-section');
                allSections.forEach(section => {
                    section.style.display = 'none';
                });

                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
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

    fileInputs.forEach(({ id, infoId }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("change", function () {
                utils.showFileInfo(this, infoId);
            });
        }
    });
});

// Set OpenAI API key from input
document.getElementById('openaiKey')?.addEventListener('input', function (e) {
    window.OPENAI_API_KEY = e.target.value;
});
