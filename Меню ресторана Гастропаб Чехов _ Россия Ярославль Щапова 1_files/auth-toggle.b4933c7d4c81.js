document.addEventListener("DOMContentLoaded", initAuthForm);
document.body.addEventListener("htmx:afterSwap", () => {
    initAuthForm();
});

function initAuthForm() {
    const phoneToggle = document.getElementById("phone-toggle");
    const emailToggle = document.getElementById("email-toggle");
    const phoneField = document.querySelector(".phone-field");
    const emailField = document.querySelector(".email-field");
    const phoneInput = document.getElementById("id_phone");
    const emailInput = document.getElementById("id_email");

    if (!phoneToggle || !emailToggle || !phoneField || !emailField) {
        return;
    }

    if (phoneToggle.dataset.initialized === 'true') {
        return;
    }

    phoneToggle.dataset.initialized = 'true';
    document.querySelectorAll('.eye-closed').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.eye-open').forEach(el => el.style.display = 'inline');
    document.querySelectorAll('input[type="checkbox"][data-toggle-password]').forEach(toggle => {

        toggle.addEventListener('change', function () {
            const wrapper = this.closest('.password-field');
            if (!wrapper) return;
            const passwordInput = wrapper.querySelector('input[type="password"], input[type="text"]');
            const eyeIcon = wrapper.querySelector('.eye-icon');
            if (!passwordInput || !eyeIcon) return;
            const eyeOpenPaths = eyeIcon.querySelectorAll('.eye-open');
            const eyeClosedPaths = eyeIcon.querySelectorAll('.eye-closed');
            const show = this.checked;
            passwordInput.type = show ? 'text' : 'password';
            eyeOpenPaths.forEach(el => el.style.display = show ? 'none' : 'inline');
            eyeClosedPaths.forEach(el => el.style.display = show ? 'inline' : 'none');
            this.setAttribute('aria-pressed', show ? 'true' : 'false');
            this.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
        });

    });

    function toggleFields() {
        const isPhone = phoneToggle.checked;
        phoneField.style.display = isPhone ? "flex" : "none";
        emailField.style.display = isPhone ? "none" : "flex";

        if (phoneInput) {
            if (isPhone) {
                phoneInput.removeAttribute('disabled');
                phoneInput.setAttribute('autocomplete', 'tel');
                phoneInput.setAttribute('required', 'required');
                phoneInput.focus();
            } else {
                phoneInput.setAttribute('disabled', 'disabled');
                phoneInput.setAttribute('autocomplete', 'off');
                phoneInput.removeAttribute('required');
                phoneInput.value = '';
            }
        }

        if (emailInput) {
            if (!isPhone) {
                emailInput.removeAttribute('disabled');
                emailInput.setAttribute('autocomplete', 'email');
                emailInput.setAttribute('required', 'required');
                emailInput.focus();
            } else {
                emailInput.setAttribute('disabled', 'disabled');
                emailInput.setAttribute('autocomplete', 'off');
                emailInput.removeAttribute('required');
                emailInput.value = '';
            }
        }

    }

    phoneToggle.addEventListener("change", toggleFields);
    emailToggle.addEventListener("change", toggleFields);
    toggleFields();
}