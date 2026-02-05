function generateParticles() {
    const bgAnimation = document.getElementById('bgAnimation');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'snake-particle';
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
            $('#landingPage').addClass('show');
        }, 500);
    }, 2000);
});

$('#playBtn').click(function() {
    $('#transitionOverlay').addClass('active');

    setTimeout(function() {
        window.location.href = 'game/index.html';
    }, 1500);
});

$(document).keydown(function(e) {
    if (e.keyCode === 13 || e.keyCode === 32) {
        e.preventDefault();
        $('#playBtn').click();
    }
});