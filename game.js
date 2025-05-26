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
let lastSpaceTime = 0;
const shootCooldown = 200; // 발사 쿨다운 (밀리초)
const doubleSpaceDelay = 300; // 연속 스페이스바 입력 감지 시간 (밀리초)

// 레이저 시스템
let lastLaserTime = 0;
const laserCooldown = 10000; // 레이저 쿨다운 (10초)
const laserDuration = 2000; // 레이저 지속시간 (2초)

// 폭탄 시스템
let lastBombTime = 0;
const bombConfig = {
    cooldown: 5000, // 폭탄 쿨다운 (5초)
    speed: 5, // 폭탄 이동 속도
    size: 15, // 폭탄 크기
    explosionRadius: 150, // 폭발 범위
    damage: 50, // 폭발 데미지
    color: '#ff9900' // 폭탄 색상
};
const bombs = []; // 폭탄 배열

// 필살기 시스템
let ultimateGauge = 0;
const ultimateMaxGauge = 100;
let ultimateActive = false;
let lastUltimateTime = 0;
const ultimateDuration = 3000; // 필살기 지속시간 (밀리초)

// 보스 설정
const bossConfig = {
    width: 120,
    height: 120,
    health: 150,
    maxHealth: 150,
    speed: 2,
    points: 2000,
    color: '#ff0000',
    attackCooldown: 1200,
    bulletSpeed: 4,
    bulletSize: 12,
    spawnInterval: 30000, // 보스 생성 간격 (30초)
    laserWidth: 30,
    laserDamage: 20,
    phase2Threshold: 0.3, // 2페이즈 진입 체력 비율
    spawnDelay: 3000 // 보스 경고 메시지 표시 시간 (3초)
};
let lastBossSpawnTime = 0; // 마지막 보스 생성 시간
let boss = null;
let bossLastAttack = 0;
let bossWarningTimer = null;

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
let spaceKeyPressCount = 0;
let lastSpaceKeyTime = 0;
const spaceKeyTimeThreshold = 500; // 3연타 판정 시간 (밀리초)

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // 게임 오버 상태에서 스페이스바로 재시작
    if (gameOver && e.key === ' ') {
        resetGame();
    }

    // 스페이스바 3연타로 폭탄 발사
    if (e.key === ' ' && !gameOver) {
        const currentTime = Date.now();
        if (currentTime - lastSpaceKeyTime <= spaceKeyTimeThreshold) {
            spaceKeyPressCount++;
            if (spaceKeyPressCount >= 3 && currentTime - lastBombTime >= bombConfig.cooldown) {
                lastBombTime = currentTime;
                bombs.push({
                    x: player.x + player.width / 2 - bombConfig.size / 2,
                    y: player.y,
                    width: bombConfig.size,
                    height: bombConfig.size,
                    speed: bombConfig.speed,
                    color: bombConfig.color,
                    exploded: false
                });
                spaceKeyPressCount = 0;
            }
        } else {
            spaceKeyPressCount = 1;
        }
        lastSpaceKeyTime = currentTime;
    }

    // 스페이스바 연속 입력 감지
    const currentTime = Date.now();
    if (e.key === ' ' && !gameOver) {
        if (currentTime - lastSpaceTime < doubleSpaceDelay) {
            // 연속 스페이스바 입력 감지됨 - 미사일 발사
            if (currentTime - lastMissileTime > missileConfig.cooldown) {
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
        }
        lastSpaceTime = currentTime;
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
    bombs.length = 0;
    boss = null;
    bossWarningTimer = null;
    lastLaserTime = 0;
    lastBossSpawnTime = 0;
    
    // UI 업데이트
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('healthValue').textContent = player.health;
}

// 레이저 공격 설정
let isSpacePressed = false;
let spaceHoldStartTime = 0;
const laserChargeTime = 500; // 레이저 충전 시간 (밀리초)
const laserConfig = {
    width: 30,
    damage: 3,
    color: '#00ffff'
};

// 총알 발사와 필살기
document.addEventListener('keydown', (e) => {
    const currentTime = Date.now();
    if (e.key === 'z' && !gameOver && ultimateGauge >= ultimateMaxGauge) {
        // 필살기 발동
        ultimateActive = true;
        ultimateGauge = 0;
        lastUltimateTime = currentTime;
    } else if (e.key === ' ' && !gameOver && !isSpacePressed) {
        isSpacePressed = true;
        spaceHoldStartTime = currentTime;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
        isSpacePressed = false;
        const currentTime = Date.now();
        
        // 스페이스바를 짧게 눌렀을 때는 일반 총알 발사
        if (currentTime - spaceHoldStartTime < laserChargeTime) {
            if (currentTime - lastShotTime > shootCooldown) {
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
        if (bullet.isLaser) {
            // 레이저와 적기 충돌
            enemies.forEach((enemy, enemyIndex) => {
                if (enemy.x + enemy.width >= bullet.x && enemy.x <= bullet.x + bullet.width) {
                    enemy.health -= bullet.damage;
                    if (enemy.health <= 0) {
                        enemies.splice(enemyIndex, 1);
                        score += enemy.points;
                        document.getElementById('scoreValue').textContent = score;
                        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    }
                }
            });
            // 레이저와 보스 충돌
            if (boss && boss.x + boss.width >= bullet.x && boss.x <= bullet.x + bullet.width) {
                boss.health -= bullet.damage;
                createExplosion(bullet.x + bullet.width/2, boss.y + boss.height/2);
                if (boss.health <= 0) {
                    score += bossConfig.points;
                    document.getElementById('scoreValue').textContent = score;
                    createExplosion(boss.x + boss.width/2, boss.y + boss.height/2);
                    boss = null;
                }
            }
        } else {
            // 일반 총알과 적기 충돌
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
        }
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

    // 화면 흔들림 효과 적용
    if (screenShake.active) {
        const dx = Math.random() * screenShake.intensity * 2 - screenShake.intensity;
        const dy = Math.random() * screenShake.intensity * 2 - screenShake.intensity;
        ctx.setTransform(1, 0, 0, 1, dx, dy);
    }

    // 필살기 게이지 그리기
    const gaugeWidth = 200;
    const gaugeHeight = 10;
    const gaugePercentage = ultimateGauge / ultimateMaxGauge;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(10, canvas.height - 30, gaugeWidth, gaugeHeight);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(10, canvas.height - 30, gaugeWidth * gaugePercentage, gaugeHeight);
    
    // 필살기 이펙트
    if (ultimateActive) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 레이저 빔 그리기
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x + player.width / 2, 0);
        ctx.stroke();
        
        // 레이저 데미지 적용
        enemies.forEach((enemy, index) => {
            if (Math.abs(enemy.x + enemy.width/2 - (player.x + player.width/2)) < 30) {
                enemy.health -= 5;
                if (enemy.health <= 0) {
                    enemies.splice(index, 1);
                    score += enemy.points;
                    document.getElementById('scoreValue').textContent = score;
                    createExplosion(enemy.x + enemy.width/2, enemy.y);
                }
            }
        });
        
        // 필살기 시간 체크
        if (Date.now() - lastUltimateTime > ultimateDuration) {
            ultimateActive = false;
        }
    }

    // 보스 경고 메시지
    if (bossWarningTimer !== null) {
        const alpha = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ 보스 등장 ⚠', canvas.width / 2, canvas.height / 2);
    }

    // 보스 그리기
    if (boss) {
        // 보스 체력바
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthPercentage = boss.health / bossConfig.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width/2 - healthBarWidth/2, 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(canvas.width/2 - healthBarWidth/2, 10, healthBarWidth * healthPercentage, healthBarHeight);
        
        // 보스 본체
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.moveTo(boss.x + boss.width/2, boss.y);
        ctx.lineTo(boss.x + boss.width, boss.y + boss.height);
        ctx.lineTo(boss.x, boss.y + boss.height);
        ctx.closePath();
        ctx.fill();
    }

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

    // 폭탄 그리기
    bombs.forEach(bomb => {
        // 폭탄 본체
        ctx.fillStyle = bomb.color;
        ctx.beginPath();
        ctx.arc(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, bomb.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // 폭발 범위 표시 (반투명 원)
        ctx.fillStyle = 'rgba(255, 153, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, bombConfig.explosionRadius, 0, Math.PI * 2);
        ctx.fill();
    });

    // 총알 그리기
    bullets.forEach(bullet => {
        if (bullet.isLaser) {
            // 레이저 빔 그리기
            ctx.fillStyle = bullet.color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(bullet.x, bullet.y + bullet.height, bullet.width, -bullet.height);
            
            // 레이저 충돌 효과
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bullet.x, bullet.y);
            ctx.lineTo(bullet.x + bullet.width, bullet.y);
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
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

    // 폭탄 쿨다운 표시
    const currentTime = Date.now();
    if (currentTime - lastBombTime < bombConfig.cooldown) {
        const bombCooldownPercentage = 1 - ((currentTime - lastBombTime) / bombConfig.cooldown);
        ctx.fillStyle = '#333';
        ctx.fillRect(10, canvas.height - 70, 200, 10);
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(10, canvas.height - 70, 200 * bombCooldownPercentage, 10);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('폭탄 쿨다운', 10, canvas.height - 80);
    }

    // 레이저 쿨다운 표시
    if (currentTime - lastLaserTime < laserCooldown) {
        const cooldownPercentage = 1 - ((currentTime - lastLaserTime) / laserCooldown);
        ctx.fillStyle = '#333';
        ctx.fillRect(10, canvas.height - 50, 200, 10);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(10, canvas.height - 50, 200 * cooldownPercentage, 10);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('레이저 쿨다운', 10, canvas.height - 60);
    }

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
function spawnBoss() {
    const currentTime = Date.now();
    if (!gameOver && boss === null && (currentTime - lastBossSpawnTime >= bossConfig.spawnInterval || lastBossSpawnTime === 0)) {
        bossWarningTimer = setTimeout(() => {
            boss = {
                x: canvas.width / 2 - bossConfig.width / 2,
                y: -bossConfig.height,
                width: bossConfig.width,
                height: bossConfig.height,
                health: bossConfig.health,
                speed: bossConfig.speed,
                color: bossConfig.color,
                pattern: 0,
                direction: 1,
                hitCount: 0 // 보스가 맞은 횟수를 추적하는 카운터 추가
            };
            bossWarningTimer = null;
            lastBossSpawnTime = currentTime;
        }, bossConfig.spawnDelay);
    }
}

function updateBoss() {
    if (boss) {
        // 보스 이동 패턴
        if (boss.y < 50) {
            boss.y += boss.speed;
        } else {
            if (boss.health / bossConfig.maxHealth > bossConfig.phase2Threshold) {
                // 1페이즈: 좌우 이동
                boss.x += boss.speed * boss.direction;
                if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
                    boss.direction *= -1;
                }
            } else {
                // 2페이즈: 대각선 이동
                boss.x += boss.speed * 1.5 * boss.direction;
                boss.y += Math.sin(Date.now() / 1000) * boss.speed;
                if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
                    boss.direction *= -1;
                }
                if (boss.y < 50 || boss.y > 150) {
                    boss.y = boss.y < 50 ? 50 : 150;
                }
            }
        }

        // 보스 공격
        const currentTime = Date.now();
        if (currentTime - bossLastAttack > bossConfig.attackCooldown) {
            bossLastAttack = currentTime;
            
            if (boss.health / bossConfig.maxHealth > bossConfig.phase2Threshold) {
                // 1페이즈: 8방향 탄막
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8;
                    bullets.push({
                        x: boss.x + boss.width/2,
                        y: boss.y + boss.height/2,
                        width: bossConfig.bulletSize,
                        height: bossConfig.bulletSize,
                        speed: bossConfig.bulletSpeed,
                        color: '#ff3300',
                        angle: angle,
                        fromBoss: true
                    });
                }
            } else {
                // 2페이즈: 레이저 + 유도 미사일
                // 레이저 공격
                const laserAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                bullets.push({
                    x: boss.x + boss.width/2,
                    y: boss.y + boss.height/2,
                    width: bossConfig.laserWidth,
                    height: canvas.height,
                    speed: 0,
                    color: '#ff0066',
                    angle: laserAngle,
                    fromBoss: true,
                    isLaser: true,
                    createTime: Date.now()
                });
                
                // 유도 미사일 발사
                for (let i = 0; i < 3; i++) {
                    const angle = laserAngle + (Math.PI / 6) * (i - 1);
                    bullets.push({
                        x: boss.x + boss.width/2,
                        y: boss.y + boss.height/2,
                        width: bossConfig.bulletSize * 1.5,
                        height: bossConfig.bulletSize * 1.5,
                        speed: bossConfig.bulletSpeed * 0.8,
                        color: '#ffff00',
                        angle: angle,
                        fromBoss: true,
                        isHoming: true,
                        targetX: player.x,
                        targetY: player.y
                    });
                }
            }
        }

        // 보스와 플레이어 총알/필살기 충돌 체크
        bullets.forEach((bullet, index) => {
            if (!bullet.fromBoss && checkCollision(bullet, boss)) {
                bullets.splice(index, 1);
                const damage = bullet.isUltimate ? 10 : 1;
                boss.hitCount++; // 보스가 맞은 횟수 증가
                boss.health -= damage;
                createExplosion(bullet.x, bullet.y);

                // 100번째 공격이거나 체력이 0 이하일 때 보스 파괴
                if (boss.hitCount >= 100 || boss.health <= 0) {
                    score += bossConfig.points;
                    document.getElementById('scoreValue').textContent = score;
                    createExplosion(boss.x + boss.width/2, boss.y + boss.height/2);
                    
                    // 특별 파워업 드롭
                    powerups.push({
                        x: boss.x + boss.width/2,
                        y: boss.y + boss.height/2,
                        width: 30,
                        height: 30,
                        speed: 1,
                        color: '#ffff00',
                        effect: 'power'
                    });
                    
                    boss = null;
                }
            }
        });

        // 보스 총알과 플레이어 충돌 체크
        bullets.forEach((bullet, index) => {
            if (bullet.fromBoss && checkCollision(bullet, player)) {
                bullets.splice(index, 1);
                player.health -= 10;
                document.getElementById('healthValue').textContent = player.health;
                createExplosion(bullet.x, bullet.y);

                if (player.health <= 0) {
                    gameOver = true;
                }
            }
        });
    }
}

// 화면 흔들림 효과 변수
let screenShake = {
    active: false,
    intensity: 0,
    duration: 0,
    startTime: 0
};

function update() {
    if (!gameOver) {
        // 레이저 공격 처리
        const currentTime = Date.now();
        if (isSpacePressed && currentTime - spaceHoldStartTime >= laserChargeTime && currentTime - lastLaserTime >= laserCooldown) {
            // 레이저 공격 생성
            lastLaserTime = currentTime;
            bullets.push({
                x: player.x + player.width / 2 - laserConfig.width / 2,
                y: player.y,
                width: laserConfig.width,
                height: -player.y, // 화면 상단까지
                speed: 0,
                color: laserConfig.color,
                isLaser: true,
                damage: laserConfig.damage,
                createTime: currentTime
            });
        }
        spawnBoss();
        if (boss) {
            updateBoss();
        }
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
            if (bullet.isLaser) {
                if (Date.now() - bullet.createTime > 1000) {
                    bullets.splice(index, 1);
                }
            } else if (bullet.isHoming) {
                const dx = bullet.targetX - bullet.x;
                const dy = bullet.targetY - bullet.y;
                const angle = Math.atan2(dy, dx);
                bullet.x += Math.cos(angle) * bullet.speed;
                bullet.y += Math.sin(angle) * bullet.speed;
            } else {
                bullet.y -= bullet.speed;
                bullet.x += bullet.speed * bullet.angle;
            }
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
        
        // 폭탄 업데이트
        bombs.forEach((bomb, bombIndex) => {
            if (!bomb.exploded) {
                bomb.y += bomb.speed;
                
                // 화면 바닥에 닿으면 폭발
                if (bomb.y > canvas.height - bomb.height) {
                    // 적의 30%만 무작위로 제거
                    const enemiesToRemove = Math.floor(enemies.length * 0.3);
                    const shuffledEnemies = enemies.slice().sort(() => Math.random() - 0.5);
                    
                    for (let i = 0; i < enemiesToRemove; i++) {
                        const enemyIndex = enemies.indexOf(shuffledEnemies[i]);
                        if (enemyIndex !== -1) {
                            score += shuffledEnemies[i].points;
                            createExplosion(shuffledEnemies[i].x + shuffledEnemies[i].width/2, shuffledEnemies[i].y + shuffledEnemies[i].height/2);
                            enemies.splice(enemyIndex, 1);
                        }
                    }
                    document.getElementById('scoreValue').textContent = score;
                    
                    // 화면 전체에 폭발 효과
                    createExplosion(canvas.width/2, canvas.height/2);
                    createExplosion(canvas.width/4, canvas.height/2);
                    createExplosion(canvas.width*3/4, canvas.height/2);
                    
                    bombs.splice(bombIndex, 1);
                }
            }
        });

        spawnEnemy();
        checkCollisions();
    }

    // 화면 흔들림 효과 업데이트
    if (screenShake.active) {
        const elapsed = Date.now() - screenShake.startTime;
        if (elapsed > screenShake.duration) {
            screenShake.active = false;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}

// 폭탄 폭발 효과 생성
function createBombExplosion(bomb) {
    // 화면 흔들림 효과 시작
    screenShake.active = true;
    screenShake.intensity = 10;
    screenShake.duration = 500;
    screenShake.startTime = Date.now();

    // 폭발 범위 내의 적에게 데미지
    enemies.forEach((enemy, enemyIndex) => {
        const dx = (bomb.x + bomb.width / 2) - (enemy.x + enemy.width / 2);
        const dy = (bomb.y + bomb.height / 2) - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bombConfig.explosionRadius) {
            enemy.health -= bombConfig.damage;
            if (enemy.health <= 0) {
                enemies.splice(enemyIndex, 1);
                score += enemy.points * 2;
                document.getElementById('scoreValue').textContent = score;
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            }
        }
    });

    // 보스에게 데미지
    if (boss) {
        const dx = (bomb.x + bomb.width / 2) - (boss.x + boss.width / 2);
        const dy = (bomb.y + bomb.height / 2) - (boss.y + boss.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bombConfig.explosionRadius) {
            boss.health -= bombConfig.damage / 2;
            if (boss.health <= 0) {
                score += bossConfig.points;
                document.getElementById('scoreValue').textContent = score;
                createExplosion(boss.x + boss.width/2, boss.y + boss.height/2);
                boss = null;
            }
        }
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
