// 게임 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 게임 상태
let gameOver = false;
let score = 0;

// 플레이어 설정
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 5,
    health: 100,
    color: '#00ff00'
};

// 총알 배열
const bullets = [];
const bulletSpeed = 7;
const bulletSize = 5;

// 적기 배열
const enemies = [];
const enemySize = 40;
const enemySpeed = 2;

// 키 입력 처리
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// 총알 발사
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !gameOver) {
        bullets.push({
            x: player.x + player.width / 2 - bulletSize / 2,
            y: player.y,
            width: bulletSize,
            height: bulletSize,
            speed: bulletSpeed,
            color: '#fff'
        });
    }
});

// 적기 생성
function spawnEnemy() {
    if (Math.random() < 0.02 && !gameOver) {
        enemies.push({
            x: Math.random() * (canvas.width - enemySize),
            y: -enemySize,
            width: enemySize,
            height: enemySize,
            speed: enemySpeed,
            color: '#ff0000'
        });
    }
}

// 충돌 감지
function checkCollisions() {
    // 총알과 적기 충돌
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                score += 10;
                document.getElementById('scoreValue').textContent = score;
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

    // 플레이어 그리기
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // 총알 그리기
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // 적기 그리기
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // 게임오버 메시지
    if (gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('게임 오버!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    }
}

// 게임 업데이트
function update() {
    if (!gameOver) {
        // 플레이어 이동
        if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
        if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
        
        // 총알 이동
        bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            if (bullet.y < 0) bullets.splice(index, 1);
        });
        
        // 적기 이동
        enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed;
            if (enemy.y > canvas.height) {
                enemies.splice(index, 1);
                player.health -= 10;
                document.getElementById('healthValue').textContent = player.health;
                if (player.health <= 0) gameOver = true;
            }
        });
        
        spawnEnemy();
        checkCollisions();
    }
}

// 게임 루프
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 게임 시작
gameLoop();