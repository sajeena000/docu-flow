(function(window, document) {
    'use strict';

    function ScrollSpy(options) {
        this.config = {
            navSelector: '.nav-link',
            sectionSelector: 'article section[id]',
            activeClass: 'active',
            offset: 100,
            smoothScroll: true,
            scrollDuration: 800,
            updateURL: true,
            threshold: 0,
            rootMargin: null,
            performanceMode: true,
            onActivate: null,
            debug: false
        };

        if (options) {
            Object.keys(options).forEach(key => {
                if (options[key] !== undefined) {
                    this.config[key] = options[key];
                }
            });
        }

        this.navLinks = document.querySelectorAll(this.config.navSelector);
        this.sections = document.querySelectorAll(this.config.sectionSelector);
        this.currentActive = null;
        this.observer = null;
        this.isScrolling = false;
        this.scrollTimer = null;

        const header = document.querySelector('.site-header');
        if (header) {
            this.headerHeight = header.offsetHeight;
        } else {
            this.headerHeight = 64;
        }

        if (!this.config.rootMargin) {
            this.config.rootMargin = `-${this.headerHeight + this.config.offset}px 0px -66% 0px`;
        }

        this.init();
    }

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

        this.setupNavigation();

        if ('IntersectionObserver' in window && this.config.performanceMode) {
            this.setupIntersectionObserver();
        } else {
            this.setupScrollListener();
        }

        this.handleInitialLoad();
        this.setupHistoryListener();
    };

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

        this.sections.forEach(function(section) {
            self.observer.observe(section);
        });

        this.log('Intersection Observer initialized');
    };

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

    ScrollSpy.prototype.scrollToSection = function(section, link) {
        const self = this;
        const targetPosition = section.getBoundingClientRect().top + 
                              window.pageYOffset - 
                              this.headerHeight - 
                              20;

        this.isScrolling = true;

        if (this.config.smoothScroll) {
            this.smoothScrollTo(targetPosition, this.config.scrollDuration, function() {
                self.isScrolling = false;
            });
        } else {
            window.scrollTo(0, targetPosition);
            this.isScrolling = false;
        }

        this.updateActiveLink(link);

        if (this.config.updateURL && history.pushState) {
            const sectionId = section.getAttribute('id');
            history.pushState(null, null, '#' + sectionId);
        }

        this.closeMobileMenu();

        this.log('Scrolled to section:', section.getAttribute('id'));
    };

    ScrollSpy.prototype.smoothScrollTo = function(targetPosition, duration, callback) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
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

    ScrollSpy.prototype.setActiveLink = function(sectionId) {
        if (this.isScrolling) {
            return;
        }

        const correspondingLink = document.querySelector(
            `${this.config.navSelector}[href="#${sectionId}"]`
        );

        if (correspondingLink && this.currentActive !== correspondingLink) {
            this.updateActiveLink(correspondingLink);
            
            if (this.config.updateURL && !this.isScrolling) {
                if (history.replaceState) {
                    history.replaceState(null, null, '#' + sectionId);
                }
            }

            this.log('Active section changed to:', sectionId);
        }
    };

    ScrollSpy.prototype.updateActiveLink = function(activeLink) {
        this.navLinks.forEach(link => {
            link.classList.remove(this.config.activeClass);
        });

        if (activeLink) {
            activeLink.classList.add(this.config.activeClass);
            this.currentActive = activeLink;

            if (this.config.onActivate && typeof this.config.onActivate === 'function') {
                const sectionId = activeLink.getAttribute('href').substring(1);
                this.config.onActivate(sectionId, activeLink);
            }
        }
    };

    ScrollSpy.prototype.handleInitialLoad = function() {
        const hash = window.location.hash;

        if (hash) {
            const targetLink = document.querySelector(
                `${this.config.navSelector}[href="${hash}"]`
            );
            const targetSection = document.querySelector(hash);

            if (targetLink && targetSection) {
                setTimeout(() => {
                    this.scrollToSection(targetSection, targetLink);
                }, 100);
            }
        } else {
            if (this.navLinks.length > 0) {
                this.navLinks[0].classList.add(this.config.activeClass);
                this.currentActive = this.navLinks[0];
            }
        }
    };

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

    ScrollSpy.prototype.getCurrentSection = function() {
        if (this.currentActive) {
            return this.currentActive.getAttribute('href').substring(1);
        }
        return null;
    };

    ScrollSpy.prototype.activateSection = function(sectionId) {
        const link = document.querySelector(
            `${this.config.navSelector}[href="#${sectionId}"]`
        );

        if (link) {
            this.updateActiveLink(link);
        }
    };

    ScrollSpy.prototype.refresh = function() {
        this.sections = document.querySelectorAll(this.config.sectionSelector);
        this.navLinks = document.querySelectorAll(this.config.navSelector);

        const header = document.querySelector('.site-header');
        if (header) {
            this.headerHeight = header.offsetHeight;
        }

        this.log('ScrollSpy refreshed', {
            links: this.navLinks.length,
            sections: this.sections.length
        });
    };

    ScrollSpy.prototype.destroy = function() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.log('ScrollSpy destroyed');
    };

    ScrollSpy.prototype.log = function(message, data) {
        if (this.config.debug) {
            console.log('[ScrollSpy]', message, data || '');
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollSpy);
    } else {
        initScrollSpy();
    }

    function initScrollSpy() {
        const scrollSpy = new ScrollSpy({
            navSelector: '.nav-link',
            sectionSelector: 'article section[id]',
            activeClass: 'active',
            offset: 50,
            smoothScroll: true,
            scrollDuration: 600,
            updateURL: true,
            performanceMode: true,
            debug: false,
            onActivate: function(sectionId, link) {}
        });

        window.scrollSpy = scrollSpy;

        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                scrollSpy.refresh();
            }, 250);
        });

        console.log('ScrollSpy initialized successfully');
    }

})(window, document);