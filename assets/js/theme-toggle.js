// Theme Toggle Functionality
(function() {
    'use strict';

    // Check for saved theme preference or default to 'light' mode
    const getTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    };

    // Apply theme to document
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle button state
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.theme-icon');
            const text = toggleBtn.querySelector('.theme-text');
            
            if (theme === 'dark') {
                icon.textContent = '☀️';
                text.textContent = 'Light';
                toggleBtn.setAttribute('aria-label', 'Switch to light mode');
            } else {
                icon.textContent = '🌙';
                text.textContent = 'Dark';
                toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
            }
        }
    };

    // Toggle theme
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    // Initialize theme on page load
    const initTheme = () => {
        const theme = getTheme();
        applyTheme(theme);
    };

    // Create and insert theme toggle button
    const createThemeToggle = () => {
        const topNav = document.querySelector('.top-nav ul');
        if (!topNav) {
            console.error('Top nav not found');
            return;
        }

        // Create list item for the button
        const li = document.createElement('li');
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle';
        toggleBtn.className = 'theme-toggle';
        toggleBtn.setAttribute('aria-label', 'Toggle theme');
        toggleBtn.innerHTML = `
            <span class="theme-icon" aria-hidden="true">🌙</span>
            <span class="theme-text">Dark</span>
        `;

        // Add button to list item
        li.appendChild(toggleBtn);
        
        // Insert at the beginning of the nav list
        topNav.insertBefore(li, topNav.firstChild);

        // Add event listener
        toggleBtn.addEventListener('click', toggleTheme);
        
        console.log('Theme toggle button created');
    };

    // Listen for system theme changes
    const watchSystemTheme = () => {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only apply system preference if user hasn't set a preference
                if (!localStorage.getItem('theme')) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTheme();
            createThemeToggle();
            watchSystemTheme();
        });
    } else {
        initTheme();
        createThemeToggle();
        watchSystemTheme();
    }
})();