(function () {
    'use strict';

    function initFavorites() {
        document.body.addEventListener('click', handleFavoriteClick);
        document.body.addEventListener('htmx:afterSettle', reinitializeDragScroll);
    }

    function handleFavoriteClick(e) {
        const btn = e.target.closest('.favorite-toggle-btn');
        if (!btn) return;
        const icon = btn.querySelector('.favorite-heart-icon');
        if (!icon) return;
        icon.classList.toggle('filled');
        animateHeartBeat(icon);
    }

    function reinitializeDragScroll() {
        const container = document.querySelector('.favorites-scroll-container');

        if (container && typeof enableDragScroll === 'function') {
            enableDragScroll('.favorites-scroll-container', '.favorite-card');
        }

    }

    function animateHeartBeat(icon) {
        icon.style.animation = 'none';
        void icon.offsetWidth;
        icon.style.animation = 'heartBeat 0.3s ease';
        setTimeout(() => (icon.style.animation = ''), 300);
    }

    function injectAnimationStyles() {
        if (document.getElementById('favorites-animation-styles')) return;
        const style = document.createElement('style');

        style.id = 'favorites-animation-styles';
        style.textContent = `
            @keyframes heartBeat {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.3); }
                50% { transform: scale(0.95); }
                75% { transform: scale(1.15); }
            }
            .favorite-heart-icon {
                transition: color 0.2s ease, fill 0.2s ease, transform 0.1s ease !important;
                will-change: transform, color, fill;
            }
            .favorite-toggle-btn:active .favorite-heart-icon {
                transform: scale(0.85);
            }
            .favorite-heart-icon.filled {
                color: var(--color-primary) !important;
                fill: currentColor !important;
            }
        `;

        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectAnimationStyles();
            initFavorites();
        });
    } else {
        injectAnimationStyles();
        initFavorites();
    }
})();