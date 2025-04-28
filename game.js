// 게임 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 게임 상태
let gameOver = false;
let score = 0;
let level = 1;
let lastShotTime = 0;
const shootCooldown = 200; // 발사 쿨다운 (밀리초)

// 미사일 설정 추가
const missileConfig = {
    cooldown: 2000,
    speed: 6,
    size: 8,
    damage: 3,
    color: '#ff3300',
    explosionRadius: 50,
    rotationSpeed: 0.1 // 회전 속도 추가
};
let lastMissileTime = 0;
const missiles = [];

// 플레이어 설정
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 6,
    health: 100,
    color: '#00ff00',
    powerLevel: 1
};

// 총알 배열
const bullets = [];
const bulletSpeed = 8;
const bulletSize = 5;

// 적기 배열
const enemies = [];
const enemySize = 40;
const enemyTypes = [
    { color: '#ff0000', speed: 2, health: 1, points: 10 },
    { color: '#ff6600', speed: 3, health: 2, points: 20 },
    { color: '#ff0066', speed: 1.5, health: 3, points: 30 }
];

// 파워업 시스템
const powerups = [];
const powerupTypes = {
    health: { color: '#00ff00', effect: 'health' },
    speed: { color: '#0066ff', effect: 'speed' },
    power: { color: '#ffff00', effect: 'power' }
};

// 키 입력 처리
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // 게임 오버 상태에서 스페이스바로 재시작
    if (gameOver && e.key === ' ') {
        resetGame();
    }

    // 미사일 발사
    const currentTime = Date.now();
    // 미사일 발사
    if (e.key === 'm' && !gameOver && currentTime - lastMissileTime > missileConfig.cooldown) {
        lastMissileTime = currentTime;
        missiles.push({
            x: player.x + player.width / 2 - missileConfig.size / 2,
            y: player.y,
            width: missileConfig.size,
            height: missileConfig.size * 2,
            speed: missileConfig.speed,
            color: missileConfig.color,
            angle: -Math.PI / 2, // 초기 각도는 위쪽을 향함
            target: null
        });
    }
});
document.addEventListener('keyup', (e) => keys[e.key] = false);

// 게임 재시작
function resetGame() {
    gameOver = false;
    score = 0;
    level = 1;
    player.health = 100;
    player.powerLevel = 1;
    player.speed = 6;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    
    // 배열 초기화
    bullets.length = 0;
    enemies.length = 0;
    powerups.length = 0;
    missiles.length = 0;
    
    // UI 업데이트
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('healthValue').textContent = player.health;
}

// 총알 발사
document.addEventListener('keydown', (e) => {
    const currentTime = Date.now();
    if (e.key === ' ' && !gameOver && currentTime - lastShotTime > shootCooldown) {
        lastShotTime = currentTime;
        
        // 파워 레벨에 따른 총알 패턴
        switch(player.powerLevel) {
            case 1:
                bullets.push(createBullet(player.x + player.width / 2));
                break;
            case 2:
                bullets.push(createBullet(player.x + player.width / 3));
                bullets.push(createBullet(player.x + player.width * 2/3));
                break;
            case 3:
                bullets.push(createBullet(player.x + player.width / 2));
                bullets.push(createBullet(player.x + player.width / 4, -1));
                bullets.push(createBullet(player.x + player.width * 3/4, 1));
                break;
        }
    }
});

function createBullet(x, angle = 0) {
    return {
        x: x - bulletSize / 2,
        y: player.y,
        width: bulletSize,
        height: bulletSize,
        speed: bulletSpeed,
        color: '#fff',
        angle: angle
    };
}

