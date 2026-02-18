const CONFIG = {
    screenWidth: 600,
    screenHeight: 800,
    playerSpeed: 8,
    playerCoolDown: 150,
    playerBulletSpeed: 6,
    baseAlienCoolDown: 1000,
    baseAlienBulletSpeed: 3,
    baseRows: 4,
    baseColumns: 5,
    fps: 60
};

const mobileInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false
};

let gameState = {
    level: 1,
    score: 0,
    highestScore: 0,
    state: 'COUNTDOWN', 
    countdown: 3,
    lastCountTime: 0,
    alienLastShot: 0,
    rows: CONFIG.baseRows,
    columns: CONFIG.baseColumns,
    alienCoolDown: CONFIG.baseAlienCoolDown,
    alienBulletSpeed: CONFIG.baseAlienBulletSpeed,
    maxAlienBullets: 3
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ASSETS = {
    background: 'assets/background.jpg',
    spaceship: 'assets/spaceship.png',  
    bullet: 'assets/bullet.png',         
    alienBullet: 'assets/alien_bullet.png', 
    aliens: [
        'assets/alien1.png',  
        'assets/alien2.png',
        'assets/alien3.png',
        'assets/alien4.png',
        'assets/alien5.png'
    ],
    explosions: [
        'assets/explosion1.png', 
        'assets/explosion2.png',
        'assets/explosion3.png',
        'assets/explosion4.png',
        'assets/explosion5.png'
    ],
    sounds: {
        explosion1: 'assets/explosion1.wav', 
        explosion2: 'assets/explosion2.wav',
        laser: 'assets/laser.wav'
    }
};

const images = {};
const sounds = {};
let assetsLoaded = 0;
let totalAssets = 0;

function loadImage(key, src) {
    totalAssets++;
    const img = new Image();
    img.onload = () => {
        assetsLoaded++;
        checkAssetsLoaded();
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        assetsLoaded++;
        checkAssetsLoaded();
    };
    img.src = src;
    images[key] = img;
}

function loadSound(key, src) {
    totalAssets++;
    const audio = new Audio();
    audio.oncanplaythrough = () => {
        assetsLoaded++;
        checkAssetsLoaded();
    };
    audio.onerror = () => {
        console.error(`Failed to load sound: ${src}`);
        assetsLoaded++;
        checkAssetsLoaded();
    };
    audio.src = src;
    audio.volume = 0.25;
    sounds[key] = audio;
}

function checkAssetsLoaded() {
    if (assetsLoaded >= totalAssets) {
        initGame();
    }
}

function loadAssets() {
    loadImage('background', ASSETS.background);
    loadImage('spaceship', ASSETS.spaceship);
    loadImage('bullet', ASSETS.bullet);
    loadImage('alienBullet', ASSETS.alienBullet);
    
    ASSETS.aliens.forEach((src, i) => {
        loadImage(`alien${i + 1}`, src);
    });
    
    ASSETS.explosions.forEach((src, i) => {
        loadImage(`explosion${i + 1}`, src);
    });
    
    loadSound('explosion1', ASSETS.sounds.explosion1);
    loadSound('explosion2', ASSETS.sounds.explosion2);
    loadSound('laser', ASSETS.sounds.laser);
}

function playSound(soundKey) {
    if (sounds[soundKey]) {
        const sound = sounds[soundKey].cloneNode();
        sound.volume = 0.25;
        sound.play().catch(e => console.log('Sound play failed:', e));
    }
}

function loadHighScore() {
    const saved = localStorage.getItem('spaceInvadersHighScore');
    gameState.highestScore = saved ? parseInt(saved) : 0;
    updateUI();
}

function saveHighScore() {
    localStorage.setItem('spaceInvadersHighScore', gameState.highestScore);
}

function applyLevelSettings() {
    const level = gameState.level;
    gameState.alienCoolDown = Math.max(300, CONFIG.baseAlienCoolDown - (level - 1) * 120);
    gameState.alienBulletSpeed = CONFIG.baseAlienBulletSpeed + (level - 1);
    gameState.rows = CONFIG.baseRows + level - 1;
    gameState.columns = CONFIG.baseColumns;
    gameState.maxAlienBullets = Math.min(10, 3 + level);
}

class SpaceShip {
    constructor(x, y, health) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.initialHealth = health;
        this.health = health;
        this.lastShot = 0;
        this.speed = CONFIG.playerSpeed;
    }
    
    update(keys) {
        // Combine keyboard and mobile inputs
        const moveLeft = keys.ArrowLeft || mobileInput.left;
        const moveRight = keys.ArrowRight || mobileInput.right;
        const moveUp = keys.ArrowUp || mobileInput.up;
        const moveDown = keys.ArrowDown || mobileInput.down;
        const shoot = keys[' '] || mobileInput.shoot;

        if (moveLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (moveRight && this.x + this.width < CONFIG.screenWidth) {
            this.x += this.speed;
        }
        if (moveUp && this.y > 0) {
            this.y -= this.speed;
        }
        if (moveDown && this.y + this.height < CONFIG.screenHeight - 20) {
            this.y += this.speed;
        }
        
        const now = Date.now();
        if (shoot && now - this.lastShot > CONFIG.playerCoolDown) {
            playSound('laser');
            bullets.push(new Bullet(this.x + this.width / 2, this.y));
            this.lastShot = now;
        }
        
        return this.health <= 0;
    }
    
    draw() {
        if (images.spaceship && images.spaceship.complete) {
            ctx.drawImage(images.spaceship, this.x, this.y, this.width, this.height);
        }
        this.drawHealth();
    }
    
    drawHealth() {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y + this.height + 5, this.width, 10);
        
        if (this.health > 0) {
            const ratio = this.health / this.initialHealth;
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y + this.height + 5, this.width * ratio, 10);
        }
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = CONFIG.playerBulletSpeed;
        this.active = true;
    }
    
    update() {
        this.y -= this.speed;
        if (this.y + this.height < 0) {
            this.active = false;
        }
    }
    
    draw() {
        if (images.bullet && images.bullet.complete) {
            ctx.drawImage(images.bullet, this.x - this.width / 2, this.y, this.width, this.height);
        }
    }
}

