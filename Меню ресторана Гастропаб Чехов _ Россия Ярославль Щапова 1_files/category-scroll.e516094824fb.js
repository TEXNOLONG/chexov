function enableDragScroll(containerSelector, cancelClickSelector = null, enableWheelScroll = false) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollStart = 0;
    let dragged = false;
    let scrollDirection = null;

    const disableClickAfterDrag = () => {
        if (!cancelClickSelector) return;
        const items = container.querySelectorAll(cancelClickSelector);

        const preventClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            items.forEach(item => item.removeEventListener('click', preventClick, true));
        };

        items.forEach(item => item.addEventListener('click', preventClick, true));

        setTimeout(() => {
            items.forEach(item => item.removeEventListener('click', preventClick, true));
        }, 100);

    };

    const detectScrollDirection = (dx, dy) => {
        if (scrollDirection === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            scrollDirection = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        }
        return scrollDirection;
    };

    const finishDragging = () => {
        if (!isDragging) return;
        isDragging = false;
        scrollDirection = null;
        container.classList.remove('dragging');
        if (dragged) disableClickAfterDrag();
        dragged = false;
    };

    const onMouseDown = (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        dragged = false;
        scrollDirection = null;
        startX = e.pageX;
        startY = e.pageY;
        scrollStart = container.scrollLeft;
        container.classList.add('dragging');
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.pageX - startX;
        const dy = e.pageY - startY;
        const direction = detectScrollDirection(dx, dy);

        if (direction === 'vertical') {
            isDragging = false;
            container.classList.remove('dragging');
            return;
        }

        if (direction === 'horizontal') {
            dragged = true;
            container.scrollLeft = scrollStart - dx;
        }

    };

    const onTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        isDragging = true;
        dragged = false;
        scrollDirection = null;
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY;
        scrollStart = container.scrollLeft;
    };

    const onTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].pageX - startX;
        const dy = e.touches[0].pageY - startY;
        const direction = detectScrollDirection(dx, dy);

        if (direction === 'horizontal' && Math.abs(dx) > 10) {
            dragged = true;
        }

    };

    const onWheel = (e) => {
        if (e.deltaY !== 0) {
            const scrollAmount = e.deltaX !== 0 ? e.deltaX : e.deltaY;
            container.scrollLeft += scrollAmount;
            e.preventDefault();
        }
    };

    if (!isTouchDevice) {
        container.addEventListener('mousedown', onMouseDown);
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('mouseup', finishDragging);
        container.addEventListener('mouseleave', finishDragging);
    }

    container.addEventListener('touchstart', onTouchStart, {passive: true});
    container.addEventListener('touchmove', onTouchMove, {passive: true});
    container.addEventListener('touchend', finishDragging, {passive: true});

    if (enableWheelScroll) {
        container.addEventListener('wheel', onWheel, {passive: false});
    }

    return () => {
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseup', finishDragging);
        container.removeEventListener('mouseleave', finishDragging);
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', finishDragging);

        if (enableWheelScroll) {
            container.removeEventListener('wheel', onWheel);
        }

    };
}

document.addEventListener('DOMContentLoaded', () => {
    enableDragScroll('.category-scroll-container', '.category-item', true);
    enableDragScroll('.favorites-scroll-container', '.favorite-card', false);
});