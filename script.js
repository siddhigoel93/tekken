const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;

ctx.fillRect(0, 0, canvas.width, canvas.height);
const gravity = 0.5;

const key = {
    a: {
        pressed: false
    },
    d: {
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
            break;
        case 'a':
        case 'ArrowLeft':
            key.a.pressed = true;
            lastKey = 'a';
            break;
        case 'w':
        case 'ArrowUp':
            player.velocity.y = -10;
            break;
    }
}
)
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
}
)

class Sprite {
    constructor({ position, velocity, color = 'blue'}) {
        this.position = position;
        this.velocity = velocity;
        this.width = 50;
        this.height = 150;
        this.attackBox = {
            position: this.position,
            width: 100,
            height: 50
        }
        this.color = color;
        this.isAttacking = false;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, 50, this.height);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.position.y + this.height >= canvas.height) {
            this.velocity.y = 0;
        } else {
            this.velocity.y += gravity;
        }
    }
}

const player = new Sprite({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
});

const enemy = new Sprite({
    position: { x: 200, y: 100 },
    velocity: { x: 0, y: 2 },
    color: 'red'
});



function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    enemy.update();

    player.velocity.x = 0;
    enemy.velocity.x = 0;
    if (key.a.pressed && lastKey == 'a') {
        player.velocity.x = -5;
    } else if (key.d.pressed && lastKey == 'd') {
        player.velocity.x = 5;
    }

    //collision detection
    if(player.attackBox.position.x + player.attackBox.width >= enemy.position.x && player.attackBox.position.x <= enemy.position.x + enemy.width && player.attackBox.position.y + player.attackBox.height >= enemy.position.y && player.attackBox.position.y <= enemy.position.y + enemy.height && player.isAttacking){
        console.log('collision')
    }

    requestAnimationFrame(animate);
}
animate();
