const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;
ctx.fillRect(0, 0, canvas.width, canvas.height)
const gravity = 0.7;

// classes
class Sprite {
    constructor({ position, imageSrc, scale = 1, framesMax = 1, offset = { x: 0, y: 0 } }) {
        this.position = position;
        this.width = 50;
        this.height = 150;
        this.image = new Image();
        this.image.src = imageSrc;
        this.scale = scale;
        this.framesMax = framesMax;
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5;
        this.offset = offset;
        this.facingRight = true;
    }

    draw() {
        if (!this.image.complete || this.image.naturalWidth === 0) return;

        // ctx.save();

        // if (!this.facingRight) {
        //     ctx.translate(this.position.x + (this.width * this.scale) / 2, this.position.y - this.offset.y);
        //     ctx.scale(-1, 1);
        //     ctx.translate(-this.position.x - (this.width * this.scale) / 2, -(this.position.y - this.offset.y));
        // }

        ctx.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesMax), 0,
            this.image.width / this.framesMax, this.image.height,
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            (this.image.width / this.framesMax) * this.scale,
            this.image.height * this.scale
        );

        // ctx.restore();
    }

    animation() {
        this.framesElapsed++;
        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++
            } else {
                this.framesCurrent = 0;
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
    attackBox = { offset: {}, width: undefined, height: undefined }
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    })

    this.velocity = velocity
    this.width = 50
    this.height = 150
    this.lastKey
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    }
    this.color = color
    this.isAttacking
    this.health = 100
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.sprites = sprites
    this.dead = false

    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image()
      sprites[sprite].image.src = sprites[sprite].imageSrc
    }
    this.camerabox = {
        position: {
            x: this.position.x,
            y: this.position.y
        },
        width: 50,
        height: 80,
    }
}

updateCamerabox() {
    this.camerabox = {
        position: {
            x: this.position.x - 320,
            y: this.position.y - 260
        },
        width: 2 * canvas.width / 3,
        height: 2 * canvas.height / 3,
    }
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
// downPanning({ canvas, camera }) {
//     if (this.camerabox.position.y <= 0) return;
//     if (this.camerabox.position.y <= Math.abs(camera.position.y)) {
//         camera.position.y -= this.velocity.y;
//     }
// }
// upPanning({ canvas, camera }) {
//     if (this.camerabox.position.y <= 0) return;
//     if (this.camerabox.position.y + this.camerabox.position.y <= Math.abs(camera.position.y)) {
//         camera.position.y -= this.velocity.y;
//     }
// }

update() {
    this.draw();
    if (!this.dead) this.animation()
    // update attack box position depending on offset
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y

    this.updateCamerabox();

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    const groundY = canvas.height - 96
    if (this.position.y + this.height >= groundY) {
        this.velocity.y = 0;
        this.position.y = groundY - this.height;
        this.jumpCount = 0;
    } else {
        this.velocity.y += gravity;
    }
    if (this.position.x <= 0 || this.position.x + this.attackBox.width >= canvas.width) {
        this.velocity.x = 0;
    }
}

attack() {
    // start attack animation and mark attacking
    this.switchSprite('attack1')
    this.isAttacking = true
}

takeHit() {
    this.health -= 20
    if (this.health <= 0) {
        this.switchSprite('death')
    } else {
        this.switchSprite('takeHit')
    }
}

switchSprite(sprite) {
    if (this.image === this.sprites.death.image) {
        if (this.framesCurrent === this.sprites.death.framesMax - 1)
            this.dead = true
        return
    }

    // overriding all other animations with the attack animation
    if (
        this.image === this.sprites.attack1.image &&
        this.framesCurrent < this.sprites.attack1.framesMax - 1
    )
        return

    // override when fighter gets hit
    if (
        this.image === this.sprites.takeHit.image &&
        this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
        return

    switch (sprite) {
        case 'idle':
            if (this.image !== this.sprites.idle.image) {
                this.image = this.sprites.idle.image
                this.framesMax = this.sprites.idle.framesMax
                this.framesCurrent = 0
            }
            break
        case 'run':
            if (this.image !== this.sprites.run.image) {
                this.image = this.sprites.run.image
                this.framesMax = this.sprites.run.framesMax
                this.framesCurrent = 0
            }
            break
        case 'jump':
            if (this.image !== this.sprites.jump.image) {
                this.image = this.sprites.jump.image
                this.framesMax = this.sprites.jump.framesMax
                this.framesCurrent = 0
            }
            break

        case 'fall':
            if (this.image !== this.sprites.fall.image) {
                this.image = this.sprites.fall.image
                this.framesMax = this.sprites.fall.framesMax
                this.framesCurrent = 0
            }
            break

        case 'attack1':
            if (this.image !== this.sprites.attack1.image) {
                this.image = this.sprites.attack1.image
                this.framesMax = this.sprites.attack1.framesMax
                this.framesCurrent = 0
            }
            break

        case 'takeHit':
            if (this.image !== this.sprites.takeHit.image) {
                this.image = this.sprites.takeHit.image
                this.framesMax = this.sprites.takeHit.framesMax
                this.framesCurrent = 0
            }
            break

        case 'death':
            if (this.image !== this.sprites.death.image) {
                this.image = this.sprites.death.image
                this.framesMax = this.sprites.death.framesMax
                this.framesCurrent = 0
            }
            break
    }
}
}

function collision({ char1, char2 }) {
    return (char1.attackBox.position.x + char1.attackBox.width >= char2.position.x && char1.attackBox.position.x <= char2.position.x + char2.width && char1.attackBox.position.y + char1.attackBox.height >= char2.position.y && char1.attackBox.position.y <= char2.position.y + char2.height);

}
function determineResults({ player, enemy, timerId }) {
    clearTimeout(timerId);
    document.querySelector('.result-text').style.display = 'flex';
    if (player.health == enemy.health) {
        document.querySelector('.result-text').innerHTML = 'Tie!';
    }
    else if (player.health > enemy.health) {
        document.querySelector('.result-text').innerHTML = 'You Won!';
    }
    else {
        document.querySelector('.result-text').innerHTML = 'You Lose!';
    }
}

const background = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imageSrc: 'resources/bg-1.jpg'
});

