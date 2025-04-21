// 게임의 주요 변수들
let canvas;
let ctx;
let gameTime = 0;
let score1 = 0;
let score2 = 0;
let isGameOver = false;

// 파워업 타입
const POWERUP_TYPES = {
    SPEED: 'speed',
    DAMAGE: 'damage',
    HEALTH: 'health'
};

// 파워업 아이템 배열
let powerups = [];
const POWERUP_SPAWN_INTERVAL = 15000; // 15초마다 파워업 생성
let lastPowerupSpawn = 0;

// 플레이어 1 설정 (화살표 키)
let car1 = {
    x: 300,
    y: 500,
    width: 40,
    height: 60,
    speed: 0,
    maxSpeed: 8,
    acceleration: 0.2,
    deceleration: 0.1,
    handling: 5,
    color: '#3498db'
};

// 플레이어 2 설정 (WASD 키)
let car2 = {
    x: 500,
    y: 500,
    width: 40,
    height: 60,
    speed: 0,
    maxSpeed: 8,
    acceleration: 0.2,
    deceleration: 0.1,
    handling: 5,
    color: '#e74c3c'
};

// 도로 설정
let road = {
    width: 600,
    leftBoundary: 100,
    rightBoundary: 700,
    stripeWidth: 10,
    stripeHeight: 40,
    stripeGap: 60,
    stripes: [],
    speed: 5
};

// 장애물 배열
let obstacles = [];
const OBSTACLE_SPAWN_INTERVAL = 2000; // 2초마다 장애물 생성
let lastObstacleSpawn = 0;

// 적 타입 정의
const ENEMY_TYPES = {
    NORMAL: 'normal',
    FAST: 'fast',
    TANK: 'tank',
    RANGED: 'ranged'
};

const ENEMY_STATS = {
    [ENEMY_TYPES.NORMAL]: { health: 40, damage: 10, speed: 2, size: 20 },
    [ENEMY_TYPES.FAST]: { health: 25, damage: 8, speed: 3.5, size: 15 },
    [ENEMY_TYPES.TANK]: { health: 80, damage: 15, speed: 1, size: 30 },
    [ENEMY_TYPES.RANGED]: { health: 30, damage: 12, speed: 1.5, size: 20 }
};

// 키 입력 상태
const keys = {
    // 플레이어 1 (화살표 키)
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    // 플레이어 2 (WASD 키)
    w: false,
    s: false,
    a: false,
    d: false
};

// 게임 초기화
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // 이벤트 리스너 설정
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // 초기 도로 스트라이프 생성
    initRoadStripes();

    // 게임 루프 시작
    gameLoop();
}

// 도로 스트라이프 초기화
function initRoadStripes() {
    const totalStripes = Math.ceil(canvas.height / (road.stripeHeight + road.stripeGap)) + 1;
    for (let i = 0; i < totalStripes; i++) {
        road.stripes.push({
            y: i * (road.stripeHeight + road.stripeGap)
        });
    }
}

// 키보드 입력 처리
function handleKeyDown(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
}

function handleKeyUp(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
}

// 자동차 이동 처리
function moveCars() {
    // 플레이어 1 이동
    if (keys.ArrowUp) {
        car1.speed = Math.min(car1.speed + car1.acceleration, car1.maxSpeed);
    } else if (keys.ArrowDown) {
        car1.speed = Math.max(car1.speed - car1.acceleration, -car1.maxSpeed/2);
    } else {
        if (car1.speed > 0) {
            car1.speed = Math.max(0, car1.speed - car1.deceleration);
        } else if (car1.speed < 0) {
            car1.speed = Math.min(0, car1.speed + car1.deceleration);
        }
    }

    if (keys.ArrowLeft && car1.x > road.leftBoundary) {
        car1.x -= car1.handling;
    }
    if (keys.ArrowRight && car1.x < road.rightBoundary - car1.width) {
        car1.x += car1.handling;
    }

    car1.y -= car1.speed;
    car1.y = Math.max(car1.height, Math.min(canvas.height - car1.height, car1.y));

    // 플레이어 2 이동
    if (keys.w) {
        car2.speed = Math.min(car2.speed + car2.acceleration, car2.maxSpeed);
    } else if (keys.s) {
        car2.speed = Math.max(car2.speed - car2.acceleration, -car2.maxSpeed/2);
    } else {
        if (car2.speed > 0) {
            car2.speed = Math.max(0, car2.speed - car2.deceleration);
        } else if (car2.speed < 0) {
            car2.speed = Math.min(0, car2.speed + car2.deceleration);
        }
    }

    if (keys.a && car2.x > road.leftBoundary) {
        car2.x -= car2.handling;
    }
    if (keys.d && car2.x < road.rightBoundary - car2.width) {
        car2.x += car2.handling;
    }

    car2.y -= car2.speed;
    car2.y = Math.max(car2.height, Math.min(canvas.height - car2.height, car2.y));
}

// 파워업 생성
function spawnPowerup() {
    const type = Object.values(POWERUP_TYPES)[Math.floor(Math.random() * Object.values(POWERUP_TYPES).length)];
    const x = road.leftBoundary + Math.random() * (road.width - 30);
    
    powerups.push({
        x: x,
        y: -30,
        width: 30,
        height: 30,
        type: type,
        color: type === POWERUP_TYPES.SPEED ? '#2ecc71' : 
               type === POWERUP_TYPES.DAMAGE ? '#e74c3c' : '#3498db'
    });
}