// 적기 생성
function spawnEnemy() {
    const spawnRate = 0.02 + (level * 0.005);
    if (Math.random() < spawnRate && !gameOver) {
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = {
            x: Math.random() * (canvas.width - enemySize),
            y: -enemySize,
            width: enemySize,
            height: enemySize,
            speed: type.speed,
            color: type.color,
            health: type.health,
            points: type.points,
            movePattern: Math.floor(Math.random() * 3)
        };
        enemies.push(enemy);
    }

    // 파워업 생성
    if (Math.random() < 0.002) {
        const types = Object.values(powerupTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push({
            x: Math.random() * (canvas.width - 20),
            y: -20,
            width: 20,
            height: 20,
            speed: 1,
            color: type.color,
            effect: type.effect
        });
    }
}

// 충돌 감지
function checkCollisions() {
    // 총알과 적기 충돌
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(bullet, enemy)) {
                bullets.splice(bulletIndex, 1);
                enemy.health--;
                
                // 적기 체력이 0이 되면 제거
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    score += enemy.points;
                    document.getElementById('scoreValue').textContent = score;
                    
                    // 폭발 효과
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                }
            }
        });
    });

    // 플레이어와 적기 충돌
    enemies.forEach((enemy, index) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            player.health -= 20;
            enemies.splice(index, 1);
            document.getElementById('healthValue').textContent = player.health;
            
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    });
}

// 게임 객체 그리기
function draw() {
    // 화면 지우기
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 미사일 그리기
    missiles.forEach(missile => {
        ctx.save();
        ctx.translate(missile.x + missile.width / 2, missile.y + missile.height / 2);
        ctx.rotate(missile.angle + Math.PI / 2);
        
        // 미사일 본체
        ctx.fillStyle = missile.color;
        ctx.beginPath();
        ctx.moveTo(0, -missile.height / 2);
        ctx.lineTo(missile.width / 2, missile.height / 2);
        ctx.lineTo(-missile.width / 2, missile.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // 추적선 효과
        if (missile.target) {
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            const targetRelativeX = missile.target.x + missile.target.width / 2 - (missile.x + missile.width / 2);
            const targetRelativeY = missile.target.y + missile.target.height / 2 - (missile.y + missile.height / 2);
            ctx.moveTo(0, 0);
            ctx.lineTo(targetRelativeX, targetRelativeY);
            ctx.stroke();
        }
        
        ctx.restore();
    });

    // 배경에 별 그리기
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = (Date.now() / 50 + i * 30) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // 플레이어 그리기
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // 엔진 불꽃 효과
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y + player.height);
    ctx.lineTo(player.x + player.width / 3, player.y + player.height + 10);
    ctx.lineTo(player.x + player.width * 2/3, player.y + player.height + 10);
    ctx.closePath();
    ctx.fill();

    // 총알 그리기
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // 적기 그리기
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y);
        ctx.closePath();
        ctx.fill();
    });

    // 파워업 그리기
    powerups.forEach(powerup => {
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, powerup.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // HUD 그리기
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`레벨: ${level}`, canvas.width - 100, 30);

    // 게임오버 메시지
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('게임 오버!', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('스페이스 바를 눌러 재시작', canvas.width / 2, canvas.height / 2 + 50);
    }
}

