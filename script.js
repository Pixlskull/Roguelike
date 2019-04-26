const Direction = {
    RIGHT : "right",
    LEFT : "left",
    UP : "up",
    DOWN: "down"
};
class Vector {
    constructor(x = -1000, y = -1000) {
        this.x = x;
        this.y = y;
    }
    get magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    normalizeArgs(a, b) {
        if (a instanceof Vector) return {
            a: a.x,
            b: a.y
        };
        if (b == null) return {
            a: a,
            b: a
        };
        return {
            a,
            b
        };
    }
    set(x, y) {
        this.x = x;
        this.y = y;

        return this;
    }
    clone() {
        return new Vector(this.x, this.y);
    }
    unit() {
        return this.clone().divide(this.magnitude);
    }
    add(...args) {
        const {
            a,
            b
        } = this.normalizeArgs(...args);

        this.x += a;
        this.y += (b != null) ? b : a;

        return this;
    }
    subtract(...args) {
        const {
            a,
            b
        } = this.normalizeArgs(...args);
        this.x -= a;
        this.y -= (b != null) ? b : a;

        return this;
    }
    multiply(...args) {
        const {
            a,
            b
        } = this.normalizeArgs(...args);

        this.x *= a;
        this.y *= (b != null) ? b : a;

        return this;
    }
    divide(...args) {
        const {
            a,
            b
        } = this.normalizeArgs(...args);

        this.x /= (a != 0) ? a: 1;
        this.y /= (b != null && b != 0) ? b : (a != 0) ? a: 1;

        return this;
    }
}

class Coordinate extends Vector{
    constructor(x = -1, y = -1){
        super();
        this.x = x;
        this.y = y;
    }
    static cabDistance(coord1, coord2) {
        return Math.abs(coord2.x - coord1.x) + Math.abs(coord2.y - coord1.y)
    }
    addX(x){
        //works for subtraction I guess
        this.x += x;

        return this;
    }
    addY(y){
        this.y += y;

        return this;
    }
    clone() {
        return new Coordinate(this.x, this.y);
    }
    shiftUp(){
        return this.clone().addY(1);
    }
    shiftDown(){
        return this.clone().addY(-1);
    }
    shiftRight(){
        return this.clone().addX(1);
    }
    shiftLeft(){
        return this.clone().addX(-1);
    }
    equal(coordinate){
        if(this.x === coordinate.x && this.y === coordinate.y) {
            return true;
        }
        return false;
    }

}
class Circle {
    constructor() {
        this.x;
        this.y;
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.direction = 0;
        this.radius = 10;
        this.xAccel = 0.1;
        this.yAccel = 0.1;
    }
    get area() {
        return Math.PI * this.radius ** 2;
    }
    update() {
        this.x += this.xVelocity;
        this.y += this.yVelocity;
        if (this.x - this.radius < 0) {
            this.xVelocity = 0;
            this.x = 0 + this.radius;
        }
        else if (this.x + this.radius > gameMap.x) {
            this.xVelocity = 0;
            this.x = gameMap.x - this.radius;
        }

        if (this.y - this.radius < 0) {
            this.yVelocity = 0;
            this.y = 0 + this.radius;
        }
        else if (this.y + this.radius > gameMap.y) {
            this.yVelocity = 0;
            this.y = gameMap.y - this.radius;
        }
    }
    draw() {
        const drawRange = 200;
        const drawX = this.x - camera.getX();
        const drawY = this.y - camera.getY();
        if (drawX < canvas.width + drawRange && drawX > 0 - drawRange &&
            drawY < canvas.height + drawRange && drawY > 0 - drawRange
        ) {
            ctx.strokeStyle = "#000000";
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2, true);
            ctx.stroke();
        }
    }
}
class Player extends Circle {
    constructor() {
        super();
        this.x = gameMap.x / 2;
        this.y = gameMap.y / 2;
        this.xVelocityTop = canvas.width / 150;
        this.yVelocityTop = canvas.height / 150;
        this.lastX = 0;
        this.lastY = 0;
    }

