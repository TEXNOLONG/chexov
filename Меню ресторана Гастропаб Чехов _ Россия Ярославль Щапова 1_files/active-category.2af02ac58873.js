(() => {
    'use strict';

    let observer = null;
    let scrollWrap = null;
    let cleanupFunctions = [];

    const HEADER_OFFSET = 80;
    const SCROLL_DELAY = 350;
    const INIT_DELAY = 300;

    const cleanup = () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        cleanupFunctions.forEach(fn => fn());
        cleanupFunctions = [];
    };

    const init = () => {
        cleanup();

        scrollWrap = document.querySelector('.category-scroll-container');
        const items = document.querySelectorAll('.category-item');
        const sections = document.querySelectorAll('.category-section');

        if (!scrollWrap || !items.length || !sections.length) return;

        const HEADER_H = scrollWrap.offsetHeight;
        let isProgrammaticScroll = false;
        let pendingScrollTimeout = null;
        let isInitialized = false;

        const resetProgrammaticScroll = () => {
            if (pendingScrollTimeout) clearTimeout(pendingScrollTimeout);
            pendingScrollTimeout = setTimeout(() => {
                isProgrammaticScroll = false;
            }, SCROLL_DELAY);
        };

        const setActive = (id) => {
            items.forEach(item => {
                item.classList.toggle('active', item.hash.slice(1) === id);
            });

            const activeItem = document.querySelector(`.category-item[href="#${id}"]`);
            if (!activeItem) return;

            requestAnimationFrame(() => {
                const maxScroll = scrollWrap.scrollWidth - scrollWrap.clientWidth;
                if (maxScroll <= 0) return;

                const wrapRect = scrollWrap.getBoundingClientRect();
                const itemRect = activeItem.getBoundingClientRect();
                const desired =
                    scrollWrap.scrollLeft +
                    (itemRect.left - wrapRect.left) -
                    (wrapRect.width / 2 - itemRect.width / 2);
                const targetLeft = Math.max(0, Math.min(maxScroll, Math.round(desired)));

                scrollWrap.scrollTo({left: targetLeft, behavior: 'smooth'});
            });
        };

        const smoothScrollToSection = (id) => {
            const section = document.getElementById(id);
            if (!section) return;

            const targetTop =
                section.getBoundingClientRect().top +
                window.scrollY -
                HEADER_H -
                HEADER_OFFSET;

            isProgrammaticScroll = true;
            window.scrollTo({top: targetTop, behavior: 'smooth'});
            resetProgrammaticScroll();
        };

        const handleCategoryClick = (e) => {
            const item = e.target.closest('.category-item');
            if (!item) return;

            const id = item.hash.slice(1);
            const section = document.getElementById(id);

            if (!section) {
                e.preventDefault();
                return;
            }

            e.preventDefault();

            if (isProgrammaticScroll) return;

            history.pushState(null, '', `#${id}`);
            setActive(id);
            smoothScrollToSection(id);
        };

        scrollWrap.addEventListener('click', handleCategoryClick);
        cleanupFunctions.push(() => {
            scrollWrap.removeEventListener('click', handleCategoryClick);
        });

        observer = new IntersectionObserver(
            (entries) => {
                if (!isInitialized || isProgrammaticScroll) return;

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActive(entry.target.id);
                    }
                });
            },
            {
                root: null,
                rootMargin: `-${HEADER_H + HEADER_OFFSET}px 0px -70% 0px`,
                threshold: 0,
            }
        );

        sections.forEach((sec) => observer.observe(sec));

        const initialId = location.hash.slice(1) || sections[0]?.id;
        if (initialId) {
            isProgrammaticScroll = true;
            setActive(initialId);
            resetProgrammaticScroll();
        }

        setTimeout(() => {
            isInitialized = true;
        }, INIT_DELAY);

        cleanupFunctions.push(() => {
            if (pendingScrollTimeout) clearTimeout(pendingScrollTimeout);
        });
    };

    document.addEventListener('DOMContentLoaded', init);

    document.body.addEventListener('htmx:oobAfterSwap', (e) => {
        if (e.detail.target?.id === 'product-list-container') {
            requestAnimationFrame(init);
        }
    });
})();