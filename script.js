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
            if (player.position.y + player.height >= canvas.height - 90) {
                player.velocity.y = -10;
            }
            break;
        case ' ':
            player.switchSprite('attack1');
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
    constructor({ position, imageSrc , scale=1,maxframes=1 ,offset={x:0,y:0}}) {
        this.position = position;
        this.width = 50;
        this.height = 150;
        this.image = new Image();
        this.image.src = imageSrc;
        this.scale =scale;
        this.maxframes = maxframes;
        this.currentFrame =0;
        this.overFrames =0;
        this.framesHold =5;
        this.offset =offset;
        
    }

    draw() {
        if (!this.image.complete || this.image.naturalWidth === 0) return;
       ctx.drawImage(this.image,
        this.currentFrame*(this.image.width/this.maxframes),0,
        this.image.width/this.maxframes,this.image.height,
       this.position.x-this.offset.x , this.position.y-this.offset.y,
      (this.image.width/this.maxframes)*this.scale,
       this.image.height*this.scale
    )}
    animation(){
        this.overFrames++;
        if(this.overFrames % this.framesHold === 0){
            if(this.currentFrame<this.maxframes-1){
                this.currentFrame++
            }else{
                this.currentFrame=0;
            }
        }
    }
    update() {
        this.draw();
        this.animation();
}
}
const background = new Sprite({
    position : {
        x:0,
        y:0
    },
    imageSrc: 'resources/bg-1.jpg'
});

class Fighter extends Sprite {
    constructor({ position, velocity, color = 'blue',imageSrc , scale=1,maxframes=1,offset={x:0,y:0},sprites}) {
        super({ position, imageSrc, scale, maxframes , offset });
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
        this.isAttacking = false;
        this.health = 100;
        this.sprites = sprites;
        
        for(const sprite in this.sprites){
            sprites[sprite].image = new Image();
            sprites[sprite].image.src = sprites[sprite].imageSrc;
        }
    }

    

    update() {
        this.draw();
        this.animation();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.position.y + this.height >= canvas.height-90) {
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

    switchSprite(sprite){
        if(this.image === this.sprites.attack1.image  && this.currentFrame < this.sprites.attack1.maxframes-1) return;
        switch(sprite){
            case 'idle':
                if(this.image !== this.sprites.idle.image){
                this.image = this.sprites.idle.image;
                this.maxframes = this.sprites.idle.maxframes;
                }
                break;
            case 'run':
                if(this.image !== this.sprites.run.image){
                this.image = this.sprites.run.image;
            this.maxframes = this.sprites.run.maxframes;
                }
                break;
            case 'jump':
                if(this.image !== this.sprites.jump.image){
                this.image = this.sprites.jump.image;
            this.maxframes = this.sprites.jump.maxframes;
                }
                break;
                case 'fall':
                if(this.image !== this.sprites.fall.image){
                this.image = this.sprites.fall.image;
                this.maxframes = this.sprites.fall.maxframes;
                }
                break;
                case 'attack1':
                if(this.image !== this.sprites.attack1.image){
                this.image = this.sprites.attack1.image;
                this.maxframes = this.sprites.attack1.maxframes;
                }
                break;
        }
    }
}


const player = new Fighter({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    offset: { x: 205, y: 140 },
    imageSrc: 'resources/Idle.png',
    maxframes : 8,
    scale:2.5,
    sprites:{
        'idle':{
            imageSrc: 'resources/Idle.png',
            maxframes:8
        },
        'run':{
            imageSrc: 'resources/Run.png',
            maxframes:8
        } ,
        'jump':{
            imageSrc: 'resources/Jump.png',
            maxframes:2
        } ,   
        'fall':{
            imageSrc: 'resources/Fall.png',
            maxframes:2
        },
        'attack1':{
            imageSrc: 'resources/Attack1.png',
            maxframes:4
        }
    }
});

const enemy = new Fighter({
    position: { x: 200, y: 100 },
    velocity: { x: 0, y: 2 },
    color: 'red',
    offset: { x: -50, y: 0 },
    
    
});

function collision({ char1, char2 }) {
    return (char1.attackBox.position.x + char1.attackBox.width >= char2.position.x && char1.attackBox.position.x <= char2.position.x + char2.width && char1.attackBox.position.y + char1.attackBox.height >= char2.position.y && char1.attackBox.position.y <= char2.position.y + char2.height);

}

function determineResults({ player, enemy, timerId}) {
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

let timer = 15;
let timerId;
function timerHandler() {
    timerId = setTimeout(timerHandler, 1000);
    if (timer > 0) {
        timer--;
        document.querySelector('.timer').innerHTML = timer;
    }
    if (timer == 0) {
        determineResults({player,enemy, timerId});
    }
}

timerHandler();

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update();
    player.update();
    // enemy.update();
    
    player.velocity.x = 0;
    enemy.velocity.x = 0;
    player.switchSprite('idle');
    if (key.a.pressed && lastKey == 'a') {
        player.velocity.x = -5;
       player.switchSprite('run')
    } else if (key.d.pressed && lastKey == 'd') {
        player.velocity.x = 5;
        player.switchSprite('run');
    }

    if(player.velocity.y <0){
        player.switchSprite('jump');
    }else if(player.velocity.y>0)
        player.switchSprite('fall');

    //collision detection
    if (collision({ char1: player, char2: enemy }) && player.isAttacking) {
        enemy.health -= 20
        document.querySelector(".enemy-health").style.width = enemy.health + '%';
        player.isAttacking = false;
    }
    if (collision({ char1: enemy, char2: player }) && enemy.isAttacking) {
        player.health -= 20
        document.querySelector(".player-health").style.width = player.health + '%';
        enemy.isAttacking = false;
    }

    if (player.health <= 0 || enemy.health <= 0) {
        determineResults({player,enemy,timerId});
    }

    requestAnimationFrame(animate);
}
animate();