    update() {
        //checks if X Velocity plus acceleration is lower than Maximum X Velocity
        const inputVector = controller.getNormalizeInput();
        this.xVelocity = inputVector.x * this.xVelocityTop;
        this.yVelocity = inputVector.y * this.yVelocityTop;
        super.update();
    }

    draw() {
        super.draw();
    }
}

class StaticCircle extends Circle {
    constructor() {
        super();
        this.x = randomNum(0, gameMap.x);
        this.y = randomNum(0, gameMap.y);
        this.radius = randomNum(1, 15);
    }
    update() {
        super.update();
    }
    draw() {
        super.draw();
    }
}

class RandomCircle extends Circle {

    constructor() {
        super();
        this.x = gameMap.x / 2;
        this.y = gameMap.y / 2;
        this.radius = randomNum(5, 75);
        let vector = rollSpeed(-5, 5);
        this.xVelocity = vector.xVelocity;
        this.yVelocity = vector.yVelocity;
    }

    update() {
        super.update();
    }

    draw() {
        super.draw();
    }

}

class GameMap {
    constructor() {
        this.x = 600;
        this.y = 600;
    }

}
class Labyrinth {
    constructor() {
        this.roomMap = {};
        this.roomCount = 0;
        this.activeRoom = 0;
        this.createRoom(new Coordinate(0, 0));
    }
    createRoom(coordinate) {
        if (!(coordinate instanceof Coordinate)){
            throw "No coordinate provided for createRoom()";
        }
        this.roomMap[this.roomCount] = new Room(this.roomCount, coordinate);
        this.roomCount++;
    }
    hasRoom(coordinate){
        for (const roomCount in this.roomMap){
            if (coordinate.equal(this.roomMap[roomCount].coordinate)){
                return true;
            }
        }
        return false;
    }
    getRoom(coordinate){
        for (const roomCount in this.roomMap){
            if (coordinate.equal(this.roomMap[roomCount].coordinate)){
                return this.roomMap[roomCount];
            }
        }
        return null;
    }
    update(){
        this.roomMap[this.activeRoom].update();
    }
    draw(){
        this.roomMap[this.activeRoom].draw();
    }
}
class Room {
    constructor(number, coordinate) {
        this.number = number;
        this.monsterList = [];
        this.exitMap = {};
        this.coordinate = coordinate;
        this.exitWidthRatio = 0.1;
        this.exitHeightRatio = 0.02;
        this.createFourExits();
        this.createExitDimensions();
    }
    createFourExits(){
        for (const direction in Direction){
            this.exitMap[Direction[direction]] = new Exit(Direction[direction], this.coordinate);
        }
    }
    createExitDimensions(){
        const wRatio = this.exitWidthRatio;
        const hRatio = this.exitHeightRatio;
        for (const exit in this.exitMap){
            switch(this.exitMap[exit].direction){
                case "right":
                    this.exitMap[exit].x = canvas.width - canvas.width * hRatio;
                    this.exitMap[exit].y = canvas.height/2 - canvas.height * wRatio/2;
                    this.exitMap[exit].width = canvas.width * hRatio;
                    this.exitMap[exit].height = canvas.height * wRatio;
                    break;
                case "left":
                    this.exitMap[exit].x = 0;
                    this.exitMap[exit].y = canvas.height/2 - canvas.height * wRatio/2;
                    this.exitMap[exit].width = canvas.width * hRatio;
                    this.exitMap[exit].height = canvas.height * wRatio;
                    break;
                case "up":
                    this.exitMap[exit].x = canvas.width/2 - canvas.width * wRatio/2;
                    this.exitMap[exit].y = 0;
                    this.exitMap[exit].width = canvas.width * wRatio;
                    this.exitMap[exit].height = canvas.height * hRatio;
                    break;
                case "down":
                    this.exitMap[exit].x = canvas.width/2 - canvas.width * wRatio/2;
                    this.exitMap[exit].y = canvas.height - canvas.height * hRatio;
                    this.exitMap[exit].width = canvas.width * wRatio;
                    this.exitMap[exit].height = canvas.height * hRatio;
                    break;
                default:
                    throw "No exit direction given";
            }
        }
    }
    drawExits(){
        ctx.strokeStyle = "blue";
        for (const exit in this.exitMap){
            const currExit = this.exitMap[exit];
            ctx.rect(currExit.x, currExit.y, currExit.width, currExit.height);
        }
        ctx.stroke();
    }
    getCoord(){
        return this.coordinate;
    }
    update(){
        this.playerExitCheck();
    }
    playerExitCheck(){
        for(const exit in this.exitMap){
            if (this.exitMap[exit].containsPoint(player)){
                this.exitMap[exit].generateRoom();
            }
        }
    }
    draw(){
        this.drawExits();
    }
}
class Exit {
    constructor(direction, roomCoord) {
        this.direction = direction;
        this.roomCoord = roomCoord;
        this.exitCoord = this.getExitCoord(this.roomCoord);
    }
    getExitCoord(roomCoord){
        switch(this.direction){
            case "right":
                return roomCoord.shiftRight();
            case "left":
                return roomCoord.shiftLeft();
            case "up":
                return roomCoord.shiftUp();
            case "down":
                return roomCoord.shiftDown();
            default:
                throw "Exit has no direction";
        }
    }
    movePlayer(){
        if(typeof(labyrinth.getRoom(getExitCoord())) === Coordinate){

        }
        else {
            labyrinth.createRoom(getExitCoord());
        }
    }
    containsPoint(player){
        return this.x <= player.x && player.x <= this.x + this.width &&
        this.y <= player.y && player.y <= this.y + this.height;
    }
    generateRoom(){
        if(labyrinth.hasRoom(this.exitCoord)){
            labyrinth.activeRoom = labyrinth.getRoom(this.exitCoord).number;
        }
        else{
            labyrinth.createRoom(this.exitCoord);
            labyrinth.activeRoom = labyrinth.roomCount - 1;
        }
    }
}
class Controller {
    constructor() {
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
    update() {
        this.xVelocity = this.yVelocity = 0;
        if (this.left === true) {
            this.xVelocity -= 1;
        }
        if (this.right === true) {
            this.xVelocity += 1;
        }
        if (this.up === true) {
            this.yVelocity -= 1;
        }
        if (this.down === true) {
            this.yVelocity += 1;
        }
        this.normalize();
    }
    getInput() {
        return new Vector(this.xVelocity, this.yVelocity);
    }
    getNormalizeInput() {
        return this.getInput().unit();
    }
    normalize() {
        const magnitude = this.magnitude;
        if (magnitude !== 0) {
            this.xVelocity = this.xVelocity * Math.abs(this.xVelocity) / magnitude;
            this.yVelocity = this.yVelocity * Math.abs(this.yVelocity) / magnitude;
        }
    }
}
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }
    fixedUpdate(x, y) {
        this.x = x;
        this.y = y;
    }
    followUpdate(object) {
        this.x = typeof (object.x) === "number" ? object.x : this.x;
        this.y = typeof (object.y) === "number" ? object.y : this.y;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
}


function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNum(min, max) {
    return Math.random() * (max - min) + min;
}

function rollSpeed(min, max) {
    const xSpeed = randomNum(min, max);
    const ySpeed = randomNum(min, max);
    if (xSpeed === 0 && ySpeed === 0) {
        return rollSpeed(min, max);
    }
    else {
        return {
            "xVelocity": xSpeed,
            "yVelocity": ySpeed
        };
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function keyDownCheck(e) {
    switch (e.key) {
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
    switch (e.key) {
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
let gameMap = new GameMap();
const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
canvas.width = gameMap.x;
canvas.height = gameMap.y;
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
document.onkeydown = keyDownCheck;
document.onkeyup = keyUpCheck;
let game_objects = [];
let player = new Player();
let controller = new Controller();
let camera = new Camera();
let labyrinth = new Labyrinth();
function game_cycle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    controller.update();
    player.update();
    labyrinth.update();
    camera.fixedUpdate(0, 0);
    player.draw();
    labyrinth.draw();
    requestAnimationFrame(game_cycle);
}
requestAnimationFrame(game_cycle);