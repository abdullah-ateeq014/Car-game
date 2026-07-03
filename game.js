const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const bestScoreElement = document.getElementById("best-score");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const installBtn = document.getElementById("install-btn");
const gameOverModal = document.getElementById("game-over-modal");
const restartBtn = document.getElementById("restart-btn");
const installPrompt = document.getElementById("install-prompt");

// Grid and game dimensions
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Game state variables
let car = [{ x: 10, y: 10 }];
let traffic = [];
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let level = 1;
let bestScore = localStorage.getItem("carGameBestScore") || 0;
let gameRunning = false;
let gamePaused = false;
let gameInterval;
let gameSpeed = 100;
let trafficSpeed = 0;
let trafficSpeedCounter = 0;

// Load best score
bestScoreElement.textContent = bestScore;

// Install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.classList.remove("hidden");
    installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installPrompt.classList.add("hidden");
        installBtn.classList.add("hidden");
    }
});

// Keyboard controls
document.addEventListener("keydown", changeDirection);

// Button controls
startBtn.addEventListener("click", () => {
    if (!gameRunning) {
        startGame();
    }
});

pauseBtn.addEventListener("click", () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? "▶ Resume" : "⏸ Pause";
    }
});

restartBtn.addEventListener("click", () => {
    gameOverModal.classList.remove("show");
    startGame();
});

function startGame() {
    car = [{ x: 10, y: 10 }];
    traffic = [];
    dx = 0;
    dy = 0;
    nextDx = 0;
    nextDy = 0;
    score = 0;
    level = 1;
    gameRunning = true;
    gamePaused = false;
    gameSpeed = 100;
    trafficSpeed = 30;
    trafficSpeedCounter = 0;

    scoreElement.textContent = score;
    levelElement.textContent = level;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = "⏸ Pause";

    generateTraffic();
    gameLoop();
}

function gameLoop() {
    if (!gamePaused) {
        update();
    }
    draw();

    if (gameRunning) {
        gameInterval = setTimeout(gameLoop, gameSpeed);
    }
}

function update() {
    if (!gameRunning) return;

    // Update car direction
    dx = nextDx;
    dy = nextDy;

    // Calculate new head position
    const head = { x: car[0].x + dx, y: car[0].y + dy };

    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame("You hit the wall!");
        return;
    }

    // Check self collision
    if (car.some((part, i) => i > 0 && part.x === head.x && part.y === head.y)) {
        endGame("You hit yourself!");
        return;
    }

    car.unshift(head);
    car.pop();

    // Update traffic
    trafficSpeedCounter++;
    if (trafficSpeedCounter >= trafficSpeed) {
        trafficSpeedCounter = 0;
        traffic.forEach((t) => {
            t.y += 1;
        });
        traffic = traffic.filter((t) => t.y < tileCount);

        // Check collision with traffic
        traffic.forEach((t) => {
            if (car[0].x === t.x && car[0].y === t.y) {
                endGame("You crashed into traffic!");
            }
        });

        // Generate new traffic
        if (Math.random() < 0.3) {
            generateTraffic();
        }

        score += 10;
        scoreElement.textContent = score;

        // Level up
        if (score % 100 === 0 && score > 0) {
            level = Math.floor(score / 100) + 1;
            levelElement.textContent = level;
            gameSpeed = Math.max(50, 100 - level * 5);
            trafficSpeed = Math.max(10, 30 - level * 2);
        }
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (optional)
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw car
    car.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#81c784" : "#4caf50";
        ctx.fillRect(
            part.x * gridSize + 2,
            part.y * gridSize + 2,
            gridSize - 4,
            gridSize - 4
        );
    });

    // Draw traffic
    traffic.forEach((t) => {
        ctx.fillStyle = "#f44336";
        ctx.fillRect(
            t.x * gridSize + 2,
            t.y * gridSize + 2,
            gridSize - 4,
            gridSize - 4
        );
    });

    // Draw pause overlay
    if (gamePaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }
}

function changeDirection(event) {
    const key = event.key.toLowerCase();
    const isMoving = dx !== 0 || dy !== 0;

    switch (key) {
        case "arrowleft":
        case "a":
            if (dx === 0) {
                nextDx = -1;
                nextDy = 0;
            }
            event.preventDefault();
            break;
        case "arrowup":
        case "w":
            if (dy === 0) {
                nextDx = 0;
                nextDy = -1;
            }
            event.preventDefault();
            break;
        case "arrowright":
        case "d":
            if (dx === 0) {
                nextDx = 1;
                nextDy = 0;
            }
            event.preventDefault();
            break;
        case "arrowdown":
        case "s":
            if (dy === 0) {
                nextDx = 0;
                nextDy = 1;
            }
            event.preventDefault();
            break;
        case " ":
            pauseBtn.click();
            event.preventDefault();
            break;
    }
}

function generateTraffic() {
    const x = Math.floor(Math.random() * tileCount);
    traffic.push({ x: x, y: -1 });
}

function endGame(reason) {
    gameRunning = false;
    clearTimeout(gameInterval);

    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("carGameBestScore", bestScore);
        bestScoreElement.textContent = bestScore;
    }

    // Show game over modal
    document.getElementById("game-over-reason").textContent = reason;
    document.getElementById("final-score").textContent = score;

    const beatMessage = score > parseInt(localStorage.getItem("carGamePrevScore") || 0) 
        ? "🎉 New Personal Best!" 
        : "";
    document.getElementById("best-beat").textContent = beatMessage;

    localStorage.setItem("carGamePrevScore", score);

    gameOverModal.classList.add("show");

    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Initialize
bestScoreElement.textContent = bestScore;
draw();