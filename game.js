const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudClass = document.getElementById('hud-class');
const hudHealth = document.getElementById('hud-health');
const hudMaxHealth = document.getElementById('hud-max-health');
const hudCoins = document.getElementById('hud-coins');
const hudWave = document.getElementById('hud-wave');
const hudScore = document.getElementById('hud-score');

const classScreen = document.getElementById('class-screen');
const shopScreen = document.getElementById('shop-screen');
const shopItemsContainer = document.getElementById('shop-items');
const nextWaveButton = document.getElementById('next-wave');
const gameOverScreen = document.getElementById('game-over');
const finalWave = document.getElementById('final-wave');
const finalScore = document.getElementById('final-score');
const restartButton = document.getElementById('restart');
const fireButton = document.getElementById('fire-button');
const touchLeft = document.getElementById('touch-left');

const gameState = {
    player: null,
    enemies: [],
    bullets: [],
    score: 0,
    wave: 1,
    coins: 0,
    gameOver: false,
    waveActive: false,
    lastShotTime: 0,
    aimX: 0,
    aimY: 0,
    activeClass: null,
    regenAccumulator: 0
};

const classConfigs = {
    Scout: {
        maxHealth: 90,
        speed: 4.6,
        fireRate: 240,
        damage: 12,
        bulletSpeed: 7.5,
        regen: 0.4
    },
    Guardian: {
        maxHealth: 140,
        speed: 3.6,
        fireRate: 360,
        damage: 11,
        bulletSpeed: 6.8,
        regen: 0.2
    },
    Gunner: {
        maxHealth: 105,
        speed: 3.9,
        fireRate: 300,
        damage: 16,
        bulletSpeed: 8.2,
        regen: 0.25
    }
};

const upgradeCatalog = [
    {
        id: 'health',
        name: 'Blindaje reforzado',
        description: '+20 vida máxima',
        baseCost: 80,
        apply: (player) => {
            player.maxHealth += 20;
            player.health += 20;
        }
    },
    {
        id: 'damage',
        name: 'Munición pesada',
        description: '+3 daño',
        baseCost: 90,
        apply: (player) => {
            player.damage += 3;
        }
    },
    {
        id: 'firerate',
        name: 'Mecanismo rápido',
        description: '-40ms cadencia',
        baseCost: 120,
        apply: (player) => {
            player.fireRate = Math.max(120, player.fireRate - 40);
        }
    },
    {
        id: 'speed',
        name: 'Aletas turbo',
        description: '+0.4 velocidad',
        baseCost: 100,
        apply: (player) => {
            player.speed += 0.4;
        }
    },
    {
        id: 'bulletSpeed',
        name: 'Caño largo',
        description: '+0.6 velocidad de bala',
        baseCost: 90,
        apply: (player) => {
            player.bulletSpeed += 0.6;
        }
    },
    {
        id: 'regen',
        name: 'Botiquín acuático',
        description: '+0.15 regeneración/s',
        baseCost: 140,
        apply: (player) => {
            player.regen += 0.15;
        }
    }
];

const upgradeLevels = Object.fromEntries(upgradeCatalog.map((upgrade) => [upgrade.id, 0]));

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

window.addEventListener('resize', resizeCanvas);

function createPlayer(selectedClass) {
    const config = classConfigs[selectedClass];
    return {
        x: canvas.clientWidth / 2 - 15,
        y: canvas.clientHeight / 2 - 15,
        width: 30,
        height: 30,
        speed: config.speed,
        color: '#ffd966',
        maxHealth: config.maxHealth,
        health: config.maxHealth,
        damage: config.damage,
        fireRate: config.fireRate,
        bulletSpeed: config.bulletSpeed,
        regen: config.regen
    };
}

function drawPlayer() {
    const { player } = gameState;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width + 10, player.y + player.height / 2 + 4);
    ctx.lineTo(player.x + player.width, player.y + player.height / 2 + 8);
    ctx.closePath();
    ctx.fill();
}

