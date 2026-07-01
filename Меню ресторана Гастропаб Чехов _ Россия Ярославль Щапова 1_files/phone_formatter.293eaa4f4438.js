function initPhoneInput(input) {
    function formatPhone(digits) {
        digits = digits.slice(0, 10);
        let result = '+7';
        if (digits.length > 0) result += ' (' + digits.slice(0, 3);
        if (digits.length >= 3) result += ') ' + digits.slice(3, 6);
        if (digits.length >= 6) result += '-' + digits.slice(6, 8);
        if (digits.length >= 8) result += '-' + digits.slice(8, 10);
        return result;
    }

    input.addEventListener('focus', function () {
        if (!this.value) {
            this.value = '+7 ';
            this.setSelectionRange(3, 3);
        }
    });

    input.addEventListener('input', function () {
        let digits = this.value.replace(/\D/g, '').replace(/^[78]/, '');
        this.value = digits ? formatPhone(digits) : '+7 ';
    });

    input.addEventListener('keydown', function (e) {
        if (e.key !== 'Backspace') return;
        e.preventDefault();
        let digits = this.value.replace(/\D/g, '').replace(/^7/, '');

        if (this.selectionEnd - this.selectionStart > 0 || this.selectionStart <= 3) {
            this.value = '+7 ';
            this.setSelectionRange(3, 3);
        } else {
            this.value = formatPhone(digits.slice(0, -1));
            this.setSelectionRange(this.value.length, this.value.length);
        }

    });

    input.addEventListener('blur', function () {
        if (this.value === '+7 ' || this.value === '+7') this.value = '';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[type="tel"], input[id*="phone"]').forEach(initPhoneInput);
});
document.body.addEventListener('htmx:afterSwap', function (e) {
    e.detail.target.querySelectorAll('input[type="tel"], input[id*="phone"]').forEach(initPhoneInput);
});