const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

console.log("Game canvas and context initialized.");

// Game Objects
class Projectile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.radius = 5;
        this.color = 'purple';
        this.speed = 5;
    }

    move() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = this.target.x;
            this.y = this.target.y;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.color = 'blue'; // Placeholder for Jotaro
        this.range = 150;
        this.projectiles = [];
        this.shootCooldown = 60; // 1 shot per second (60 frames)
        this.shootTimer = 0;
    }

    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = Infinity;

        enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < closestDistance && distance < this.range) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        return closestEnemy;
    }

    shoot(target) {
        if (this.shootTimer <= 0 && target) {
            this.projectiles.push(new Projectile(this.x, this.y, target));
            this.shootTimer = this.shootCooldown;
        }
    }

    update(enemies) {
        if (this.shootTimer > 0) {
            this.shootTimer--;
        }
        const target = this.findTarget(enemies);
        this.shoot(target);

        this.projectiles.forEach(p => p.move());
    }

    draw() {
        // Draw tower body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);

        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Jotaro", this.x, this.y + 5);

        // Draw projectiles
        this.projectiles.forEach(p => p.draw());
    }
}

class Enemy {
    constructor(path) {
        this.path = path;
        this.pathIndex = 0;
        this.x = this.path[0].x;
        this.y = this.path[0].y;
        this.width = 40;
        this.height = 40;
        this.color = 'yellow'; // Placeholder for Dio
        this.speed = 2;
    }

    move() {
        if (this.pathIndex < this.path.length - 1) {
            const target = this.path[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }

    draw() {
        // Draw enemy body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Draw name
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Dio", this.x, this.y + 5);
    }
}

class Game {
    constructor() {
        this.path = [
            { x: 0, y: 100 },
            { x: 600, y: 100 },
            { x: 600, y: 400 },
            { x: 200, y: 400 },
            { x: 200, y: 550 },
            { x: 800, y: 550 }
        ];
        this.towers = [];
        this.enemies = [];
        this.enemies.push(new Enemy(this.path));

        canvas.addEventListener('click', (event) => {
            this.placeTower(event.offsetX, event.offsetY);
        });
    }

    placeTower(x, y) {
        // For now, we'll just place a tower. In a real game, you'd check for funds, valid placement, etc.
        this.towers.push(new Tower(x, y));
    }

    update() {
        // Update towers and their projectiles
        this.towers.forEach(tower => tower.update(this.enemies));

        // Update enemies
        this.enemies.forEach(enemy => enemy.move());

        // Collision detection
        this.towers.forEach(tower => {
            tower.projectiles.forEach((projectile, pIndex) => {
                this.enemies.forEach((enemy, eIndex) => {
                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < enemy.width / 2) {
                        // Hit!
                        tower.projectiles.splice(pIndex, 1);
                        this.enemies.splice(eIndex, 1);
                    }
                });
            });
        });
    }

    drawPath() {
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
    }

    draw() {
        this.drawPath();
        this.towers.forEach(tower => tower.draw());
        this.enemies.forEach(enemy => enemy.draw());
    }
}

const game = new Game();

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    game.update();
    game.draw();

    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();