// 게임 업데이트
function update() {
    if (!gameOver) {
        // 미사일 이동
        missiles.forEach((missile, index) => {
            // 목표가 없거나 목표가 제거된 경우 가장 가까운 적 탐색
            if (!missile.target || !enemies.includes(missile.target)) {
                let closestEnemy = null;
                let minDistance = Infinity;
                
                enemies.forEach(enemy => {
                    const dx = enemy.x + enemy.width / 2 - missile.x;
                    const dy = enemy.y + enemy.height / 2 - missile.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestEnemy = enemy;
                    }
                });
                
                missile.target = closestEnemy;
            }
            
            if (missile.target) {
                // 목표를 향한 각도 계산
                const targetX = missile.target.x + missile.target.width / 2;
                const targetY = missile.target.y + missile.target.height / 2;
                const dx = targetX - missile.x;
                const dy = targetY - missile.y;
                const targetAngle = Math.atan2(dy, dx);
                
                // 현재 각도에서 목표 각도로 부드럽게 회전
                let angleDiff = targetAngle - missile.angle;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                missile.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), missileConfig.rotationSpeed);
                
                // 각도에 따라 이동
                missile.x += Math.cos(missile.angle) * missile.speed;
                missile.y += Math.sin(missile.angle) * missile.speed;
            } else {
                // 목표가 없는 경우 직진
                missile.y -= missile.speed;
            }
            
            // 화면 밖으로 나가면 제거
            if (missile.y < 0 || missile.y > canvas.height || missile.x < 0 || missile.x > canvas.width) {
                missiles.splice(index, 1);
            }
        });
        // 미사일과 적기 충돌 체크
        missiles.forEach((missile, missileIndex) => {
            enemies.forEach((enemy, enemyIndex) => {
                const dx = (missile.x + missile.width / 2) - (enemy.x + enemy.width / 2);
                const dy = (missile.y + missile.height / 2) - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < missileConfig.explosionRadius) {
                    createExplosion(missile.x + missile.width / 2, missile.y);
                    missiles.splice(missileIndex, 1);
                    enemy.health -= missileConfig.damage;
                    
                    if (enemy.health <= 0) {
                        enemies.splice(enemyIndex, 1);
                        score += enemy.points * 2;
                        document.getElementById('scoreValue').textContent = score;
                    }
                    return;
                }
            });
        });
        // 플레이어 이동
        if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
        if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
        if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
        if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
        
        // 총알 이동
        bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            bullet.x += bullet.speed * bullet.angle;
            if (bullet.y < 0 || bullet.x < 0 || bullet.x > canvas.width) {
                bullets.splice(index, 1);
            }
        });
        
        // 적기 이동
        enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed;
            
            // 적기 이동 패턴
            switch(enemy.movePattern) {
                case 0: // 직선 이동
                    break;
                case 1: // 사인파 이동
                    enemy.x += Math.sin(enemy.y / 30) * 2;
                    break;
                case 2: // 지그재그 이동
                    enemy.x += Math.sin(enemy.y / 50) * 4;
                    break;
            }
            
            if (enemy.y > canvas.height) {
                enemies.splice(index, 1);
                player.health -= 10;
                document.getElementById('healthValue').textContent = player.health;
                if (player.health <= 0) gameOver = true;
            }
        });

        // 파워업 이동 및 충돌 체크
        powerups.forEach((powerup, index) => {
            powerup.y += powerup.speed;
            
            // 파워업 획득
            if (checkCollision(player, powerup)) {
                switch(powerup.effect) {
                    case 'health':
                        player.health = Math.min(100, player.health + 20);
                        document.getElementById('healthValue').textContent = player.health;
                        break;
                    case 'speed':
                        player.speed = Math.min(8, player.speed + 1);
                        setTimeout(() => player.speed = Math.max(6, player.speed - 1), 5000);
                        break;
                    case 'power':
                        player.powerLevel = Math.min(3, player.powerLevel + 1);
                        break;
                }
                powerups.splice(index, 1);
            }
            
            if (powerup.y > canvas.height) {
                powerups.splice(index, 1);
            }
        });
        
        // 레벨 업
        if (score >= level * 100) {
            level++;
        }
        
        spawnEnemy();
        checkCollisions();
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 게임 루프
// 폭발 효과 배열
const explosions = [];

function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        radius: 1,
        maxRadius: 20,
        alpha: 1
    });
}

function updateExplosions() {
    explosions.forEach((explosion, index) => {
        explosion.radius += 1;
        explosion.alpha -= 0.05;
        
        if (explosion.alpha <= 0) {
            explosions.splice(index, 1);
        }
    });
}

function drawExplosions() {
    explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 0, ${explosion.alpha})`;
        ctx.fill();
    });
}

function gameLoop() {
    update();
    updateExplosions();
    draw();
    drawExplosions();
    requestAnimationFrame(gameLoop);
}

// 게임 시작
gameLoop();