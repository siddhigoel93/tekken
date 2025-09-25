// ---- Setup ----
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;

let showReplay = false;
let isGameStarted = false;
let isGameOver = false;

const attackSound = new Audio('resources/sounds/video-game-sword-swing-sfx-409364.mp3');
const hitSound = new Audio('resources/sounds/mixkit-samurai-sword-impact-2789.wav');
const gameOverSound = new Audio('resources/sounds/ko-95973.mp3');
const bgMusic = new Audio('resources/sounds/fighting-battle-warrior-drums-395016.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

const gravity = 0.7;

// ---- Classes ----
class Sprite {
    constructor({ position, imageSrc, scale = 1, framesMax = 1, offset = { x: 0, y: 0 } }) {
        this.position = position;
        this.width = 50;
        this.height = 150;
        this.image = new Image();
        this.image.src = imageSrc;
        this.scale = scale;
        this.framesMax = framesMax;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 5;
        this.offset = offset;
        this.facingRight = true;
    }

    draw() {
        if (!this.image.complete || this.image.naturalWidth === 0) return;

        ctx.save();
        // flip if facing left
        if (!this.facingRight) {
            ctx.translate(this.position.x + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(this.position.x + this.width / 2), 0);
        }

        ctx.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesMax),
            0,
            this.image.width / this.framesMax,
            this.image.height,
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            (this.image.width / this.framesMax) * this.scale,
            this.image.height * this.scale
        );
        ctx.restore();
    }

    animation() {
        this.framesElapsed++;
        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++;
            } else {
                // animation finished — wrap to 0
                this.framesCurrent = 0;
                // if this was an attacking animation, reset attack flags if present
                if (this.isAttacking) {
                    this.isAttacking = false;
                }
                if (this.attackHitDone !== undefined) {
                    this.attackHitDone = false;
                }
            }
        }
    }

    update() {
        this.draw();
        this.animation();
    }
}

class Fighter extends Sprite {
    constructor({
        position,
        velocity,
        color = 'red',
        imageSrc,
        scale = 1,
        framesMax = 1,
        offset = { x: 0, y: 0 },
        sprites,
        attackBox = { offset: {}, width: undefined, height: undefined },
        attackFrame = 0
    }) {
        super({ position, imageSrc, scale, framesMax, offset });
        this.velocity = velocity;
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: attackBox.offset,
            width: attackBox.width,
            height: attackBox.height
        };
        this.color = color;
        this.isAttacking = false;
        this.attackHitDone = false; // ensures one hit per attack
        this.attackCooldown = 0; // frames until can attack again
        this.attackFrame = attackFrame; // frame index where hit should be applied
        this.health = 100;
        this.sprites = sprites || {};
        this.dead = false;
        this.facingRight = true;

        for (const sprite in this.sprites) {
            this.sprites[sprite].image = new Image();
            this.sprites[sprite].image.src = this.sprites[sprite].imageSrc;
        }

