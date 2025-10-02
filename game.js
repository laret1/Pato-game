const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let player;
let enemies = [];
let bullets = [];
let score = 0;
let wave = 1;
let gameOver = false;

// Player setup
const playerSize = 30;
player = {
    x: canvas.width / 2 - playerSize / 2,
    y: canvas.height / 2 - playerSize / 2,
    width: playerSize,
    height: playerSize,
    speed: 5,
    color: 'yellow'
};

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Enemy class
class Enemy {
    constructor(x, y, size, speed, color) {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.speed = speed;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        // Move towards player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
}

function spawnWave(waveNumber) {
    const enemyCount = waveNumber * 2;
    for (let i = 0; i < enemyCount; i++) {
        const enemySize = 30;
        const enemySpeed = 1 + waveNumber * 0.1;
        const enemyColor = 'green';

        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - enemySize : canvas.width + enemySize;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - enemySize : canvas.height + enemySize;
        }

        enemies.push(new Enemy(x, y, enemySize, enemySpeed, enemyColor));
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.update();
    });

    if (enemies.length === 0) {
        wave++;
        spawnWave(wave);
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        enemy.draw();
    });
}

// Bullet class
class Bullet {
    constructor(x, y, velocityX, velocityY, size, color) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.width = size;
        this.height = size;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();

        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        bullet.draw();
    });
}


// Player movement
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
});

window.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    const bulletSpeed = 7;
    const velocityX = Math.cos(angle) * bulletSpeed;
    const velocityY = Math.sin(angle) * bulletSpeed;
    const bulletSize = 5;

    bullets.push(new Bullet(player.x + player.width / 2, player.y + player.height / 2, velocityX, velocityY, bulletSize, 'white'));
});

function updatePlayerPosition() {
    if (keys.w && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys.s && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    if (keys.a && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.d && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

function checkCollisions() {
    // Bullet-Enemy collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const enemy = enemies[j];

            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Collision detected
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
            }
        }
    }

    // Player-Enemy collision
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Collision detected
            gameOver = true;
        }
    }
}

function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Wave: ${wave}`, canvas.width - 100, 40);
}

function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '48px sans-serif';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updatePlayerPosition();
    drawPlayer();
    updateEnemies();
    drawEnemies();
    updateBullets();
    drawBullets();
    checkCollisions();
    drawUI();

    requestAnimationFrame(gameLoop);
}

spawnWave(wave);
gameLoop();