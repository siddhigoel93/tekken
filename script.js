const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

class Sprite {
    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.x + spriteWidth >= innerWidth) {
            this.position.x = innerWidth-spriteWidth;
            this.velocity.x = 0;
        }
        if (this.position.x < 0) {
            this.position.x = 0;
            this.velocity.x = 0;
        }

        if (this.position.y + spriteHeight >= innerHeight) {
            this.position.y = innerHeight - spriteHeight;
            this.velocity.y = 0;
        }
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
        }
    }
}

const player = new Sprite(
    { x: 100, y: 200 },
    { x: -1, y: 1 } 
);

const playerImage = new Image();
playerImage.src = "./resources/Idle.png";

const spriteWidth = 160;
const spriteHeight = 111;
let gameFrame = 0;
let staggerFrames = 5;

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    let positionX = Math.floor(gameFrame / staggerFrames) % 8;
    let frameX = spriteWidth * positionX;
    let frameY = 0;

    ctx.drawImage(
        playerImage,
        frameX, frameY, spriteWidth, spriteHeight,
        player.position.x, player.position.y, spriteWidth, spriteHeight
    );

    player.update();
    gameFrame++;
}

animate();