        this.camerabox = { position: { x: this.position.x, y: this.position.y }, width: 50, height: 80 };
    }

    updateCamerabox() {
        this.camerabox = {
            position: { x: this.position.x - 320, y: this.position.y - 260 },
            width: (2 * canvas.width) / 3,
            height: (2 * canvas.height) / 3
        };
    }

    leftPanning({ canvas, camera }) {
        const cameraboxRightSide = this.camerabox.position.x + this.camerabox.width;
        if (cameraboxRightSide >= canvas.width) return;
        if (cameraboxRightSide >= scaledCanvas.width + Math.abs(camera.position.x)) {
            camera.position.x -= this.velocity.x;
        }
    }

    rightPanning({ canvas, camera }) {
        if (this.camerabox.position.x <= 0) return;
        if (this.camerabox.position.x <= Math.abs(camera.position.x)) {
            camera.position.x -= this.velocity.x;
        }
    }

    update() {
        // draw and animate (unless dead - death animation keeps playing)
        this.draw();
        if (!this.dead) this.animation();

        // update attackBox position
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

        // camerabox
        this.updateCamerabox();

        // physics
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        const groundY = canvas.height - 96;
        if (this.position.y + this.height >= groundY) {
            this.velocity.y = 0;
            this.position.y = groundY - this.height;
        } else {
            this.velocity.y += gravity;
        }

        // bounds
        if (this.position.x <= 0 || this.position.x + (this.attackBox.width || this.width) >= canvas.width) {
            this.velocity.x = 0;
        }

        // cooldown decrement
        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    attack() {
        if (this.isAttacking || this.dead || this.attackCooldown > 0) return;
        this.switchSprite('attack1');
        this.isAttacking = true;
        this.attackHitDone = false;
        // set a cooldown to avoid spamming (will still be reset when animation ends or by AI)
        this.attackCooldown = 0; // for player, maybe 0; AI sets its cooldown externally
        attackSound.currentTime = 0;
        attackSound.play();
    }

    takeHit() {
        if (this.dead) return;
        this.health -= 10;
        hitSound.currentTime = 0;
        hitSound.play();
        if (this.health <= 0) {
            this.switchSprite('death');
        } else {
            // allow takeHit to interrupt non-attack animations
            this.switchSprite('takeHit');
        }
    }

    switchSprite(sprite) {
        // If currently in death sprite and finished, remain dead
        if (this.image === this.sprites.death.image) {
            if (this.framesCurrent === this.sprites.death.framesMax - 1) {
                this.dead = true;
            }
            return;
        }

        // Allow takeHit to interrupt idle/run/fall/jump but not attack1
        if (sprite === 'takeHit' && this.image !== this.sprites.death.image && this.image !== this.sprites.attack1.image) {
            this.image = this.sprites.takeHit.image;
            this.framesMax = this.sprites.takeHit.framesMax;
            this.framesCurrent = 0;
            return;
        }

        // Prevent switching from attack mid-animation
        if (this.image === this.sprites.attack1.image && this.framesCurrent < this.sprites.attack1.framesMax - 1) return;

        // Standard switching
        if (this.sprites[sprite] && this.image !== this.sprites[sprite].image) {
            this.image = this.sprites[sprite].image;
            this.framesMax = this.sprites[sprite].framesMax;
            this.framesCurrent = 0;
        }

        // If switching to death, mark it so switchSprite blocks further changes until finished
        if (sprite === 'death') {
            this.dead = false; // will be set true when death animation completes
        }
    }
}

// ---------------- Collision ----------------
function collision({ char1, char2 }) {
    return (
        char1.attackBox.position.x + char1.attackBox.width >= char2.position.x &&
        char1.attackBox.position.x <= char2.position.x + char2.width &&
        char1.attackBox.position.y + char1.attackBox.height >= char2.position.y &&
        char1.attackBox.position.y <= char2.position.y + char2.height
    );
}

// ---------------- Results ----------------
function determineResults({ player, enemy, timerId }) {
    clearTimeout(timerId);
    isGameOver = true;
    let result = '';
    if (player.health === enemy.health) result = 'Tie!';
    else if (player.health > enemy.health) result = 'You Won!';
    else result = 'You Lost!';
    bgMusic.pause();
    bgMusic.currentTime = 0;
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    showReplay = true;
    drawEndScreen(result);
}

// ---------------- Background & camera ----------------
const background = new Sprite({ position: { x: 0, y: 0 }, imageSrc: 'resources/bg-1.jpg' });
const scaledCanvas = { height: canvas.height, width: canvas.width / 1.3 };
const camera = { position: { x: 0, y: -618 + scaledCanvas.height } };

// ---------------- Player & Enemy (with attackFrame and AI cooldown defaults) ----------------
const player = new Fighter({
    position: { x: 200, y: 0 },
    velocity: { x: 0, y: 0 },
    imageSrc: 'resources/Idle.png',
    framesMax: 8,
    scale: 2.5,
    offset: { x: 215, y: 65 },
    sprites: {
        idle: { imageSrc: 'resources/Idle.png', framesMax: 8 },
        run: { imageSrc: 'resources/Run.png', framesMax: 8 },
        jump: { imageSrc: 'resources/Jump.png', framesMax: 2 },
        fall: { imageSrc: 'resources/Fall.png', framesMax: 2 },
        attack1: { imageSrc: 'resources/Attack1.png', framesMax: 6 },
        takeHit: { imageSrc: 'resources/Take Hit - white silhouette.png', framesMax: 4 },
        death: { imageSrc: 'resources/Death.png', framesMax: 6 }
    },
    attackBox: { offset: { x: -80, y: 70 }, width: 160, height: 50 },
    attackFrame: 4 // player deals hit on frame index 4
});
player.attackCooldown = 0; // player manual