// 장애물 생성
function spawnObstacle() {
    const obstacleTypes = [
        { width: 60, height: 60, color: '#e74c3c' },  // 큰 장애물
        { width: 40, height: 40, color: '#e67e22' },  // 중간 장애물
        { width: 30, height: 30, color: '#f1c40f' }   // 작은 장애물
    ];

    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const x = road.leftBoundary + Math.random() * (road.width - type.width);

    obstacles.push({
        x: x,
        y: -type.height,
        width: type.width,
        height: type.height,
        color: type.color,
        speed: road.speed * (0.5 + Math.random() * 0.5)
    });
}

// 파워업 생성 함수
function spawnPowerup() {
    const type = Object.values(POWERUP_TYPES)[Math.floor(Math.random() * Object.values(POWERUP_TYPES).length)];
    powerups.push({
        x: Math.random() * (canvas.width - 20) + 10,
        y: Math.random() * (canvas.height - 20) + 10,
        type: type,
        size: 15
    });
}

// 파워업 효과 적용
function applyPowerup(powerup, car) {
    switch(powerup.type) {
        case POWERUP_TYPES.SPEED:
            car.maxSpeed *= 1.5;
            setTimeout(() => car.maxSpeed /= 1.5, 5000); // 5초 동안 지속
            break;
        case POWERUP_TYPES.DAMAGE:
            car.handling *= 1.5;
            setTimeout(() => car.handling /= 1.5, 5000);
            break;
        case POWERUP_TYPES.HEALTH:
            score1 += 50;
            score2 += 50;
            break;
    }
}

// 장애물과 파워업 이동
function moveObstacles() {
    // 장애물 이동
    for (let obstacle of obstacles) {
        obstacle.y += road.speed;
    }
    obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);

    // 파워업 이동
    for (let powerup of powerups) {
        powerup.y += road.speed;
    }
    powerups = powerups.filter(powerup => powerup.y < canvas.height);
}

// 도로 스트라이프 이동
function moveRoadStripes() {
    for (let stripe of road.stripes) {
        stripe.y += road.speed;
        if (stripe.y > canvas.height) {
            stripe.y = -road.stripeHeight;
        }
    }
}

// 충돌 감지
function checkCollisions() {
    // 플레이어 1 충돌 체크
    for (let obstacle of obstacles) {
        if (isColliding(car1, obstacle)) {
            score1 -= 50;
            obstacles = obstacles.filter(o => o !== obstacle);
        }
    }
    for (let powerup of powerups) {
        if (isColliding(car1, powerup)) {
            applyPowerup(powerup, car1);
            powerups = powerups.filter(p => p !== powerup);
        }
    }

    // 플레이어 2 충돌 체크
    for (let obstacle of obstacles) {
        if (isColliding(car2, obstacle)) {
            score2 -= 50;
            obstacles = obstacles.filter(o => o !== obstacle);
        }
    }
    for (let powerup of powerups) {
        if (isColliding(car2, powerup)) {
            applyPowerup(powerup, car2);
            powerups = powerups.filter(p => p !== powerup);
        }
    }

        // 장애물이 화면 밖으로 나가면 두 플레이어 모두 점수 획득
        if (obstacle.y > canvas.height) {
            score1 += 10;
            score2 += 10;
        }
    }
}

// 게임 오버
function gameOver() {
    isGameOver = true;
    document.querySelector('.game-over').style.display = 'block';
}

// 게임 리셋
function resetGame() {
    // 플레이어 1 리셋
    car1.x = 300;
    car1.y = 500;
    car1.speed = 0;
    
    // 플레이어 2 리셋
    car2.x = 500;
    car2.y = 500;
    car2.speed = 0;
    
    obstacles = [];
    score1 = 0;
    score2 = 0;
    isGameOver = false;
    gameTime = 0;
    document.querySelector('.game-over').style.display = 'none';
}

// 게임 화면 그리기
function draw() {
    // 배경 그리기
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 도로 그리기
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(road.leftBoundary, 0, road.width, canvas.height);

    // 도로 스트라이프 그리기
    ctx.fillStyle = '#ffffff';
    for (let stripe of road.stripes) {
        ctx.fillRect(
            canvas.width/2 - road.stripeWidth/2,
            stripe.y,
            road.stripeWidth,
            road.stripeHeight
        );
    }

    // 플레이어 1 자동차 그리기
    ctx.fillStyle = car1.color;
    ctx.fillRect(car1.x, car1.y, car1.width, car1.height);

    // 플레이어 2 자동차 그리기
    ctx.fillStyle = car2.color;
    ctx.fillRect(car2.x, car2.y, car2.width, car2.height);

    // 장애물 그리기
    for (let obstacle of obstacles) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // UI 업데이트
    document.getElementById('score').textContent = `점수: ${score}`;
}

// 게임 루프
function gameLoop() {
    if (!isGameOver) {
        const currentTime = Date.now();
        gameTime += 16; // 약 60FPS 기준

        // 장애물 생성
        if (currentTime - lastObstacleSpawn > OBSTACLE_SPAWN_INTERVAL) {
            spawnObstacle();
            lastObstacleSpawn = currentTime;
        }

        // 파워업 생성
        if (currentTime - lastPowerupSpawn > POWERUP_SPAWN_INTERVAL) {
            spawnPowerup();
            lastPowerupSpawn = currentTime;
        }

        moveCars();
        moveObstacles();
        moveRoadStripes();
        checkCollisions();
        draw();

        // 점수 업데이트
        document.getElementById('score1').textContent = `플레이어 1 점수: ${score1}`;
        document.getElementById('score2').textContent = `플레이어 2 점수: ${score2}`;
    }
    requestAnimationFrame(gameLoop);
}

// 페이지 로드 시 게임 시작
window.onload = initGame;