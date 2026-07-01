// menuapp/core/static/js/cart-sidebar.js

import {scrollLock} from './scroll-lock.js';

(() => {
    'use strict';

    const INTERACTIVE_SELECTOR =
        'button, a, input, select, textarea, label, [onclick], [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';

    const initCartSidebar = () => {
        const cartSidebar = document.querySelector('.cart-sidebar');
        if (!cartSidebar || cartSidebar.dataset.initialized === 'true') return;
        cartSidebar.dataset.initialized = 'true';
        const cartOverlay = document.querySelector('#cart-overlay');
        const closeBtn = document.querySelector('.cart-close-btn');
        let savedScrollPosition = 0;
        const closeCart = () => {
            cartSidebar.classList.remove('show');
            updateScrollLock();
        };

        closeBtn?.addEventListener('click', closeCart);
        cartOverlay?.addEventListener('click', closeCart);

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') closeCart();
        });

        let startX = 0,
            currentX = 0,
            startY = 0,
            currentY = 0,
            isDragging = false,
            hasMoved = false;

        let preventNextClick = false, rafId = null;

        const DRAG_THRESHOLD = 120;

        const setTranslateX = x => {
            cartSidebar.style.transform = `translateX(${x}px)`;
        };

        const resetTranslate = () => {
            cartSidebar.style.transform = '';
            cartSidebar.style.transition = 'transform 0.3s ease';
        };

        const safeClearRaf = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        const updateScrollLock = () => {
            if (cartSidebar.classList.contains('show')) {
                savedScrollPosition = window.scrollY;
                scrollLock.add('cart-sidebar');

                requestAnimationFrame(() => {
                    const currentPosition = window.scrollY;
                    if (currentPosition !== savedScrollPosition) {
                        window.scrollTo({
                            top: savedScrollPosition,
                            behavior: 'instant'
                        });
                    }
                });

            } else {
                scrollLock.remove('cart-sidebar');

                requestAnimationFrame(() => {
                    const currentPosition = window.scrollY;
                    if (currentPosition !== savedScrollPosition) {
                        window.scrollTo({
                            top: savedScrollPosition,
                            behavior: 'instant'
                        });
                    }
                });

            }
        };

        const isScrollableElement = el => {
            if (!el || el === document.body || el === document.documentElement) return false;

            const style = getComputedStyle(el);

            return (
                el.scrollHeight > el.clientHeight &&
                (style.overflowY === 'auto' || style.overflowY === 'scroll')
            );

        };

        const onTouchStart = e => {
            if (e.touches.length !== 1 || isDragging) return;
            startX = currentX = e.touches[0].clientX;
            startY = currentY = e.touches[0].clientY;
            isDragging = true;
            hasMoved = false;
            cartSidebar.style.transition = 'none';
        };

        const onTouchMove = e => {
            if (!isDragging) return;
            const touch = e.touches[0];
            currentX = touch.clientX;
            currentY = touch.clientY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                isDragging = false;
                hasMoved = false;
                cartSidebar.style.transition = '';
                return;
            }

            let dX = deltaX < 0 ? 0 : deltaX;

            if (dX > 5) hasMoved = true;

            const target = e.target;
            const scrollable =
                isScrollableElement(target) ||
                !!target.closest('.scrollable, .overflow-auto');
            safeClearRaf();
            rafId = requestAnimationFrame(() => setTranslateX(dX));

            if (dX > 0 && !scrollable) e.preventDefault();
        };

        const onTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            safeClearRaf();

            if (!hasMoved) {
                cartSidebar.style.transition = '';
                return;
            }

            const totalDeltaX = currentX - startX;

            if (totalDeltaX > DRAG_THRESHOLD) {
                cartSidebar.style.transition = 'transform 0.3s ease';
                cartSidebar.style.transform = 'translateX(100%)';
                preventNextClick = true;
                setTimeout(() => (preventNextClick = false), 600);
                setTimeout(() => {
                    cartSidebar.classList.remove('show');
                    cartSidebar.style.transition = '';
                    cartSidebar.style.transform = '';
                    updateScrollLock();
                }, 300);
            } else {
                resetTranslate();
            }
        };

        const onTouchCancel = () => {
            if (!isDragging) return;
            isDragging = false;
            hasMoved = false;
            safeClearRaf();
            resetTranslate();
        };

        const cartClickHandler = e => {
            if (preventNextClick) {
                e.stopImmediatePropagation();
                e.preventDefault();
                preventNextClick = false;
                return;
            }

            if (!e.target.closest(INTERACTIVE_SELECTOR)) {
                e.stopPropagation();
            }

        };

        const observer = new MutationObserver(updateScrollLock);
        observer.observe(cartSidebar, {
            attributes: true,
            attributeFilter: ['class']
        });

        cartSidebar.addEventListener('click', cartClickHandler, true);
        cartSidebar.addEventListener('touchstart', onTouchStart, {passive: true});
        cartSidebar.addEventListener('touchmove', onTouchMove, {passive: false});
        cartSidebar.addEventListener('touchend', onTouchEnd, {passive: true});
        cartSidebar.addEventListener('touchcancel', onTouchCancel, {passive: true});

        updateScrollLock();
    };

    document.addEventListener('DOMContentLoaded', initCartSidebar);
})();