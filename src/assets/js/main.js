// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.nav-overlay');

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function openMenu() {
        menuToggle.classList.add('active');
        navLinks.classList.add('active');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu when clicking overlay
        if (navOverlay) {
            navOverlay.addEventListener('click', closeMenu);
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target) && navLinks.classList.contains('active')) {
                closeMenu();
            }
        });

        // Close menu when clicking a nav link (not dropdown triggers)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Reset overflow if window resizes past mobile breakpoint
        window.addEventListener('resize', () => {
            if (!isMobile() && navLinks.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    // --- DROPDOWN MENU HANDLING ---
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    let clickedDropdown = null; // Track which dropdown was clicked open

    // Close all dropdowns
    function closeAllDropdowns() {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        clickedDropdown = null;
    }

    // Handle dropdown trigger clicks
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.nav-dropdown-trigger');

        if (trigger) {
            // Click handler
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (isMobile()) {
                    // On mobile: accordion toggle, don't close menu
                    dropdown.classList.toggle('active');
                } else {
                    // Desktop: click-lock behavior
                    if (clickedDropdown === dropdown) {
                        closeAllDropdowns();
                    } else {
                        closeAllDropdowns();
                        dropdown.classList.add('active');
                        clickedDropdown = dropdown;
                    }
                }
            });
        }

        // Hover handlers - desktop only, no dropdown click-locked
        dropdown.addEventListener('mouseenter', () => {
            if (!isMobile() && !clickedDropdown) {
                dropdown.classList.add('active');
            }
        });

        dropdown.addEventListener('mouseleave', () => {
            if (!isMobile() && !clickedDropdown) {
                dropdown.classList.remove('active');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (clickedDropdown && !e.target.closest('.nav-dropdown')) {
            closeAllDropdowns();
        }
    });

    // Close dropdowns when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (clickedDropdown) closeAllDropdowns();
            if (navLinks && navLinks.classList.contains('active')) closeMenu();
        }
    });

    // --- VISUAL UPGRADE: SCROLL REVEAL ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Auto-assign reveal classes to key elements
    const elementsToAnimate = document.querySelectorAll(
        '.hero-badge, .hero h1, .hero-subtitle, .hero p, .hero-buttons, ' + 
        '.section-title, .section-subtitle, .event-tracker, ' + 
        '.feature-card, .video-card, .stat-item, .quick-link, ' +
        '.channel-banner, .about-text'
    );

    elementsToAnimate.forEach((el, index) => {
        el.classList.add('reveal');
        // Add stagger effect to cards in grids
        if (el.classList.contains('feature-card') || el.classList.contains('video-card') || el.classList.contains('quick-link')) {
            const stagger = (index % 4) + 1;
            el.classList.add(`reveal-stagger-${stagger}`);
        }
        observer.observe(el);
    });
});