const enemy = new Fighter({
    position: { x: 400, y: 100 },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    imageSrc: 'resources/enemy/Idle.png',
    framesMax: 4,
    scale: 3,
    offset: { x: 215, y: 180 },
    sprites: {
        idle: { imageSrc: 'resources/enemy/Idle.png', framesMax: 4 },
        run: { imageSrc: 'resources/enemy/Run.png', framesMax: 8 },
        jump: { imageSrc: 'resources/enemy/Jump.png', framesMax: 2 },
        fall: { imageSrc: 'resources/enemy/Fall.png', framesMax: 2 },
        attack1: { imageSrc: 'resources/enemy/Attack1.png', framesMax: 4 },
        takeHit: { imageSrc: 'resources/enemy/Take hit.png', framesMax: 3 },
        death: { imageSrc: 'resources/enemy/Death.png', framesMax: 7 }
    },
    attackBox: { offset: { x: -20, y: 70 }, width: 170, height: 50 },
    attackFrame: 2 // enemy deals hit on frame index 2 (0-based)
});
enemy.attackCooldown = 0; // controlled by AI

// ---------------- Input ----------------
const key = { a: { pressed: false }, d: { pressed: false }, w: { pressed: false } };
let lastKey = null;

addEventListener('keydown', (event) => {
    if (isGameOver) return; // block input when game over
    switch (event.key) {
        case 'd':
        case 'ArrowRight':
            key.d.pressed = true;
            lastKey = 'd';
            player.facingRight = true;
            break;
        case 'a':
        case 'ArrowLeft':
            key.a.pressed = true;
            lastKey = 'a';
            player.facingRight = false;
            break;
        case 'w':
        case 'ArrowUp':
            if (player.velocity.y === 0) player.velocity.y = -15;
            break;
        case ' ':
            // space - attack
            player.attack();
            break;
    }
});

addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
        case 'ArrowRight':
            key.d.pressed = false;
            break;
        case 'a':
        case 'ArrowLeft':
            key.a.pressed = false;
            break;
    }
});

// ---------------- Timer ----------------
let timer = 35;
let timerId;
function timerHandler() {
    clearTimeout(timerId);
    if (timer > 0) {
        const timerEl = document.querySelector('.timer');
        if (timerEl) timerEl.innerHTML = timer;
        timerId = setTimeout(timerHandler, 1000);
        timer--;
    } else {
        determineResults({ player, enemy, timerId });
    }
}

// ---------------- Main animate loop ----------------
function animate() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(1.3, 1.1);
    ctx.translate(camera.position.x, camera.position.y);
    background.update();
    ctx.restore();

    // Update player first (draw + animation)
    player.update();

    // --- Enemy AI (improved) ---
    const distanceToPlayer = player.position.x - enemy.position.x;
    enemy.facingRight = distanceToPlayer < 0;

    // Movement behaviour
    if (Math.abs(distanceToPlayer) > 80) {
        // approach player
        enemy.velocity.x = distanceToPlayer > 0 ? 2 : -2;
        enemy.switchSprite('run');
    } else {
        // close enough to consider attack
        enemy.velocity.x = 0;
        // if not attacking and cooldown finished, start attack
        if (!enemy.isAttacking && enemy.attackCooldown === 0) {
            enemy.attack();
            enemy.switchSprite('attack1');
            enemy.attackCooldown = 90; // cooldown (~1.5s at 60fps)
        } else if (!enemy.isAttacking && enemy.attackCooldown > 0) {
            // keep idle if waiting
            enemy.switchSprite('idle');
        }
    }
    // decrement cooldown inside update() as well; but ensure not negative
    if (enemy.attackCooldown > 0) enemy.attackCooldown--;

    // update enemy (draw + animation + physics)
    enemy.update();

    // --- Player movement handling ---
    player.velocity.x = 0; // reset, then apply input
    if (key.a.pressed && lastKey === 'a') {
        player.velocity.x = -5;
        player.switchSprite('run');
        player.rightPanning({ canvas, camera });
    } else if (key.d.pressed && lastKey === 'd') {
        player.velocity.x = 5;
        player.switchSprite('run');
        player.leftPanning({ canvas, camera });
    } else {
        // only switch to idle if not in attack or takeHit or death
        if (!player.isAttacking && player.image !== player.sprites.takeHit.image && !player.dead) {
            player.switchSprite('idle');
        }
    }

    if (player.velocity.y < 0) player.switchSprite('jump');
    else if (player.velocity.y > 0) player.switchSprite('fall');

    if (player.position.x < 0) {
      player.position.x = 0;
    } 
    if (player.position.x + player.width > canvas.width) {
      player.position.x = canvas.width - player.width;
    }
    if (enemy.position.x < 0) {
      enemy.position.x = 0;
    } 
    if (enemy.position.x + enemy.width > canvas.width) {
      enemy.position.x = enemy.width - player.width;
    }

    // ---------------- Collision & attack hit detection (with one-hit-per-attack) ----------------

    // Player attack hit
    if (player.isAttacking && !player.attackHitDone && player.framesCurrent === player.attackFrame) {
        if (collision({ char1: player, char2: enemy })) {
            enemy.takeHit();
            document.querySelector(".enemy-health")?.style && (document.querySelector(".enemy-health").style.width = enemy.health + '%');
        }
        player.attackHitDone = true; // ensure single application per attack
    }

    // Enemy attack hit
    if (enemy.isAttacking && !enemy.attackHitDone && enemy.framesCurrent === enemy.attackFrame) {
        if (collision({ char1: enemy, char2: player })) {
            player.takeHit();
            document.querySelector(".player-health")?.style && (document.querySelector(".player-health").style.width = player.health + '%');
        }
        enemy.attackHitDone = true;
    }

    // If player attempted to hit while enemy was mid-attack, takeHit will still run immediately if allowed by switchSprite logic

    // End match check
    if (player.health <= 0 || enemy.health <= 0) {
        determineResults({ player, enemy, timerId });
    }

    // Continue loop
    requestAnimationFrame(animate);
}

