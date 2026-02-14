// Accordion for WoW guide collapsible sections + Floating TOC
document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.panel-header.collapsible');
    const expandFirst = 3; // first N sections start expanded

    headers.forEach((header, i) => {
        const content = header.nextElementSibling;
        if (!content || !content.classList.contains('panel-content')) return;

        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.3s ease';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');

        // Add collapse indicator
        if (!header.querySelector('.collapse-arrow')) {
            const arrow = document.createElement('span');
            arrow.className = 'collapse-arrow';
            arrow.textContent = '\u25BE';
            header.appendChild(arrow);
        }

        if (i < expandFirst) {
            content.style.maxHeight = 'none';
            header.classList.add('expanded');
            header.setAttribute('aria-expanded', 'true');
        } else {
            content.style.maxHeight = '0';
            header.setAttribute('aria-expanded', 'false');
        }

        header.addEventListener('click', () => toggle(header, content));
        header.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle(header, content);
            }
        });
    });

    function toggle(header, content) {
        const isOpen = header.classList.contains('expanded');
        if (isOpen) {
            content.style.maxHeight = content.scrollHeight + 'px';
            requestAnimationFrame(() => { content.style.maxHeight = '0'; });
            header.classList.remove('expanded');
            header.setAttribute('aria-expanded', 'false');
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            header.classList.add('expanded');
            header.setAttribute('aria-expanded', 'true');
            setTimeout(() => { content.style.maxHeight = 'none'; }, 300);
        }
    }

    // === FLOATING TOC FOR GUIDE PAGES ===
    const guideContainer = document.querySelector('.guide-container');
    if (!guideContainer || headers.length < 2) return;

    // Build TOC
    const toc = document.createElement('nav');
    toc.className = 'guide-floating-toc';
    toc.setAttribute('aria-label', 'Guide sections');

    const tocTitle = document.createElement('div');
    tocTitle.className = 'guide-toc-title';
    tocTitle.textContent = 'Sections';
    toc.appendChild(tocTitle);

    const tocList = document.createElement('ul');
    tocList.className = 'guide-toc-list';

    // Add "Talent Build" as first item (the non-collapsible top section)
    const talentLi = document.createElement('li');
    const talentLink = document.createElement('a');
    talentLink.href = '#';
    talentLink.textContent = 'Talent Build';
    talentLink.className = 'guide-toc-item active';
    talentLink.addEventListener('click', e => {
        e.preventDefault();
        guideContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    talentLi.appendChild(talentLink);
    tocList.appendChild(talentLi);

    // Add each collapsible section
    const sectionEls = [];
    headers.forEach(header => {
        const text = header.textContent.replace(/[▾▸+\-−]/g, '').trim();
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = text;
        a.className = 'guide-toc-item';
        a.href = '#';
        a.addEventListener('click', e => {
            e.preventDefault();
            // Open section if collapsed
            if (!header.classList.contains('expanded')) {
                header.click();
            }
            const offset = 80;
            const top = header.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
        li.appendChild(a);
        tocList.appendChild(li);
        sectionEls.push({ header, link: a });
    });

    toc.appendChild(tocList);
    document.body.appendChild(toc);

    // Active section tracking
    const allLinks = toc.querySelectorAll('.guide-toc-item');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = sectionEls.findIndex(s => s.header === entry.target || s.header.closest('.wow-panel') === entry.target);
                if (idx >= 0) {
                    allLinks.forEach(l => l.classList.remove('active'));
                    sectionEls[idx].link.classList.add('active');
                }
            }
        });
    }, { rootMargin: '-80px 0px -60% 0px' });

    headers.forEach(h => {
        const panel = h.closest('.wow-panel');
        if (panel) observer.observe(panel);
    });

    // Mobile: toggle TOC
    tocTitle.addEventListener('click', () => {
        toc.classList.toggle('open');
    });

    // Hide TOC when scrolled to top (hero area)
    const heroEl = document.querySelector('.guide-hero');
    if (heroEl) {
        const heroObserver = new IntersectionObserver(entries => {
            toc.classList.toggle('hidden', entries[0].isIntersecting);
        }, { threshold: 0.3 });
        heroObserver.observe(heroEl);
    }
});
