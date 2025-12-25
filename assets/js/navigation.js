(function() {
    'use strict';

    // ===== Mobile Menu Toggle =====
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;

    if (menuToggle && sidebar) {
        // Toggle sidebar on button click
        menuToggle.addEventListener('click', function() {
            const isOpen = sidebar.classList.contains('open');
            
            if (isOpen) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        // Create and handle overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.querySelector('.layout-grid').appendChild(overlay);

        overlay.addEventListener('click', closeSidebar);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebar();
                menuToggle.focus(); 
            }
        });

        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768 && sidebar.classList.contains('open')) {
                    closeSidebar();
                }
            }, 250);
        });

        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            menuToggle.setAttribute('aria-expanded', 'true');
            body.style.overflow = 'hidden'; 
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            body.style.overflow = ''; 
        }
    }

    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
    
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                updateActiveLink(this);
                
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                    closeSidebar();
                }
                
                if (history.pushState) {
                    history.pushState(null, null, '#' + targetId);
                }
            }
        });
    });

   
    const sections = document.querySelectorAll('article section[id]');
    const headerHeight = document.querySelector('.site-header').offsetHeight;

    const observerOptions = {
        root: null,
        rootMargin: `-${headerHeight + 50}px 0px -66% 0px`,
        threshold: 0
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                
                if (correspondingLink) {
                    updateActiveLink(correspondingLink);
                }
            }
        });
    }, observerOptions);

    sections.forEach(function(section) {
        observer.observe(section);
    });

    function updateActiveLink(activeLink) {
        navLinks.forEach(function(link) {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    function setInitialActiveLink() {
        const hash = window.location.hash;
        
        if (hash) {
            const targetLink = document.querySelector(`.nav-link[href="${hash}"]`);
            if (targetLink) {
                updateActiveLink(targetLink);
                
                setTimeout(function() {
                    const targetSection = document.querySelector(hash);
                    if (targetSection) {
                        const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            }
        } else {
            if (navLinks.length > 0) {
                navLinks[0].classList.add('active');
            }
        }
    }

    // Call on page load
    setInitialActiveLink();

    if (!('IntersectionObserver' in window)) {
        let ticking = false;
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateActiveOnScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        function updateActiveOnScroll() {
            const scrollPos = window.pageYOffset + headerHeight + 100;
            
            sections.forEach(function(section) {
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                    const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                    if (correspondingLink && !correspondingLink.classList.contains('active')) {
                        updateActiveLink(correspondingLink);
                    }
                }
            });
        }
    }

    const paginationLinks = document.querySelectorAll('.content-pagination a');
    
    paginationLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            }
        });
    });

    window.addEventListener('popstate', function() {
        const hash = window.location.hash;
        
        if (hash) {
            const targetSection = document.querySelector(hash);
            const targetLink = document.querySelector(`.nav-link[href="${hash}"]`);
            
            if (targetSection) {
                const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
            
            if (targetLink) {
                updateActiveLink(targetLink);
            }
        }
    });

    function addCopyButtons() {
        const codeBlocks = document.querySelectorAll('.code-block pre');
        
        codeBlocks.forEach(function(pre) {
            const copyButton = document.createElement('button');
            copyButton.className = 'code-copy-button';
            copyButton.textContent = 'Copy';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            
            let wrapper = pre.closest('.code-block-wrapper');
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
            }
            
            wrapper.style.position = 'relative';
            wrapper.appendChild(copyButton);
            
            // Copy functionality
            copyButton.addEventListener('click', function() {
                const code = pre.querySelector('code');
                const text = code ? code.textContent : pre.textContent;
                
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(function() {
                        copyButton.textContent = 'Copied!';
                        copyButton.classList.add('copied');
                        
                        setTimeout(function() {
                            copyButton.textContent = 'Copy';
                            copyButton.classList.remove('copied');
                        }, 2000);
                    }).catch(function(err) {
                        console.error('Failed to copy: ', err);
                        copyButton.textContent = 'Error';
                    });
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    
                    try {
                        document.execCommand('copy');
                        copyButton.textContent = 'Copied!';
                        
                        setTimeout(function() {
                            copyButton.textContent = 'Copy';
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy: ', err);
                    }
                    
                    document.body.removeChild(textarea);
                }
            });
        });
    }


    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    
    externalLinks.forEach(function(link) {
        // Ensure security attributes
        if (!link.hasAttribute('rel')) {
            link.setAttribute('rel', 'noopener noreferrer');
        } else {
            const rel = link.getAttribute('rel');
            if (!rel.includes('noopener')) {
                link.setAttribute('rel', rel + ' noopener');
            }
            if (!rel.includes('noreferrer')) {
                link.setAttribute('rel', rel + ' noreferrer');
            }
        }
    });

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = function() {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    console.log('GitFlow Documentation initialized');
    console.log('Mobile menu:', menuToggle ? 'Ready' : 'Not found');
    console.log('Navigation links:', navLinks.length);
    console.log('Sections tracked:', sections.length);

})();