class Enemy {
    constructor(x, y, size, speed, color, health, damage) {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.speed = speed;
        this.color = color;
        this.health = health;
        this.damage = damage;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(target) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
}

class Bullet {
    constructor(x, y, velocityX, velocityY, size, color, damage) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.width = size;
        this.height = size;
        this.color = color;
        this.damage = damage;
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

function spawnWave(waveNumber) {
    const baseCount = 5 + waveNumber * 2;
    const enemyCount = Math.min(40, baseCount);
    for (let i = 0; i < enemyCount; i++) {
        const enemySize = 26 + Math.random() * 10;
        const enemySpeed = 1.1 + waveNumber * 0.06 + Math.random() * 0.4;
        const enemyHealth = 18 + waveNumber * 4;
        const enemyDamage = 8 + waveNumber * 0.6;
        const enemyColor = waveNumber % 4 === 0 ? '#ef6c57' : '#68d391';

        let x;
        let y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -enemySize : canvas.clientWidth + enemySize;
            y = Math.random() * canvas.clientHeight;
        } else {
            x = Math.random() * canvas.clientWidth;
            y = Math.random() < 0.5 ? -enemySize : canvas.clientHeight + enemySize;
        }

        gameState.enemies.push(new Enemy(x, y, enemySize, enemySpeed, enemyColor, enemyHealth, enemyDamage));
    }
}

function updateEnemies() {
    const { player, enemies } = gameState;
    enemies.forEach((enemy) => {
        enemy.update(player);
    });
}

function drawEnemies() {
    gameState.enemies.forEach((enemy) => enemy.draw());
}

function updateBullets() {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.update();

        if (
            bullet.x < -50 ||
            bullet.x > canvas.clientWidth + 50 ||
            bullet.y < -50 ||
            bullet.y > canvas.clientHeight + 50
        ) {
            gameState.bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    gameState.bullets.forEach((bullet) => bullet.draw());
}

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (event) => {
    if (event.key === 'w' || event.key === 'W') keys.w = true;
    if (event.key === 'a' || event.key === 'A') keys.a = true;
    if (event.key === 's' || event.key === 'S') keys.s = true;
    if (event.key === 'd' || event.key === 'D') keys.d = true;
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 'W') keys.w = false;
    if (event.key === 'a' || event.key === 'A') keys.a = false;
    if (event.key === 's' || event.key === 'S') keys.s = false;
    if (event.key === 'd' || event.key === 'D') keys.d = false;
});

let pointerDown = false;

canvas.addEventListener('mousedown', (event) => {
    pointerDown = true;
    updateAim(event.clientX, event.clientY);
});

canvas.addEventListener('mousemove', (event) => {
    if (pointerDown) {
        updateAim(event.clientX, event.clientY);
    }
});

canvas.addEventListener('mouseup', () => {
    pointerDown = false;
});

canvas.addEventListener('mouseleave', () => {
    pointerDown = false;
});

function updateAim(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    gameState.aimX = clientX - rect.left;
    gameState.aimY = clientY - rect.top;
}

let touchMoveVector = { x: 0, y: 0 };
let touchOrigin = null;

canvas.addEventListener('touchstart', (event) => {
    Array.from(event.changedTouches).forEach((touch) => {
        if (touch.clientX < window.innerWidth / 2) {
            touchOrigin = { x: touch.clientX, y: touch.clientY };
        } else {
            updateAim(touch.clientX, touch.clientY);
        }
    });
}, { passive: true });

canvas.addEventListener('touchmove', (event) => {
    Array.from(event.changedTouches).forEach((touch) => {
        if (touchOrigin && touch.clientX < window.innerWidth / 2) {
            const deltaX = touch.clientX - touchOrigin.x;
            const deltaY = touch.clientY - touchOrigin.y;
            const maxDistance = 50;
            const distance = Math.min(maxDistance, Math.hypot(deltaX, deltaY));
            const angle = Math.atan2(deltaY, deltaX);
            touchMoveVector = {
                x: (Math.cos(angle) * distance) / maxDistance,
                y: (Math.sin(angle) * distance) / maxDistance
            };
        } else {
            updateAim(touch.clientX, touch.clientY);
        }
    });
}, { passive: true });

canvas.addEventListener('touchend', (event) => {
    Array.from(event.changedTouches).forEach((touch) => {
        if (touchOrigin && touch.clientX < window.innerWidth / 2) {
            touchOrigin = null;
            touchMoveVector = { x: 0, y: 0 };
        }
    });
}, { passive: true });

let firePressed = false;

fireButton.addEventListener('touchstart', (event) => {
    event.preventDefault();
    firePressed = true;
}, { passive: false });

fireButton.addEventListener('touchend', () => {
    firePressed = false;
});

fireButton.addEventListener('mousedown', () => {
    firePressed = true;
});

fireButton.addEventListener('mouseup', () => {
    firePressed = false;
});

function updatePlayerPosition(deltaTime) {
    const { player } = gameState;
    let moveX = 0;
    let moveY = 0;

    if (keys.w) moveY -= 1;
    if (keys.s) moveY += 1;
    if (keys.a) moveX -= 1;
    if (keys.d) moveX += 1;

    if (touchOrigin) {
        moveX = touchMoveVector.x;
        moveY = touchMoveVector.y;
    }

    const magnitude = Math.hypot(moveX, moveY) || 1;
    const velocityX = (moveX / magnitude) * player.speed * (deltaTime / 16.67);
    const velocityY = (moveY / magnitude) * player.speed * (deltaTime / 16.67);

    player.x = Math.max(0, Math.min(canvas.clientWidth - player.width, player.x + velocityX));
    player.y = Math.max(0, Math.min(canvas.clientHeight - player.height, player.y + velocityY));
}

function shootBullet() {
    const now = performance.now();
    const { player } = gameState;
    if (now - gameState.lastShotTime < player.fireRate) {
        return;
    }
    gameState.lastShotTime = now;

    const aimX = gameState.aimX || player.x + player.width;
    const aimY = gameState.aimY || player.y + player.height / 2;
    const angle = Math.atan2(aimY - (player.y + player.height / 2), aimX - (player.x + player.width / 2));
    const velocityX = Math.cos(angle) * player.bulletSpeed;
    const velocityY = Math.sin(angle) * player.bulletSpeed;
    const bulletSize = 6;

    gameState.bullets.push(
        new Bullet(player.x + player.width / 2, player.y + player.height / 2, velocityX, velocityY, bulletSize, '#ffffff', player.damage)
    );
}

