(function () {
    'use strict';

    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

    function init() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            const name = input.name || '';
            const accept = input.getAttribute('accept') || '';

            if (name.includes('image') || accept.includes('image')) {
                input.addEventListener('change', handleImageChange);
            }
        });
    }

    function handleImageChange(e) {
        const file = e.target.files[0];

        if (!file) return;

        if (!validateFile(file)) {
            e.target.value = '';
            e.target.focus();
        }
    }

    function validateFile(file) {
        if (!ALLOWED_EXT.test(file.name)) {
            alert(
                'Неподдерживаемый формат файла!\n\n' +
                'Разрешены только: JPG, JPEG, PNG, WEBP'
            );
            return false;
        }

        if (file.size > MAX_SIZE_BYTES) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

            alert(
                'Размер изображения слишком большой!\n\n' +
                'Размер файла: ' + fileSizeMB + ' MB\n' +
                'Максимум: ' + MAX_SIZE_MB + ' MB\n\n' +
                'Пожалуйста, выберите изображение меньшего размера. Вы можете быстро уменьшить его на любом онлайн-сервисе сжатия.'
            );

            return false;
        }

        return true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('formset:added', init);

})();