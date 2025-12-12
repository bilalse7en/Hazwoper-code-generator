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
        'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif',
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
const copyCodeDrawerBtn = document.getElementById('copyCodeDrawerBtn');
if (copyCodeDrawerBtn) {
    copyCodeDrawerBtn.addEventListener('click', function () {
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
}

// Focus trap for accessibility
const previewDrawer = document.getElementById('previewDrawer');
if (previewDrawer) {
    previewDrawer.addEventListener('keydown', function (e) {
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
}

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
    themes: ['dark', 'light', 'neon-gaming', 'bw', 'hacker'],
    currentTheme: localStorage.getItem('theme') || 'dark',
    isAnimating: false,

    init() {
        // Apply theme without animation on initial load
        document.body.classList.add(`${this.currentTheme}-theme`);
        this.updateThemeToggleButton();
        this.setupThemeToggle();
        this.setupSystemThemeListener();
    },

    setTheme(theme, animate = true) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const sidebar = document.getElementById('appSidebar');
        const mainContent = document.querySelector('.app-main');

        // New "Professional" Flow: Exit -> Switch -> Enter
        if (animate) {
            // Step 1: Animate Out
            if (sidebar) sidebar.classList.add('animate-exit-sidebar');
            if (mainContent) mainContent.classList.add('animate-exit-main');

            // Wait for Exit to complete (matches CSS 0.4s)
            setTimeout(() => {
                const oldTheme = this.currentTheme;

                // Step 2: Switch Theme Logic (while hidden)
                document.body.classList.remove(`${oldTheme}-theme`);
                document.body.classList.add(`${theme}-theme`);

                localStorage.setItem('theme', theme);
                this.currentTheme = theme;
                this.updateThemeToggleButton();

                // Step 3: Prepare for Entrance
                // Clean up exit classes
                if (sidebar) sidebar.classList.remove('animate-exit-sidebar');
                if (mainContent) mainContent.classList.remove('animate-exit-main');

                // Trigger Entrance
                if (sidebar) sidebar.classList.add('animate-enter-sidebar');
                if (mainContent) mainContent.classList.add('animate-enter-main');

                // Step 4: Cleanup
                setTimeout(() => {
                    // Remove entrance classes to restore normal interaction
                    if (sidebar) sidebar.classList.remove('animate-enter-sidebar');
                    if (mainContent) mainContent.classList.remove('animate-enter-main');

                    this.isAnimating = false;
                }, 600); // 600ms matches Entrance duration

            }, 400); // 400ms matches Exit duration

        } else {
            // Instant switch (initial load or no animation)
            const oldTheme = this.currentTheme;
            document.body.classList.remove(`${oldTheme}-theme`);
            document.body.classList.add(`${theme}-theme`);

            localStorage.setItem('theme', theme);
            this.currentTheme = theme;
            this.updateThemeToggleButton();
            this.isAnimating = false;
        }
    },

    nextTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex], true);
    },

    updateThemeToggleButton() {
        const button = document.getElementById('themeToggleBtn');
        const mobileButton = document.getElementById('mobileThemeToggle');
        const sidebar = document.getElementById('appSidebar');
        const isCollapsed = sidebar && sidebar.classList.contains('collapsed');

        const themeIcons = {
            'dark': 'fa-moon',
            'light': 'fa-sun',
            'neon-gaming': 'fa-gamepad',
            'bw': 'fa-chess-board',
            'hacker': 'fa-terminal'
        };

        const themeNames = {
            'dark': 'Dark',
            'light': 'Light',
            'neon-gaming': 'Neon Gaming',
            'bw': 'Black & White',
            'hacker': 'Hacker'
        };

        if (button) {
            const nextIndex = (this.themes.indexOf(this.currentTheme) + 1) % this.themes.length;
            const nextTheme = this.themes[nextIndex];

            // Update button content
            button.innerHTML = isCollapsed
                ? `<i class="fas ${themeIcons[this.currentTheme]}"></i>`
                : `<i class="fas ${themeIcons[this.currentTheme]} me-2"></i><span class="nav-text">${themeNames[this.currentTheme]}</span>`;

            // Add tooltip for collapsed sidebar
            button.title = isCollapsed ? themeNames[this.currentTheme] : '';
        }

        // Update mobile theme toggle
        if (mobileButton) {
            mobileButton.innerHTML = `<i class="fas ${themeIcons[this.currentTheme]}"></i>`;
            mobileButton.title = themeNames[this.currentTheme];
        }
    },

    setupThemeToggle() {
        // Main theme toggle button
        const button = document.getElementById('themeToggleBtn');
        if (button) {
            // Remove any existing listeners and re-add
            button.replaceWith(button.cloneNode(true));
            const newButton = document.getElementById('themeToggleBtn');

            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextTheme();
            });

            // Add keyboard support
            newButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextTheme();
                }
            });
        }

        // Mobile theme toggle
        const mobileButton = document.getElementById('mobileThemeToggle');
        if (mobileButton) {
            mobileButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextTheme();
            });
        }
    },

    setupSystemThemeListener() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleThemeChange = (e) => {
            if (!localStorage.getItem('theme')) {
                const theme = e.matches ? 'dark' : 'light';
                this.setTheme(theme, false);
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
            this.setTheme(theme, false);
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

    // ========== PROFESSIONAL TOOLTIP SYSTEM FOR COLLAPSED SIDEBAR ==========
    function initSidebarTooltips() {
        const sidebar = document.getElementById('appSidebar');
        if (!sidebar) return;

        // Create tooltip element
        let tooltip = document.getElementById('sidebarTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'sidebarTooltip';
            tooltip.className = 'sidebar-tooltip';
            document.body.appendChild(tooltip);
        }

        // Get all items that need tooltips
        const tooltipItems = sidebar.querySelectorAll('.sidebar-nav .nav-link, .btn-theme-toggle, .sidebar-collapse-btn');

        tooltipItems.forEach(item => {
            item.addEventListener('mouseenter', function (e) {
                if (!sidebar.classList.contains('collapsed')) return;
                if (window.innerWidth < 992) return; // Don't show on mobile

                // Get tooltip text
                let tooltipText = '';
                if (item.classList.contains('nav-link')) {
                    tooltipText = item.getAttribute('aria-label') || item.querySelector('.nav-text')?.textContent || '';
                } else if (item.classList.contains('btn-theme-toggle')) {
                    tooltipText = themeManager.currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
                } else if (item.classList.contains('sidebar-collapse-btn')) {
                    tooltipText = 'Expand Sidebar';
                }

                if (!tooltipText) return;

                // Position and show tooltip
                const rect = item.getBoundingClientRect();
                tooltip.textContent = tooltipText;
                tooltip.style.top = `${rect.top + (rect.height / 2)}px`;
                tooltip.style.left = `${rect.right + 12}px`;
                tooltip.classList.add('visible');
            });

            item.addEventListener('mouseleave', function () {
                tooltip.classList.remove('visible');
            });
        });
    }

    // Initialize tooltips
    initSidebarTooltips();

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