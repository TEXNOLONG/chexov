(() => {
    'use strict';

    const initModal = () => {
        const modalId = 'modal-container', contentId = 'modal-content', closeClass = 'modal__close';
        const windowClass = 'modal__window', visibleClass = 'visible';
        const dragThreshold = 250, velocityThreshold = 0.3;

        if (document.body.dataset.modalInitialized === 'true') return window.Modal || {};
        document.body.dataset.modalInitialized = 'true';

        let modal, modalWindow, modalContent, closeButton, lastFocusedElement, activeScrollable;
        let reachedTop = false, dragging = false, hasMoved = false;
        let startY = 0, currentY = 0, lastTouchY = 0, lastTouchTime = 0, velocityY = 0;
        const CLOSE_DRAG_START = 10, SMALL_PULL = 8;
        let originalUrl = location.pathname;

        const waitForScrollLock = () => {
            return new Promise((resolve) => {
                if (window.scrollLock) {
                    resolve(window.scrollLock);
                } else {
                    const checkInterval = setInterval(() => {
                        if (window.scrollLock) {
                            clearInterval(checkInterval);
                            resolve(window.scrollLock);
                        }
                    }, 10);
                }
            });
        };

        let scrollLock = null;
        let savedScrollPosition = 0;

        const isScrollableElement = el => {
            if (!el || el === document.body || el === document.documentElement) return false;
            const style = getComputedStyle(el);
            const overflowY = style.overflowY;
            return el.scrollHeight > el.clientHeight && (overflowY === 'auto' || overflowY === 'scroll');
        };

        const getBaseUrl = url => {
            const parts = url.split('/').filter(Boolean);
            parts.pop();
            return '/' + parts.join('/') + (parts.length ? '/' : '');
        };

        const isRestaurantModal = () => modalContent?.querySelector('.restaurant-modal');
        const isLogin = () => modalContent?.querySelector('.login-container');

        const setTranslateY = y => {
            if (modalWindow) {
                modalWindow.style.transform = `translateY(${y}px)`;
                modalWindow.style.transition = 'none';
            }
        };

        const resetTranslate = () => {
            if (modalWindow) {
                modalWindow.style.transform = '';
                modalWindow.style.transition = 'transform 0.3s ease';
            }
        };

        const showModal = async () => {
            if (!modal || !modalContent) return;
            if (!isRestaurantModal() && !isLogin()) originalUrl = getBaseUrl(location.pathname);

            if (!scrollLock) {
                scrollLock = await waitForScrollLock();
            }

            savedScrollPosition = window.scrollY;
            document.documentElement.classList.add('modal-active');
            lastFocusedElement = document.activeElement;
            modal.classList.add(visibleClass);
            modal.setAttribute('aria-hidden', 'false');
            scrollLock.add('modal');
            requestAnimationFrame(() => {
                const currentPosition = window.scrollY;

                if (currentPosition !== savedScrollPosition) {
                    window.scrollTo({
                        top: savedScrollPosition,
                        behavior: 'instant'
                    });
                }

            });
        };

        const hideModal = () => {
            if (!modal || !scrollLock) return;

            if (document.activeElement && modal.contains(document.activeElement)) {
                document.activeElement.blur();
            }

            document.documentElement.classList.remove('modal-active');

            lastFocusedElement?.focus?.();
            modal.classList.remove(visibleClass);
            modal.setAttribute('aria-hidden', 'true');
            scrollLock.remove('modal');
            requestAnimationFrame(() => {
                const currentPosition = window.scrollY;

                if (currentPosition !== savedScrollPosition) {
                    window.scrollTo({
                        top: savedScrollPosition,
                        behavior: 'instant'
                    });
                }

            });

            if (history && originalUrl !== location.pathname && !isRestaurantModal() && !isLogin())
                history.replaceState(null, '', originalUrl);
        };

        const handleTouchStart = e => {
            if (!modal?.classList.contains(visibleClass) || e.touches.length !== 1) return;
            activeScrollable = e.target.closest(
                '.product-modal__description, .scrollable, .login-container, .registration-container, [style*="overflow"]'
            );

            if (activeScrollable && !isScrollableElement(activeScrollable)) activeScrollable = null;
            reachedTop = !!(activeScrollable && activeScrollable.scrollTop <= 0);
            dragging = true;
            hasMoved = false;
            startY = currentY = lastTouchY = e.touches[0].clientY;
            lastTouchTime = e.timeStamp || Date.now();

            if (modalWindow) modalWindow.style.transition = 'none';

            if (activeScrollable && activeScrollable.scrollTop <= 0) {
                activeScrollable.scrollTop = 0;
                reachedTop = true;
            }
        };

        const handleTouchMove = e => {
            if (!dragging || !modal?.classList.contains(visibleClass)) return;

            const touch = e.touches[0];
            currentY = touch.clientY;
            let deltaY = currentY - startY;

            if (Math.abs(deltaY) > 5) hasMoved = true;
            if (deltaY < 0) deltaY = 0;

            const now = e.timeStamp || Date.now();
            const deltaTime = now - lastTouchTime;
            velocityY = deltaTime > 0 ? (currentY - lastTouchY) / deltaTime : 0;
            lastTouchY = currentY;
            lastTouchTime = now;

            if (activeScrollable) {
                const curTop = activeScrollable.scrollTop;

                if (!reachedTop && curTop <= 0) {
                    reachedTop = true;
                    startY = currentY;
                    deltaY = 0;
                    activeScrollable.scrollTop = 0;
                }

                if (reachedTop && deltaY > 0) {
                    if (activeScrollable.scrollTop < 0) activeScrollable.scrollTop = 0;
                    activeScrollable.style.transition = 'none';
                    activeScrollable.style.transform = '';

                    const selection = window.getSelection();
                    const isSelecting = selection && selection.toString().length > 0;

                    if (!isSelecting) {
                        e.preventDefault();
                    }

                    const rubber = Math.max(0, (deltaY - SMALL_PULL) / 5);
                    activeScrollable.style.transition = 'transform 0s';
                    activeScrollable.style.transform = `translateY(${rubber}px)`;

                    if (deltaY > CLOSE_DRAG_START) setTranslateY(deltaY - CLOSE_DRAG_START);
                    return;
                }
                return;
            }

            setTranslateY(deltaY);

            const selection = window.getSelection();
            const isSelecting = selection && selection.toString().length > 0;

            if (deltaY > 0 && !isSelecting) {
                e.preventDefault();
            }
        };

        const handleTouchEnd = () => {
            if (!dragging) return;
            dragging = false;

            if (activeScrollable) {
                activeScrollable.style.transition = 'transform 0.2s ease-out';
                activeScrollable.style.transform = '';
            }

            if (!hasMoved) {
                if (modalWindow) modalWindow.style.transition = '';
                activeScrollable = null;
                reachedTop = false;
                return;
            }

            const totalDeltaY = currentY - startY;
            const velocityOk = isFinite(velocityY) && velocityY > velocityThreshold;
            const effectivePull = Math.max(0, totalDeltaY - CLOSE_DRAG_START);

            if (effectivePull > dragThreshold || velocityOk) {
                modalWindow.style.transition = 'transform 0.3s ease';
                modalWindow.style.transform = 'translateY(100vh)';
                setTimeout(() => {
                    hideModal();
                    modalWindow.style.transition = '';
                    modalWindow.style.transform = '';
                }, 300);
            } else resetTranslate();

            activeScrollable = null;
            reachedTop = false;
        };

        const handleTouchCancel = () => {
            if (!dragging) return;
            dragging = false;
            hasMoved = false;
            resetTranslate();
        };

        const handleEscape = e => {
            if (e.key === 'Escape' && modal?.classList.contains(visibleClass)) hideModal();
        };

        const handleOverlayClick = e => {
            if (!modalWindow.contains(e.target)) hideModal();
        };

        const handleHtmxSwap = e => {
            if (e.detail?.target?.id === contentId) {

                if (e.detail.target.innerHTML.trim().length) {
                    showModal().catch(err => console.error('Modal show error:', err));
                } else {
                    hideModal();
                }

            }
        };

        const handleCartClick = e => {
            if (e.target.closest('#cart-button button') && modal?.classList.contains(visibleClass)) hideModal();
        };

        const createModal = () => {
            if (document.getElementById(modalId)) {
                modal = document.getElementById(modalId);
                modalWindow = modal.querySelector(`.${windowClass}`);
                modalContent = document.getElementById(contentId);
                closeButton = modal.querySelector(`.${closeClass}`);
                return;
            }
            document.body.insertAdjacentHTML(
                'beforeend',
                `<div id="${modalId}" class="modal-overlay" aria-hidden="true">
                    <div class="${windowClass}" role="dialog" aria-modal="true">
                        <button class="${closeClass}" aria-label="Закрыть модальное окно">×</button>
                        <div id="${contentId}" tabindex="-1"></div>
                    </div>
                </div>`
            );
            modal = document.getElementById(modalId);
            modalWindow = modal.querySelector(`.${windowClass}`);
            modalContent = document.getElementById(contentId);
            closeButton = modal.querySelector(`.${closeClass}`);
            document.body.addEventListener('htmx:beforeRequest', (e) => {
                if (e.detail?.target?.id === contentId || e.detail?.elt?.getAttribute('hx-target') === `#${contentId}`) {
                    savedScrollPosition = window.scrollY;
                }
            });

            modal.addEventListener('mousedown', handleOverlayClick);
            closeButton.addEventListener('click', hideModal);
            document.addEventListener('keydown', handleEscape);
            document.body.addEventListener('htmx:afterSwap', handleHtmxSwap);
            document.body.addEventListener('click', handleCartClick);
            modalWindow.addEventListener('touchstart', handleTouchStart, {passive: true});
            modalWindow.addEventListener('touchmove', handleTouchMove, {passive: false});
            modalWindow.addEventListener('touchend', handleTouchEnd, {passive: true});
            modalWindow.addEventListener('touchcancel', handleTouchCancel, {passive: true});
        };

        createModal();
        if (modalContent?.children.length) {
            showModal().catch(err => console.error('Modal show error:', err));
        }

        const api = {show: showModal, hide: hideModal};
        window.Modal = Object.assign(window.Modal || {}, api);
        return api;
    };

    document.addEventListener('DOMContentLoaded', () => {
        initModal();
    });

    window.Modal = window.Modal || {};
    window.Modal.create = initModal;
})();