class Alien {
    constructor(x, y, column) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.column = column;
        this.movementDirection = 1;
        this.movementCounter = 0;
        this.speed = Math.min(4, 1 + (gameState.level - 1) * 0.3);
        this.type = Math.floor(Math.random() * 5) + 1;
        this.active = true;
    }
    
    update() {
        this.x += this.movementDirection * this.speed;
        this.movementCounter++;
        if (this.movementCounter >= 75) {
            this.movementDirection *= -1;
            this.movementCounter = 0;
        }
    }
    
    draw() {
        const img = images[`alien${this.type}`];
        if (img && img.complete) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }
    }
}

class AlienBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 20;
        this.speed = gameState.alienBulletSpeed;
        this.active = true;
    }
    
    update() {
        this.y += this.speed;
        if (this.y > CONFIG.screenHeight) {
            this.active = false;
        }
    }
    
    draw() {
        if (images.alienBullet && images.alienBullet.complete) {
            ctx.drawImage(images.alienBullet, this.x - this.width / 2, this.y, this.width, this.height);
        }
    }
}

class Explosion {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.frameIndex = 0;
        this.frameCount = 5;
        this.counter = 0;
        this.active = true;
    }
    
    update() {
        this.counter++;
        if (this.counter >= 3) {
            this.counter = 0;
            this.frameIndex++;
            if (this.frameIndex >= this.frameCount) {
                this.active = false;
            }
        }
    }
    
    draw() {
        if (this.frameIndex < this.frameCount) {
            const img = images[`explosion${this.frameIndex + 1}`];
            if (img && img.complete) {
                const sizes = { 1: 32, 2: 64, 3: 192 };
                const size = sizes[this.size] || 64;
                ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
            }
        }
    }
}

let player;
let bullets = [];
let aliens = [];
let alienBullets = [];
let explosions = [];
let keys = {};

function createAliens() {
    aliens = [];
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.columns; col++) {
            aliens.push(new Alien(80 + col * 90, 100 + row * 70, col));
        }
    }
}