const scaledCanvas = {
    height: canvas.height / 1,
    width: canvas.width / 1.3
}

const key = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    }
}

let lastKey;
addEventListener('keydown', function (event) {
    switch (event.key) {
        case 'd':
        case 'ArrowRight':
            key.d.pressed = true;
            lastKey = 'd';
            player.facingRight = true;  // Immediately face right on right key
            break;
        case 'a':
        case 'ArrowLeft':
            key.a.pressed = true;
            lastKey = 'a';
            player.facingRight = false;  // Immediately face left on left key
            break;
        // rest of keys...
    }
});



addEventListener('keyup', function (event) {
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




const player = new Fighter({
    position: { x: 200, y: 0 },
    velocity: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    imageSrc: 'resources/Idle.png',
    framesMax: 8,
    scale: 2.5,
    offset: {
    x: 215,
    y: 65
  },
    sprites: {
        idle: { imageSrc: './resources/Idle.png', framesMax: 8 },
        run: { imageSrc: './resources/Run.png', framesMax: 8 },
        jump: { imageSrc: './resources/Jump.png', framesMax: 2 },
        fall: { imageSrc: './resources/Fall.png', framesMax: 2 },
        attack1: { imageSrc: './resources/Attack1.png', framesMax: 6 },
        takeHit: { imageSrc: './resources/Take Hit - white silhouette.png', framesMax: 4 },
        death: { imageSrc: './resources/Death.png', framesMax: 6 }
    },
    attackBox: { offset: { x: 100, y: 50 }, width: 160, height: 50 }
});

const enemy = new Fighter({
    position: {
        x: 400,
        y: 100
    },
    velocity: {
        x: 0,
        y: 0
    },
    color: 'blue',
    offset: {
        x: -50,
        y: 0
    },
    imageSrc: './resources/enemy/Idle.png',
    framesMax: 4,
    scale: 3,
    offset: {
        x: 215,
        y: 180
    },
    sprites: {
        idle: {
            imageSrc: './resources/enemy/Idle.png',
            framesMax: 4
        },
        run: {
            imageSrc: './resources/enemy/Run.png',
            framesMax: 8
        },
        jump: {
            imageSrc: './resources/enemy/Jump.png',
            framesMax: 2
        },
        fall: {
            imageSrc: './resources/enemy/Fall.png',
            framesMax: 2
        },
        attack1: {
            imageSrc: './resources/enemy/Attack1.png',
            framesMax: 4
        },
        takeHit: {
            imageSrc: './resources/enemy/Take hit.png',
            framesMax: 3
        },
        death: {
            imageSrc: './resources/enemy/Death.png',
            framesMax: 7
        }
    },
    attackBox: {
        offset: {
            x: -170,
            y: 50
        },
        width: 170,
        height: 50
    }
})




let timer = 35;
let timerId;
function timerHandler() {
    if (timer > 0) {
        timerId = setTimeout(timerHandler, 1000);
        timer--;
        document.querySelector('.timer').innerHTML = timer;
    }
    if (timer == 0) {
        determineResults({ player, enemy, timerId });
    }
}

timerHandler();

const backgroundresourcesHeight = 618;
const camera = {
    position: {
        x: 0,
        y: -backgroundresourcesHeight + scaledCanvas.height
    },
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(1.3, 1.1);
    ctx.translate(camera.position.x, camera.position.y);
    background.update();
    ctx.restore();

    player.update();
    enemy.update();

    // Reset horizontal velocity before processing input/AI
    player.velocity.x = 0;
    enemy.velocity.x = 0;

    player.switchSprite('idle');

    // Player movement input handling
    if (key.a.pressed && lastKey === 'a') {
        player.velocity.x = -5;
        // player.facingRight = false;
        player.switchSprite('run');
        player.rightPanning({ canvas, camera });
    } else if (key.d.pressed && lastKey === 'd') {
        player.velocity.x = 5;
        // player.facingRight = true;
        player.switchSprite('run');
        player.leftPanning({ canvas, camera });
    } else {
        player.switchSprite('idle');
    }

    // Player vertical animation
    if (player.velocity.y < 0) {
        player.switchSprite('jump');
    } else if (player.velocity.y > 0) {
        player.switchSprite('fall');
    }

    // Enemy AI behavior: follow player and attack when close
    const distanceToPlayer = player.position.x - enemy.position.x;

    // Enemy faces player always
    enemy.facingRight = distanceToPlayer < 0;


    // Player faces enemy always
    // player.facingRight = distanceToPlayer > 0 ? true : false;

    // Enemy follow player movement if distance is significant
    if (Math.abs(distanceToPlayer) > 20) {
        enemy.velocity.x = distanceToPlayer > 0 ? 2 : -2;
        enemy.switchSprite('run');
    } else {
        enemy.velocity.x = 0;
    }

    // Enemy attacks if close enough with a small probability
    const attackProbability = 0.01; // increased chance compared to original
    if (Math.abs(distanceToPlayer) < 100 && Math.random() < attackProbability && !enemy.isAttacking) {
        enemy.switchSprite('attack1');
        enemy.attack();
    }

    // If enemy is not attacking and not moving, idle animation
    if (!enemy.isAttacking && enemy.velocity.x === 0) {
        enemy.switchSprite('idle');
    }

    // Collision detection and health updates
    if (collision({ char1: player, char2: enemy }) && player.isAttacking && player.framesCurrent === 4) {
        enemy.takeHit();
        player.isAttacking = false;
        enemy.health -= 20;
        document.querySelector(".enemy-health").style.width = enemy.health + '%';
    }
    if (player.isAttacking && player.framesCurrent === 4) {
        player.isAttacking = false;
    }

    if (collision({ char1: enemy, char2: player }) && enemy.isAttacking && enemy.framesCurrent === 2) {
        player.takeHit();
        enemy.isAttacking = false;
        player.health -= 10;
        document.querySelector(".player-health").style.width = player.health + '%';
    }
    if (enemy.isAttacking && enemy.framesCurrent === 2) {
        enemy.isAttacking = false;
    }

    // Check for game end condition
    if (player.health <= 0 || enemy.health <= 0) {
        determineResults({ player, enemy, timerId });
    }

    requestAnimationFrame(animate);
}
animate();