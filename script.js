const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;


const playerImage = new Image();
playerImage.src = "./resources/Idle.png";
const spriteWidth = 160;
const spriteHeight = 111;
let gameFrame = 0;
let staggerFrames = 5;

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let position = Math.floor(gameFrame / staggerFrames) % 8;
    let FrameX = spriteWidth *position;
    let FrameY = spriteHeight*0;
    ctx.drawImage(playerImage, FrameX, FrameY , spriteWidth, spriteHeight, 0, 0, spriteWidth, spriteHeight);
    gameFrame++;

}
animate();

