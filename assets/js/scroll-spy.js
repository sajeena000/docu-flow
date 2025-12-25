/**
 * GitFlow Documentation - Scroll Spy Module
 * Advanced scroll tracking and active section highlighting
 * Standalone module for scroll-based navigation updates
 */

(function(window, document) {
    'use strict';

    /**
     * ScrollSpy Constructor
     * @param {Object} options - Configuration options
     */
    function ScrollSpy(options) {
        // Default configuration
        this.config = {
            // Selector for navigation links
            navSelector: '.nav-link',
            // Selector for content sections
            sectionSelector: 'article section[id]',
            // Active class name
            activeClass: 'active',
            // Offset from top (for sticky headers)
            offset: 100,
            // Smooth scroll behavior
            smoothScroll: true,
            // Scroll duration (ms)
            scrollDuration: 800,
            // Update URL hash
            updateURL: true,
            // Threshold for intersection (0-1)
            threshold: 0,
            // Root margin for intersection observer
            rootMargin: null,
            // Enable performance mode
            performanceMode: true,
            // Callback when active section changes
            onActivate: null,
            // Enable debug mode
            debug: false
        };

        // Merge user options with defaults
        if (options) {
            Object.keys(options).forEach(key => {
                if (options[key] !== undefined) {
                    this.config[key] = options[key];
                }
            });
        }

        // Initialize properties
        this.navLinks = document.querySelectorAll(this.config.navSelector);
        this.sections = document.querySelectorAll(this.config.sectionSelector);
        this.currentActive = null;
        this.observer = null;
        this.isScrolling = false;
        this.scrollTimer = null;

        // Calculate header offset dynamically
        const header = document.querySelector('.site-header');
        if (header) {
            this.headerHeight = header.offsetHeight;
        } else {
            this.headerHeight = 64; // Default fallback
        }

        // Auto-calculate root margin if not provided
        if (!this.config.rootMargin) {
            this.config.rootMargin = `-${this.headerHeight + this.config.offset}px 0px -66% 0px`;
        }

        this.init();
    }

    /**
     * Initialize ScrollSpy
     */
    ScrollSpy.prototype.init = function() {
        if (this.navLinks.length === 0 || this.sections.length === 0) {
            this.log('No navigation links or sections found');
            return;
        }

        this.log('Initializing ScrollSpy', {
            links: this.navLinks.length,
            sections: this.sections.length,
            headerHeight: this.headerHeight
        });

        // Set up navigation click handlers
        this.setupNavigation();

        // Set up intersection observer or fallback
        if ('IntersectionObserver' in window && this.config.performanceMode) {
            this.setupIntersectionObserver();
        } else {
            this.setupScrollListener();
        }

        // Handle initial page load
        this.handleInitialLoad();

        // Handle browser back/forward
        this.setupHistoryListener();
    };

    /**
     * Set up navigation link click handlers
     */
    ScrollSpy.prototype.setupNavigation = function() {
        const self = this;

        this.navLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    self.scrollToSection(targetSection, this);
                }
            });
        });
    };

    /**
     * Set up Intersection Observer (modern approach)
     */
    ScrollSpy.prototype.setupIntersectionObserver = function() {
        const self = this;

        const observerOptions = {
            root: null,
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        };

        this.observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');
                    self.setActiveLink(sectionId);
                }
            });
        }, observerOptions);

        // Observe all sections
        this.sections.forEach(function(section) {
            self.observer.observe(section);
        });

        this.log('Intersection Observer initialized');
    };

    /**
     * Set up scroll listener (fallback for older browsers)
     */
    ScrollSpy.prototype.setupScrollListener = function() {
        const self = this;
        let ticking = false;

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    self.updateActiveOnScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        this.log('Scroll listener initialized (fallback mode)');
    };

    /**
     * Update active section based on scroll position (fallback)
     */
    ScrollSpy.prototype.updateActiveOnScroll = function() {
        const scrollPos = window.pageYOffset + this.headerHeight + this.config.offset;

        let currentSection = null;

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                currentSection = section.getAttribute('id');
            }
        });

        if (currentSection) {
            this.setActiveLink(currentSection);
        }
    };

    /**
     * Scroll to a specific section
     * @param {Element} section - Target section element
     * @param {Element} link - Clicked navigation link
     */
    ScrollSpy.prototype.scrollToSection = function(section, link) {
        const self = this;
        const targetPosition = section.getBoundingClientRect().top + 
                              window.pageYOffset - 
                              this.headerHeight - 
                              20; // Extra padding

        // Mark as programmatic scrolling
        this.isScrolling = true;

        // Smooth scroll
        if (this.config.smoothScroll) {
            this.smoothScrollTo(targetPosition, this.config.scrollDuration, function() {
                self.isScrolling = false;
            });
        } else {
            window.scrollTo(0, targetPosition);
            this.isScrolling = false;
        }

        // Update active link
        this.updateActiveLink(link);

        // Update URL
        if (this.config.updateURL && history.pushState) {
            const sectionId = section.getAttribute('id');
            history.pushState(null, null, '#' + sectionId);
        }

        // Close mobile menu if open
        this.closeMobileMenu();

        this.log('Scrolled to section:', section.getAttribute('id'));
    };

    /**
     * Smooth scroll animation
     * @param {Number} targetPosition - Target Y position
     * @param {Number} duration - Animation duration
     * @param {Function} callback - Completion callback
     */
    ScrollSpy.prototype.smoothScrollTo = function(targetPosition, duration, callback) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (easeInOutCubic)
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, startPosition + (distance * ease));

            if (progress < 1) {
                requestAnimationFrame(animation);
            } else if (callback) {
                callback();
            }
        }

        requestAnimationFrame(animation);
    };

    /**
     * Set active link based on section ID
     * @param {String} sectionId - ID of the active section
     */
    ScrollSpy.prototype.setActiveLink = function(sectionId) {
        // Don't update during programmatic scrolling
        if (this.isScrolling) {
            return;
        }

        // Find corresponding link
        const correspondingLink = document.querySelector(
            `${this.config.navSelector}[href="#${sectionId}"]`
        );

        if (correspondingLink && this.currentActive !== correspondingLink) {
            this.updateActiveLink(correspondingLink);
            
            // Update URL without scrolling
            if (this.config.updateURL && !this.isScrolling) {
                if (history.replaceState) {
                    history.replaceState(null, null, '#' + sectionId);
                }
            }

            this.log('Active section changed to:', sectionId);
        }
    };

    /**
     * Update active link styling
     * @param {Element} activeLink - Link to make active
     */
    ScrollSpy.prototype.updateActiveLink = function(activeLink) {
        // Remove active class from all links
        this.navLinks.forEach(link => {
            link.classList.remove(this.config.activeClass);
        });

        // Add active class to new link
        if (activeLink) {
            activeLink.classList.add(this.config.activeClass);
            this.currentActive = activeLink;

            // Callback
            if (this.config.onActivate && typeof this.config.onActivate === 'function') {
                const sectionId = activeLink.getAttribute('href').substring(1);
                this.config.onActivate(sectionId, activeLink);
            }
        }
    };

    /**
     * Handle initial page load with hash
     */
    ScrollSpy.prototype.handleInitialLoad = function() {
        const hash = window.location.hash;

        if (hash) {
            const targetLink = document.querySelector(
                `${this.config.navSelector}[href="${hash}"]`
            );
            const targetSection = document.querySelector(hash);

            if (targetLink && targetSection) {
                // Small delay to ensure page is ready
                setTimeout(() => {
                    this.scrollToSection(targetSection, targetLink);
                }, 100);
            }
        } else {
            // Set first link as active by default
            if (this.navLinks.length > 0) {
                this.navLinks[0].classList.add(this.config.activeClass);
                this.currentActive = this.navLinks[0];
            }
        }
    };

    /**
     * Handle browser back/forward buttons
     */
    ScrollSpy.prototype.setupHistoryListener = function() {
        const self = this;

        window.addEventListener('popstate', function() {
            const hash = window.location.hash;

            if (hash) {
                const targetSection = document.querySelector(hash);
                const targetLink = document.querySelector(
                    `${self.config.navSelector}[href="${hash}"]`
                );

                if (targetSection && targetLink) {
                    self.scrollToSection(targetSection, targetLink);
                }
            }
        });
    };

    /**
     * Close mobile menu helper
     */
    ScrollSpy.prototype.closeMobileMenu = function() {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menu-toggle');
            const overlay = document.querySelector('.sidebar-overlay');

            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        }
    };

    /**
     * Get current active section
     * @returns {String|null} - ID of current active section
     */
    ScrollSpy.prototype.getCurrentSection = function() {
        if (this.currentActive) {
            return this.currentActive.getAttribute('href').substring(1);
        }
        return null;
    };

    /**
     * Manually set active section
     * @param {String} sectionId - ID of section to activate
     */
    ScrollSpy.prototype.activateSection = function(sectionId) {
        const link = document.querySelector(
            `${this.config.navSelector}[href="#${sectionId}"]`
        );

        if (link) {
            this.updateActiveLink(link);
        }
    };

    /**
     * Refresh/recalculate section positions
     */
    ScrollSpy.prototype.refresh = function() {
        this.sections = document.querySelectorAll(this.config.sectionSelector);
        this.navLinks = document.querySelectorAll(this.config.navSelector);

        // Recalculate header height
        const header = document.querySelector('.site-header');
        if (header) {
            this.headerHeight = header.offsetHeight;
        }

        this.log('ScrollSpy refreshed', {
            links: this.navLinks.length,
            sections: this.sections.length
        });
    };

    /**
     * Destroy ScrollSpy instance
     */
    ScrollSpy.prototype.destroy = function() {
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Remove event listeners would go here if we stored references
        this.log('ScrollSpy destroyed');
    };

    /**
     * Debug logging
     */
    ScrollSpy.prototype.log = function(message, data) {
        if (this.config.debug) {
            console.log('[ScrollSpy]', message, data || '');
        }
    };

    // ===== Initialize ScrollSpy =====
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollSpy);
    } else {
        initScrollSpy();
    }

    function initScrollSpy() {
        // Create ScrollSpy instance with custom configuration
        const scrollSpy = new ScrollSpy({
            navSelector: '.nav-link',
            sectionSelector: 'article section[id]',
            activeClass: 'active',
            offset: 50,
            smoothScroll: true,
            scrollDuration: 600,
            updateURL: true,
            performanceMode: true,
            debug: false, // Set to true for debugging
            onActivate: function(sectionId, link) {
                // Optional: Custom callback when section becomes active
                // console.log('Section activated:', sectionId);
            }
        });

        // Expose to global scope if needed (for testing/debugging)
        window.scrollSpy = scrollSpy;

        // Optional: Refresh on window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                scrollSpy.refresh();
            }, 250);
        });

        console.log('📊 ScrollSpy initialized successfully');
    }

})(window, document);