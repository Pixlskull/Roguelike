class Circle {
    constructor(){
        this.x;
        this.y;
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.direction = 0;
        this.radius = 10;
        this.xAccel = 0.1;
        this.yAccel = 0.1; 
        this.state = alive;
    }
    get area(){
        return Math.PI * this.radius ** 2;
    }
    update(){
        this.x += this.xVelocity;
        this.y += this.yVelocity;
        if (this.x - this.radius < 0){
            this.xVelocity = 0;
            this.x = 0 + this.radius;
        }
        else if (this.x + this.radius > gameMap.x){
            this.xVelocity = 0;
            this.x = gameMap.x - this.radius;
        }

        if (this.y - this.radius < 0){
            this.yVelocity = 0;
            this.y = 0 + this.radius;
        }
        else if (this.y + this.radius > gameMap.y){
            this.yVelocity = 0;
            this.y = gameMap.y - this.radius;
        }
    }
    draw(){
        const drawRange = 200;
        const drawX = this.x - Camera.getX();
        const drawY = this.y - Camera.getY();  
        if (drawX < canvas.width + drawRange && drawX > 0 - drawRange && 
            drawY < canvas.height + drawRange && drawY > 0 - drawRange
            ){
            ctx.strokeStyle = "#000000";
            ctx.beginPath();
            ctx.arc(x, y, this.radius, 0, Math.PI * 2, true);
            ctx.stroke();
        }
    }
}
class Player extends Circle {
    constructor(){
        super();
        this.x = gameMap.x/2;
        this.y = gameMap.y/2;
        this.xVelocityTop = canvas.width/100;
        this.yVelocityTop = canvas.height/100;
        this.lastX = 0;
        this.lastY = 0;
    }

    update(){
        //checks if X Velocity plus acceleration is lower than Maximum X Velocity
        const targetXVelocity = this.xVelocityTop * controller.xVelocity;
        const targetYVelocity = this.yVelocityTop * controller.yVelocity;
        if (this.xVelocity > targetXVelocity){
            //this code doesn't account for situations where both x and y are being accelerated
            //it should be multiplied by controller.xVelocity
            this.xVelocity = Math.max(this.xVelocity - this.xAccel, targetXVelocity);
            
        }
        else if (this.xVelocity < targetXVelocity){
            this.xVelocity = Math.min(this.xVelocity + this.xAccel, targetXVelocity);
        }
        
        //checks if Y Velocity plus acceleration is lower than Maximum Y Velocity
        if (this.yVelocity > targetYVelocity){
            this.yVelocity = Math.max(this.yVelocity - this.yAccel, targetYVelocity);
        }
        else if (this.yVelocity < targetYVelocity){
            this.yVelocity = Math.min(this.yVelocity + this.yAccel, targetYVelocity);
        }
        this.lastX = this.x;
        this.lastY = this.y;
        super.update();
    }

    draw(){
        super.draw();
    }
}

class StaticCircle extends Circle{
    constructor(){
        super();
        this.x = randomNum(0, gameMap.x);
        this.y = randomNum(0, gameMap.y);
        this.radius = randomNum(1, 15);
    }
    update(){
        super.update();
    }
    draw(){
        super.draw();
    }
}

class RandomCircle extends Circle {

    constructor(){
        super();
        this.x = gameMap.x/2;
        this.y = gameMap.y/2;
        this.radius = randomNum(5, 75);
        let vector = rollSpeed(-5, 5);
        this.xVelocity = vector.xVelocity;
        this.yVelocity = vector.yVelocity;
    }

    update(){
        super.update();
    }

    draw(){
        super.draw();    
    }

}

class GameMap{
    constructor(){
        this.x = 250;
        this.y = 250;
    }
}

class Background {
    constructor(){
        this.lineSpacing = 50;
        this.x = 0;
        this.y = 0;
    }
    update(){
        this.x = (this.x - player.xVelocity) % this.lineSpacing;
        this.y = (this.y - player.yVelocity) % this.lineSpacing;
    }
    draw(){
        let xCounter = this.x;
        let yCounter = this.y;
        while (xCounter < canvas.width){
            ctx.moveTo(xCounter, 0);
            ctx.lineTo(xCounter, canvas.height);
            xCounter += this.lineSpacing;
        }
        while (yCounter < canvas.width){
            ctx.moveTo(0, yCounter);
            ctx.lineTo(canvas.width, yCounter);
            yCounter += this.lineSpacing;
        }
        ctx.stroke();
    }
}
class Controller {
    constructor(){
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        this.xVelocity = 0;
        this.yVelocity = 0;
    }

    get magnitude() {
        return Math.sqrt(this.xVelocity ** 2 + this.yVelocity ** 2);
    }

    update(){
        this.xVelocity = this.yVelocity = 0;
        if (this.left === true){
            this.xVelocity -= 1;
        }
        if (this.right === true){
            this.xVelocity += 1;
        }
        if (this.up === true){
            this.yVelocity -= 1;
        }
        if (this.down === true){
            this.yVelocity += 1;
        }
        this.normalize();
    }

    normalize(){
        const magnitude = this.magnitude;
        if(magnitude !== 0){
            this.xVelocity = this.xVelocity * Math.abs(this.xVelocity) / magnitude;
            this.yVelocity = this.yVelocity * Math.abs(this.yVelocity) / magnitude;
        }
    }
}
class Camera{
    constructor (){
        this.x;
        this.y;
    }
    fixedUpdate(x, y){
        this.x = x;
        this.y = y;
    }
    followUpdate(object){
        this.x = typeof(object.x) === "number" ? object.x : this.x;
        this.y = typeof(object.y) === "number" ? object.y : this.y;
    }
    getX(){
        return this.x;
    }
    getY(){
        return this.y;
    }
}


function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNum(min, max){
    return Math.random() * (max - min) + min;
}

function rollSpeed(min, max){
    const xSpeed = randomNum(min, max);
    const ySpeed = randomNum(min, max);
    if (xSpeed === 0 && ySpeed === 0){
        return rollSpeed(min, max);
    }
    else {
        return {
            "xVelocity": xSpeed,
            "yVelocity": ySpeed
        };
    }
}

function clamp (value, min, max){
    return Math.max(min, Math.min(value, max));
}
document.onkeydown = keyDownCheck;
document.onkeyup = keyUpCheck;

function keyDownCheck(e) {
    switch(e.key){
        case "ArrowLeft":
            controller.left = true;
            break;
        case "ArrowRight":
            controller.right = true;
            break;
        case "ArrowUp":
            controller.up = true;
            break;
        case "ArrowDown":
            controller.down = true;
            break;
    }
}

function keyUpCheck(e) {
    switch(e.key){
        case "ArrowLeft":
            controller.left = false;
            break;
        case "ArrowRight":
            controller.right = false;
            break;
        case "ArrowUp":
            controller.up = false;
            break;
        case "ArrowDown":
            controller.down = false;
            break;
    }
}
const canvas = document.getElementById("myCanvas");
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext("2d");
let game_objects = [];
let gameMap = new GameMap();
let player = new Player();
let controller = new Controller();
let background = new Background();
function game_cycle () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    controller.update();
    player.update();
    background.update();
    background.draw();
    if (Math.random() < 0.05){
        game_objects.push(new RandomCircle());
    }
    if (Math.random() < 0.4){
        game_objects.push(new StaticCircle());
    }
    for (let game_object of game_objects){
        game_object.update();
        game_object.draw();
    }
    player.draw();
    requestAnimationFrame(game_cycle);
}
requestAnimationFrame(game_cycle);