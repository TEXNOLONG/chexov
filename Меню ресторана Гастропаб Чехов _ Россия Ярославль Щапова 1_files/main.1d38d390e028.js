document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.nav-btn-with-loader').forEach(btn => {
        btn.classList.remove('loading');
    });

    document.querySelectorAll('.nav-btn-with-loader').forEach(button => {
        button.addEventListener('click', function (e) {
            if (!this.classList.contains('loading')) {
                this.classList.add('loading');
            }
        });
    });
});

window.addEventListener('pageshow', function (event) {
    document.querySelectorAll('.btn-with-loader').forEach(btn => {
        btn.classList.remove('loading');
    });
});

window.addEventListener('load', function () {
    document.querySelectorAll('.nav-btn-with-loader').forEach(btn => {
        btn.classList.remove('loading');
    });
});