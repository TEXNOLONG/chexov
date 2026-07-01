document.addEventListener("click", function (event) {
    if (event.target.matches(".messages .messages-close")) {
        event.preventDefault();
        const messageItem = event.target.closest("li");

        if (messageItem) {
            clearTimeout(messageItem._autoCloseTimeout);
            messageItem.remove();
        }

    }
});

function initAutoCloseMessages() {
    document.querySelectorAll('.messages li[data-auto-close]').forEach(item => {

        if (item._autoCloseTimeout) return;
        const delay = parseInt(item.getAttribute('data-auto-close')) || 5000;

        item._autoCloseTimeout = setTimeout(() => {
            item.style.opacity = '0';
            setTimeout(() => item.remove(), 300);
        }, delay);

    });
}

initAutoCloseMessages();

document.body.addEventListener('htmx:afterSwap', function (evt) {
    if (evt.target.id === "messages-container") {
        initAutoCloseMessages();
    }
});