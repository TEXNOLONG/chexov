const scrollLock = {
    locks: new Set(),
    scrollPosition: 0,
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;
    },

    update() {
        if (this.locks.size > 0) {
            this.scrollPosition = window.scrollY;
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.paddingRight = this.getScrollbarWidth() + 'px';
        } else {
            document.documentElement.style.overflow = '';
            document.documentElement.style.paddingRight = '';
            const currentScroll = window.scrollY;
            if (currentScroll !== this.scrollPosition) {
                window.scrollTo({
                    top: this.scrollPosition,
                    behavior: 'instant'
                });
            }
        }

    },

    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    },

    add(lockName) {
        this.init();
        this.locks.add(lockName);
        this.update();
    },

    remove(lockName) {
        this.locks.delete(lockName);
        this.update();
    }
};

window.scrollLock = scrollLock;
export {scrollLock};