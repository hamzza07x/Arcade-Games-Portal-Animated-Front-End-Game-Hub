function generateParticles() {
    const bgAnimation = document.getElementById('bgAnimation');
    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'game-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 20 + 10) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        bgAnimation.appendChild(particle);
    }
}

$(document).ready(function() {
    generateParticles();

    setTimeout(function() {
        $('#loadingScreen').addClass('fade-out');
        setTimeout(function() {
            $('#loadingScreen').css('display', 'none');
            $('#mainPage').addClass('show');
        }, 500);
    }, 2000);
});

function playGame(gameUrl) {
    $('#transitionOverlay').addClass('active');

    setTimeout(function() {
        window.location.href = gameUrl;
    }, 1500);
}

$('.game-card').hover(
    function() {
        $(this).find('.game-icon').css('animation-play-state', 'paused');
    },
    function() {
        $(this).find('.game-icon').css('animation-play-state', 'running');
    }
);

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.game-card').forEach(card => {
    observer.observe(card);
});