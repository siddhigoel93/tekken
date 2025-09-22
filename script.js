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
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.height = 150;
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.position.x, this.position.y, 50, this.height);
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
    position: { x: 100, y: 100 },
    velocity: { x: 0, y: 2 }
});



function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    enemy.update();

    player.velocity.x = 0;
    if (key.a.pressed && lastKey == 'a') {
        player.velocity.x = -1;
    } else if (key.d.pressed && lastKey == 'd') {
        player.velocity.x = 1;
    }
    requestAnimationFrame(animate);
}
animate();