function getSmartShooter() {
    const columnAliens = {};
    aliens.forEach(alien => {
        if (!columnAliens[alien.column] || alien.y > columnAliens[alien.column].y) {
            columnAliens[alien.column] = alien;
        }
    });
    const shooters = Object.values(columnAliens);
    return shooters.length > 0 ? shooters[Math.floor(Math.random() * shooters.length)] : null;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateUI() {
    $('#scoreDisplay').text(`Score: ${gameState.score}`);
    $('#levelDisplay').text(`Level: ${gameState.level}`);
    $('#highestScore').text(gameState.highestScore);
}

function showOverlay(id) {
    $(`#${id}`).removeClass('hidden');
}

function hideOverlay(id) {
    $(`#${id}`).addClass('hidden');
}

function resetGame() {
    gameState.level = 1;
    gameState.score = 0;
    applyLevelSettings();
    bullets = [];
    aliens = [];
    alienBullets = [];
    explosions = [];
    createAliens();
    player.health = player.initialHealth;
    player.x = CONFIG.screenWidth / 2 - 25;
    player.y = CONFIG.screenHeight - 100;
    gameState.state = 'COUNTDOWN';
    gameState.countdown = 3;
    gameState.lastCountTime = Date.now();
    hideOverlay('gameOverOverlay');
    updateUI();
}

function nextLevel() {
    gameState.level++;
    applyLevelSettings();
    aliens = [];
    alienBullets = [];
    explosions = [];
    createAliens();
    gameState.state = 'PLAYING';
    hideOverlay('levelCompleteOverlay');
    updateUI();
}

function gameLoop() {

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CONFIG.screenWidth, CONFIG.screenHeight);
    
    if (images.background && images.background.complete) {
        ctx.drawImage(images.background, 0, 0, CONFIG.screenWidth, CONFIG.screenHeight);
    }
    
    const now = Date.now();
    
    switch (gameState.state) {
        case 'COUNTDOWN':
            if (now - gameState.lastCountTime > 1000) {
                gameState.countdown--;
                gameState.lastCountTime = now;
                $('#countdownNumber').text(gameState.countdown);
                
                if (gameState.countdown === 0) {
                    gameState.state = 'PLAYING';
                    hideOverlay('countdownOverlay');
                }
            }
            break;
            
        case 'PLAYING':
            if (now - gameState.alienLastShot > gameState.alienCoolDown && 
                alienBullets.length < gameState.maxAlienBullets) {
                const shooter = getSmartShooter();
                if (shooter) {
                    alienBullets.push(new AlienBullet(
                        shooter.x + shooter.width / 2,
                        shooter.y + shooter.height
                    ));
                    gameState.alienLastShot = now;
                }
            }
            
            if (player.update(keys)) {
                explosions.push(new Explosion(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                    3
                ));
                gameState.state = 'GAME_OVER';
                if (gameState.score > gameState.highestScore) {
                    gameState.highestScore = gameState.score;
                    saveHighScore();
                }
                $('#finalScore').text(gameState.score);
                updateUI();
                showOverlay('gameOverOverlay');
            }
            
            bullets.forEach(bullet => {
                bullet.update();
                
                aliens.forEach(alien => {
                    if (bullet.active && alien.active && checkCollision(bullet, alien)) {
                        bullet.active = false;
                        alien.active = false;
                        gameState.score += 10 * gameState.level;
                        playSound('explosion1');
                        explosions.push(new Explosion(
                            alien.x + alien.width / 2,
                            alien.y + alien.height / 2,
                            2
                        ));
                        updateUI();
                    }
                });
            });
            bullets = bullets.filter(b => b.active);
            
            aliens.forEach(alien => alien.update());
            aliens = aliens.filter(a => a.active);
            
            alienBullets.forEach(bullet => {
                bullet.update();
                
                if (bullet.active && checkCollision(bullet, player)) {
                    bullet.active = false;
                    player.health--;
                    playSound('explosion2');
                    explosions.push(new Explosion(
                        bullet.x,
                        bullet.y,
                        1
                    ));
                }
            });
            alienBullets = alienBullets.filter(b => b.active);
            
            explosions.forEach(exp => exp.update());
            explosions = explosions.filter(e => e.active);
            
            if (aliens.length === 0) {
                gameState.state = 'LEVEL_COMPLETE';
                $('#clearedLevel').text(gameState.level);
                showOverlay('levelCompleteOverlay');
            }
            break;
    }
    
    player.draw();
    bullets.forEach(b => b.draw());
    aliens.forEach(a => a.draw());
    alienBullets.forEach(b => b.draw());
    explosions.forEach(e => e.draw());
    
    requestAnimationFrame(gameLoop);
}

