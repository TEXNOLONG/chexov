document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.eye-closed').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.eye-open').forEach(el => el.style.display = 'inline');
    document.body.addEventListener('change', event => {
        const target = event.target;

        if (target.matches('input[type="checkbox"][data-toggle-password]')) {
            const wrapper = target.closest('.password-field');
            if (!wrapper) return;
            const passwordInput = wrapper.querySelector('input[type="password"], input[type="text"]');
            if (!passwordInput) return;
            const eyeIcon = wrapper.querySelector('.eye-icon');
            if (!eyeIcon) return;
            const eyeOpenPaths = eyeIcon.querySelectorAll('.eye-open');
            const eyeClosedPaths = eyeIcon.querySelectorAll('.eye-closed');

            if (target.checked) {
                passwordInput.type = 'text';
                eyeOpenPaths.forEach(el => el.style.display = 'none');
                eyeClosedPaths.forEach(el => el.style.display = 'inline');
                target.setAttribute('aria-pressed', 'true');
                target.setAttribute('aria-label', 'Скрыть пароль');
            } else {
                passwordInput.type = 'password';
                eyeOpenPaths.forEach(el => el.style.display = 'inline');
                eyeClosedPaths.forEach(el => el.style.display = 'none');
                target.setAttribute('aria-pressed', 'false');
                target.setAttribute('aria-label', 'Показать пароль');
            }

        }

    });

    document.body.addEventListener('htmx:afterSwap', () => {
        document.querySelectorAll('.eye-closed').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.eye-open').forEach(el => el.style.display = 'inline');
    });
});
