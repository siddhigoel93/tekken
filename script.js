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
            break;
        case 'a':
        case 'ArrowLeft':
            key.a.pressed = true;
            lastKey = 'a';
            break;
        case 'w':
        case 'ArrowUp':
            player.velocity.y = -10;
            key.w.pressed = true;
            break;
        case ' ':
            player.attack();
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
    constructor({ position, velocity, color = 'blue', offset }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 50;
        this.height = 150;
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y,
            },
            offset,
            width: 100,
            height: 50
        };
        this.color = color;
        this.isAttacking;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        this.attackBox.position.x = this.position.x;
        this.attackBox.position.y = this.position.y;


        this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y;
        if (this.isAttacking) {
            ctx.fillStyle = 'green';
            ctx.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
        }
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

    attack() {
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100)
    }
}

const player = new Sprite({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
});

const enemy = new Sprite({
    position: { x: 200, y: 100 },
    velocity: { x: 0, y: 2 },
    color: 'red',
    offset: { x: -50, y: 0 }
});

function collision({char1, char2}){
    return (char1.attackBox.position.x + char1.attackBox.width >= char2.position.x && char1.attackBox.position.x <= char2.position.x + char2.width && char1.attackBox.position.y + char1.attackBox.height >= char2.position.y && char1.attackBox.position.y <= char2.position.y + char2.height);
    
}

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
    if (collision({char1: player, char2: enemy}) && player.isAttacking){
        console.log("collision")
        player.isAttacking = false;
    }
    if (collision({char1: enemy, char2: player}) && enemy.isAttacking){
        console.log("collision")
        enemy.isAttacking = false;
    }
    

    requestAnimationFrame(animate);
}
animate();