function initGame() {
    player = new SpaceShip(CONFIG.screenWidth / 2 - 25, CONFIG.screenHeight - 100, 3);
    applyLevelSettings();
    createAliens();
    loadHighScore();
    updateUI();
    showOverlay('countdownOverlay');
    gameState.lastCountTime = Date.now();
    gameLoop();
}

$(document).ready(function() {
    
    $(document).keydown(function(e) {
        keys[e.key] = true;
        
        if (e.key === 'r' && gameState.state === 'GAME_OVER') {
            resetGame();
        }
        if (e.key === 'q' && gameState.state === 'GAME_OVER') {

            console.log('Quit pressed');
            history.back();
        }
        if (gameState.state === 'LEVEL_COMPLETE') {
            nextLevel();
        }
        
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    $(document).keyup(function(e) {
        keys[e.key] = false;
    });
    
    $('#restartBtn').click(function() {
        resetGame();
    });
    
    $('#quitBtn').click(function() {
        console.log('Quit clicked');
    });
    
    loadAssets();
});

function scaleCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scaleX = containerWidth / CONFIG.screenWidth;
    const scaleY = containerHeight / CONFIG.screenHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    canvas.style.width = (CONFIG.screenWidth * scale) + 'px';
    canvas.style.height = (CONFIG.screenHeight * scale) + 'px';
}

window.addEventListener('resize', scaleCanvas);
window.addEventListener('orientationchange', scaleCanvas);
scaleCanvas();

function setupMobileControls() {
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnShoot = document.getElementById('btnShoot');

    if (!btnUp) return; 

    [btnUp, btnDown, btnLeft, btnRight, btnShoot].forEach(btn => {
        if (btn) {
            btn.addEventListener('touchstart', (e) => e.preventDefault());
            btn.addEventListener('touchend', (e) => e.preventDefault());
            btn.addEventListener('touchmove', (e) => e.preventDefault());
        }
    });

    btnUp.addEventListener('touchstart', () => mobileInput.up = true);
    btnDown.addEventListener('touchstart', () => mobileInput.down = true);
    btnLeft.addEventListener('touchstart', () => mobileInput.left = true);
    btnRight.addEventListener('touchstart', () => mobileInput.right = true);

    btnUp.addEventListener('touchend', () => mobileInput.up = false);
    btnDown.addEventListener('touchend', () => mobileInput.down = false);
    btnLeft.addEventListener('touchend', () => mobileInput.left = false);
    btnRight.addEventListener('touchend', () => mobileInput.right = false);

    btnUp.addEventListener('mousedown', () => mobileInput.up = true);
    btnDown.addEventListener('mousedown', () => mobileInput.down = true);
    btnLeft.addEventListener('mousedown', () => mobileInput.left = true);
    btnRight.addEventListener('mousedown', () => mobileInput.right = true);

    btnUp.addEventListener('mouseup', () => mobileInput.up = false);
    btnDown.addEventListener('mouseup', () => mobileInput.down = false);
    btnLeft.addEventListener('mouseup', () => mobileInput.left = false);
    btnRight.addEventListener('mouseup', () => mobileInput.right = false);

    btnShoot.addEventListener('touchstart', () => mobileInput.shoot = true);
    btnShoot.addEventListener('touchend', () => mobileInput.shoot = false);
    btnShoot.addEventListener('mousedown', () => mobileInput.shoot = true);
    btnShoot.addEventListener('mouseup', () => mobileInput.shoot = false);

    [btnUp, btnDown, btnLeft, btnRight].forEach(btn => {
        btn.addEventListener('touchcancel', () => {
            mobileInput.up = false;
            mobileInput.down = false;
            mobileInput.left = false;
            mobileInput.right = false;
        });
    });

    btnShoot.addEventListener('touchcancel', () => mobileInput.shoot = false);
}

$(document).ready(function() {
    setupMobileControls();
});