// ---------------- Screens ----------------
function drawStartscreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const boxW = 300, boxH = 120;
    const boxX = (canvas.width - boxW) / 2, boxY = (canvas.height - boxH) / 2;

    ctx.fillStyle = 'white';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = 'black';
    ctx.font = '40px Pixelify Sans';
    ctx.textAlign = 'center';
    ctx.fillText('Click to play', canvas.width / 2, canvas.height / 2);
}

function drawEndScreen(result) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const boxW = 300, boxH = 120;
    const boxX = (canvas.width - boxW) / 2, boxY = (canvas.height - boxH) / 2;

    ctx.fillStyle = 'white';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = 'black';
    ctx.font = '40px Pixelify Sans';
    ctx.textAlign = 'center';
    ctx.fillText(result, canvas.width / 2, canvas.height / 2);

    if (showReplay) {
        ctx.fillStyle = 'green';
        ctx.fillRect(boxX + 50, boxY + 60, 200, 40);
        ctx.fillStyle = 'white';
        ctx.fillText('Replay', canvas.width / 2, boxY + 90);
    }
}

// ---------------- Start & Replay handling ----------------
background.image.onload = () => drawStartscreen();

canvas.addEventListener('click', (e) => {
    const boxW = 300, boxH = 120;
    const boxX = (canvas.width - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;

    // Start the game
    if (!isGameStarted && !isGameOver) {
        isGameStarted = true;
        bgMusic.currentTime = 0;
        bgMusic.play();
        animate();
        timerHandler();
        return;
    }

    // Replay handling
    if (isGameOver && showReplay) {
        if (e.offsetX >= boxX + 50 && e.offsetX <= boxX + 250 &&
            e.offsetY >= boxY + 60 && e.offsetY <= boxY + 100) {

            // Reset player
            player.position = { x: 200, y: 0 };
            player.velocity = { x: 0, y: 0 };
            player.health = 100;
            player.dead = false;
            player.isAttacking = false;
            player.attackHitDone = false;
            player.attackCooldown = 0;
            player.framesCurrent = 0;
            player.switchSprite('idle');
            player.facingRight = true;

            // Reset enemy
            enemy.position = { x: 400, y: 100 };
            enemy.velocity = { x: 0, y: 0 };
            enemy.health = 100;
            enemy.dead = false;
            enemy.isAttacking = false;
            enemy.attackHitDone = false;
            enemy.attackCooldown = 0;
            enemy.framesCurrent = 0;
            enemy.switchSprite('idle');
            enemy.facingRight = false;

            // Reset UI
            document.querySelector(".player-health")?.style && (document.querySelector(".player-health").style.width = '100%');
            document.querySelector(".enemy-health")?.style && (document.querySelector(".enemy-health").style.width = '100%');

            // Reset timer and flags
            timer = 35;
            isGameOver = false;
            showReplay = false;
            key.a.pressed = false;
            key.d.pressed = false;
            lastKey = null;

            // Restart music and loop
            bgMusic.currentTime = 0;
            bgMusic.play();

            // Start game loop & timer
            animate();
            timerHandler();
        }
    }
});