function checkCollisions(deltaTime) {
    const { player } = gameState;

    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.health -= bullet.damage;
                gameState.bullets.splice(i, 1);

                if (enemy.health <= 0) {
                    gameState.enemies.splice(j, 1);
                    gameState.score += 12;
                    gameState.coins += 6 + gameState.wave;
                }
                break;
            }
        }
    }

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            player.health -= enemy.damage * (deltaTime / 1000);
            if (player.health <= 0) {
                gameState.gameOver = true;
            }
        }
    }
}

function updateRegen(deltaTime) {
    const { player } = gameState;
    if (player.health < player.maxHealth) {
        gameState.regenAccumulator += deltaTime / 1000;
        if (gameState.regenAccumulator >= 1) {
            const ticks = Math.floor(gameState.regenAccumulator);
            player.health = Math.min(player.maxHealth, player.health + player.regen * ticks);
            gameState.regenAccumulator -= ticks;
        }
    }
}

function drawUI() {
    const { player } = gameState;
    hudClass.textContent = gameState.activeClass;
    hudHealth.textContent = Math.ceil(player.health);
    hudMaxHealth.textContent = player.maxHealth;
    hudCoins.textContent = gameState.coins;
    hudWave.textContent = gameState.wave;
    hudScore.textContent = gameState.score;
}

function renderBackground() {
    ctx.fillStyle = '#0b0f18';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < canvas.clientWidth; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.clientHeight);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.clientHeight; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.clientWidth, y);
        ctx.stroke();
    }
}

function showShop() {
    shopScreen.classList.add('active');
    buildShop();
}

function hideShop() {
    shopScreen.classList.remove('active');
}

function buildShop() {
    shopItemsContainer.innerHTML = '';
    upgradeCatalog.forEach((upgrade) => {
        const level = upgradeLevels[upgrade.id];
        const cost = Math.floor(upgrade.baseCost * Math.pow(1.28, level));
        const item = document.createElement('div');
        item.className = 'shop-item';

        const title = document.createElement('h4');
        title.textContent = `${upgrade.name} (Nv ${level + 1})`;

        const description = document.createElement('p');
        description.textContent = upgrade.description;

        const costLabel = document.createElement('div');
        costLabel.textContent = `Costo: ${cost} monedas`;

        const button = document.createElement('button');
        button.textContent = gameState.coins >= cost ? 'Comprar' : 'Sin monedas';
        button.disabled = gameState.coins < cost;
        button.addEventListener('click', () => {
            if (gameState.coins >= cost) {
                gameState.coins -= cost;
                upgrade.apply(gameState.player);
                upgradeLevels[upgrade.id] += 1;
                buildShop();
            }
        });

        item.append(title, description, costLabel, button);
        shopItemsContainer.appendChild(item);
    });
}

function beginWave() {
    gameState.waveActive = true;
    hideShop();
    spawnWave(gameState.wave);
}

function endWaveIfCleared() {
    if (gameState.waveActive && gameState.enemies.length === 0) {
        gameState.waveActive = false;
        gameState.wave += 1;
        showShop();
    }
}

function gameLoop(timestamp) {
    if (!gameState.player) {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState.gameOver) {
        gameOverScreen.classList.add('active');
        finalWave.textContent = gameState.wave;
        finalScore.textContent = gameState.score;
        return;
    }

    if (!gameState.lastFrameTime) {
        gameState.lastFrameTime = timestamp;
    }
    const deltaTime = timestamp - gameState.lastFrameTime;
    gameState.lastFrameTime = timestamp;

    renderBackground();
    updatePlayerPosition(deltaTime);
    updateEnemies();
    updateBullets();
    checkCollisions(deltaTime);
    updateRegen(deltaTime);

    drawPlayer();
    drawEnemies();
    drawBullets();
    drawUI();

    if (pointerDown || firePressed) {
        shootBullet();
    }

    endWaveIfCleared();

    requestAnimationFrame(gameLoop);
}

function resetGame() {
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.score = 0;
    gameState.wave = 1;
    gameState.coins = 0;
    gameState.gameOver = false;
    gameState.waveActive = false;
    gameState.lastShotTime = 0;
    gameState.lastFrameTime = 0;
    gameState.regenAccumulator = 0;
    Object.keys(upgradeLevels).forEach((key) => {
        upgradeLevels[key] = 0;
    });
}

Array.from(document.querySelectorAll('.class-card')).forEach((button) => {
    button.addEventListener('click', () => {
        const selectedClass = button.dataset.class;
        resetGame();
        gameState.activeClass = selectedClass;
        gameState.player = createPlayer(selectedClass);
        classScreen.classList.remove('active');
        showShop();
    });
});

nextWaveButton.addEventListener('click', () => {
    if (!gameState.waveActive) {
        beginWave();
    }
});

restartButton.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    classScreen.classList.add('active');
});

resizeCanvas();
requestAnimationFrame(gameLoop);
