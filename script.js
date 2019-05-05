const Direction = {
    RIGHT: "right",
    LEFT: "left",
    UP: "up",
    DOWN: "down"
};
const Faction = {
    ENEMY: "enemy",
    PLAYER: "player"
}
class Vector {
    //thanks rohan
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
        //I don't know why there's a ternary checking for if b is null
        //since the normalizeArgs function should get rid of null
        //but I'm assuming the ternary is there for a good reason.
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
        //makes sure that nothing is ever divided by 0
        this.x /= (a != 0) ? a : 1;
        this.y /= (b != null && b != 0) ? b : (a != 0) ? a : 1;

        return this;
    }
}

class Coordinate extends Vector {
    //Used for the rooms in the labyrinth
    constructor(x = -1, y = -1) {
        super();
        this.x = x;
        this.y = y;
    }
    static cabDistance(coord1, coord2) {
        return Math.abs(coord2.x - coord1.x) + Math.abs(coord2.y - coord1.y)
    }
    addX(x) {
        //works for subtraction I guess
        this.x += x;

        return this;
    }
    addY(y) {
        this.y += y;

        return this;
    }
    clone() {
        return new Coordinate(this.x, this.y);
    }
    shiftUp() {
        //I was lazy
        return this.clone().addY(1);
    }
    shiftDown() {
        return this.clone().addY(-1);
    }
    shiftRight() {
        return this.clone().addX(1);
    }
    shiftLeft() {
        return this.clone().addX(-1);
    }
    equal(coordinate) {
        if (this.x === coordinate.x && this.y === coordinate.y) {
            return true;
        }
        return false;
    }

}
class Circle {
    constructor() {
        this.x = null;
        this.y = null;
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.direction = 0;
        this.radius = 10;
        this.color = "black";
        this.wallCollisionBehavior = {};
        //Default behavior of a circle when hitting a wall is to just prevent furthur movement in that direction
        this.wallCollisionBehavior[Direction.LEFT] = function(){this.xVelocity = 0; this.x = 0 + this.radius;};
        this.wallCollisionBehavior[Direction.RIGHT] = function(){this.xVelocity = 0; this.x = gameMap.width - this.radius;};
        this.wallCollisionBehavior[Direction.UP] = function(){this.yVelocity = 0; this.y = 0 + this.radius;};
        this.wallCollisionBehavior[Direction.DOWN] = function(){this.yVelocity = 0; this.y = gameMap.height - this.radius;};
    }
    get area() {
        return Math.PI * this.radius ** 2;
    }
    update() {
        this.x += this.xVelocity;
        this.y += this.yVelocity;
        this.wallCollisionCheck();
    //     if (this.x - this.radius < 0) {
    //         this.xVelocity = 0;
    //         this.x = 0 + this.radius;
    //     }
    //     else if (this.x + this.radius > gameMap.width) {
    //         this.xVelocity = 0;
    //         this.x = gameMap.width - this.radius;
    //     }

    //     if (this.y - this.radius < 0) {
    //         this.yVelocity = 0;
    //         this.y = 0 + this.radius;
    //     }
    //     else if (this.y + this.radius > gameMap.height) {
    //         this.yVelocity = 0;
    //         this.y = gameMap.height - this.radius;
    //     }
    }
    draw() {
        const drawRange = 200;
        const drawX = this.x - camera.getX();
        const drawY = this.y - camera.getY();
        //The if statement is just there in case there are no walls on the game map
        if (drawX < gameMap.width + drawRange && drawX > 0 - drawRange &&
            drawY < gameMap.height + drawRange && drawY > 0 - drawRange
        ) {
            ctx.strokeStyle = "color";
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2, true);
            ctx.stroke();
        }
    }
    wallCollisionCheck(){
        //Runs a function when a circle hits a wall
        if (this.x - this.radius < 0) {
            this.wallCollisionBehavior[Direction.LEFT].bind(this)();
        }
        else if (this.x + this.radius > gameMap.width) {
            this.wallCollisionBehavior[Direction.RIGHT].bind(this)();
        }
        if (this.y - this.radius < 0) {
            this.wallCollisionBehavior[Direction.UP].bind(this)();
        }
        else if (this.y + this.radius > gameMap.height) {
            this.wallCollisionBehavior[Direction.DOWN].bind(this)();
        }
    }
}
class StaticCircle extends Circle {
    //Not used
    constructor() {
        super();
        this.x = randomNum(0, gameMap.width);
        this.y = randomNum(0, gameMap.height);
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
    //Also not used, yet
    constructor() {
        super();
        this.x = gameMap.width / 2;
        this.y = gameMap.height / 2;
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
class Enemy extends Circle {
    //Base enemy class, contains all the functions
    constructor(x, y, hp){
        super();
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.bulletCycleTime = 1000;
        this.lastBulletCycle = new Date();
        this.behavior = this.keepDistance;
        this.faction = Faction.ENEMY;
        this.radius = 10;
        this.idleSpeedVector = new Vector(2,2);
    }
    update(){
        super.update();
    }
    draw(){
        super.draw();
    }
    idle(){
        //Randomly jitters around
        this.xVelocity = (Math.random() - 0.5) * this.idleSpeedVector.x;
        this.yVelocity = (Math.random() - 0.5) * this.idleSpeedVector.y;
    }
    chase(){
        //Moves the enemy towards the player
        const chaseSpeed = 3;
        const chaseDistX = player.x - this.x;
        const chaseDistY = player.y - this.y;
        const chaseVector = new Vector(chaseDistX, chaseDistY);
        //The clamp function makes sure that the movement velocity is decreased 
        //if the enemy is extremly close to the player
        //Ex: if normally the chase velocity is 3, but the player is 2.5 pixels away, 
        // the velocity would be set to 2.5
        this.xVelocity = clamp(chaseVector.unit().x * chaseSpeed, -Math.abs(chaseDistX), Math.abs(chaseDistX));
        this.yVelocity = clamp(chaseVector.unit().y * chaseSpeed, -Math.abs(chaseDistY), Math.abs(chaseDistY));
    }
    keepDistance(dist){
        //Same as chase, but the enemy will stop moving if it gets within a certain distance from the player
        const chaseSpeed = 3;
        const chaseDistX = player.x - this.x;
        const chaseDistY = player.y - this.y;
        const chaseVector = new Vector(chaseDistX, chaseDistY);
        if (chaseVector.magnitude > dist){
            const stableDistX = player.x - this.x - chaseVector.unit().x * dist;
            const stableDistY = player.y - this.y - chaseVector.unit().y * dist;
            this.xVelocity = clamp(chaseVector.unit().x * chaseSpeed, -Math.abs(stableDistX), Math.abs(stableDistX));
            this.yVelocity = clamp(chaseVector.unit().y * chaseSpeed, -Math.abs(stableDistY), Math.abs(stableDistY));
        }
        else{
            this.xVelocity = 0;
            this.yVelocity = 0;
        }
    }
    noMovement(){
        //intentionally left blank
    }
    basicShoot(){
        const currentTime = new Date();
        if (currentTime - this.lastBulletCycle > this.bulletCycleTime){
            labyrinth.createBullet(new BasicBullet(this.x, this.y, player, 10, this.faction));
            this.lastBulletCycle = new Date();
        }
    }
    multiShotCircular(bulletCount){
        //Shoots equally spaced circles around the enemy
        const currentTime = new Date();
        if (currentTime - this.lastBulletCycle > this.bulletCycleTime){
            for (let j = 0; j < bulletCount; j ++){
                labyrinth.createBullet(new AngleBullet(this.x, this.y, j * (2 * Math.PI / bulletCount), 5, this.faction));
            }
            this.lastBulletCycle = new Date();
        }
    }
    multiShotAimed(bulletCount, spread){
        //Shoots a spread of bullets with the center aimed at the player
        //If an even amount of bullets is shot, no bullet will be on a direct collision course with the player
        const currentTime = new Date();
        if (currentTime - this.lastBulletCycle > this.bulletCycleTime){
            const spreadRad = spread * Math.PI / 180;
            const playerAngle = Math.atan2(player.y - this.y, player.x - this.x);
            for (let j = 0; j < bulletCount; j ++){
                labyrinth.createBullet(new AngleBullet(this.x, this.y, playerAngle + spreadRad * (j - (bulletCount-1)/2), 10, this.faction));
            }
            this.lastBulletCycle = new Date();
        }
    }
}
class Sentry extends Enemy{
    //Stays still and shoots a spread of bullets at the player
    constructor(x, y, hp){
        super();
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.bulletCycleTime = 1000;
        this.lastBulletCycle = new Date();
        this.behavior = this.noMovement;
        this.radius = 10;
    }
    update(){
        this.behavior();
        this.multiShotAimed(7, 15);
        super.update();
    }
    draw(){
        super.draw();
    }
}
class Bullet extends Circle{
    //Base class for bullets
    constructor(x, y, xVelocity, yVelocity, damage, lifetime, radius){
        super();
        this.x = x;
        this.y = y;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
        this.damage = damage;
        this.lifetime = lifetime;
        this.radius = radius;
        this.lifeStart = new Date();
        this.behavior = this.linear;
        this.alive = true;
    }
    update(){        
        super.update();
        this.behavior();
        this.lifeDecay();
    }
    draw(){
        super.draw();
    }
    lifeDecay(){
        const currentTime = new Date();
        if (currentTime - this.lifeStart > this.lifetime){
            this.alive = false;
        }
    }
    linear(){
        function mapBorderCheckCallback(){
            this.alive = false;
        }
        this.wallCollisionBehavior[Direction.LEFT] = mapBorderCheckCallback;
        this.wallCollisionBehavior[Direction.RIGHT]= mapBorderCheckCallback;
        this.wallCollisionBehavior[Direction.UP] = mapBorderCheckCallback;
        this.wallCollisionBehavior[Direction.DOWN] = mapBorderCheckCallback;
    }
    collisionCheck(object){
        if ((this.x - object.x)**2 + (this.y - object.y)**2 <= (this.radius + object.radius)**2 &&
            (this.faction != object.faction))
        {
            object.hp -= this.damage;
            this.alive = false;
            console.log("player hit");
        }
    }
}
class BasicBullet extends Bullet{
    //Uses a vector/anything with an x and y value for targeting. 
    constructor(x, y, target, speed, faction){
        super();
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = speed;
        this.damage = 5;
        this.lifetime = 1000;
        this.faction = faction;
        this.radius = 10;
        this.calculateVelocity();
    }
    calculateVelocity(){
        let targetVector = new Vector(this.target.x - this.x, this.target.y - this.y);
        if (targetVector.magnitude === 0){
            targetVector = new Vector(Math.random() - 0.5, Math.random() - 0.5);
        }
        this.xVelocity = targetVector.unit().x * this.speed;
        this.yVelocity = targetVector.unit().y * this.speed;

    }
    update(){
        super.update();
    }
    draw(){
        super.draw();
    }
}
class AngleBullet extends Bullet{
    //Uses an angle in radians for targeting
    constructor(x, y, angle, speed, faction){
        super();
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.angle = angle;
        this.damage = 5;
        this.lifetime = 7000/speed;
        this.faction = faction;
        this.radius = 10;
        this.calculateVelocity();
    }
    calculateVelocity(){
        this.xVelocity = Math.cos(this.angle) * this.speed;
        this.yVelocity = Math.sin(this.angle) * this.speed;
    }
    draw(){
        super.draw();
    }
}
class Player extends Circle {
    constructor() {
        super();
        this.x = gameMap.width / 2;
        this.y = gameMap.height / 2;
        this.xVelocityTop = gameMap.width / 150;
        this.yVelocityTop = gameMap.height / 150;
        this.hp = 100;
        this.faction = Faction.PLAYER;
        this.lastX = 0;
        this.lastY = 0;
        this.usedExit = false;
    }

    update() {
        const inputVector = controller.getNormalizeInput();
        this.xVelocity = inputVector.x * this.xVelocityTop;
        this.yVelocity = inputVector.y * this.yVelocityTop;
        super.update();
    }

    draw() {
        super.draw();
    }

    load(exit){
        switch(exit.direction){
            //temporary solution
            case("right"):
                this.x = gameMap.width-this.x;
                break;
            case("left"):
                this.x = gameMap.width-this.x;             
                break;
            case("up"):
                this.y = gameMap.height-this.y;
                break;
            case("down"):
                this.y = gameMap.height-this.y;
                break;
            default:
                throw "No exit direction given";
        }
    }
}

class GameMap {
    //This is used in case the moveable area is less than the size of the canvas
    //Isn't functioning yet
    constructor() {
        this.x;
        this.y;
        this.width = 600;
        this.height = 600;
    }

}
class Labyrinth {
    constructor() {
        this.roomMap = {};
        this.roomCount = 0;
        this.activeRoom = 0;
        this.createRoom(new Coordinate(0, 0));
    }
    update() {
        this.roomMap[this.activeRoom].update();
    }
    draw() {
        this.roomMap[this.activeRoom].draw();
    }
    createEnemy(enemy){
        this.roomMap[this.activeRoom].createEnemy(enemy);
    }
    createBullet(bullet){
        this.roomMap[this.activeRoom].createBullet(bullet)
    }
    createRoom(coordinate) {
        if (!(coordinate instanceof Coordinate)) {
            throw "No coordinate provided for createRoom()";
        }
        this.roomMap[this.roomCount] = new Room(this.roomCount, coordinate);
        this.roomCount++;
    }
    hasRoom(coordinate) {
        //Checks if a room exists at a specified coordinate 
        for (const roomCount in this.roomMap) {
            if (coordinate.equal(this.roomMap[roomCount].coordinate)) {
                return true;
            }
        }
        return false;
    }
    getRoom(coordinate) {
        //Checks if a room exists at a specified coordinate and returns a room if it exists
        for (const roomCount in this.roomMap) {
            if (coordinate.equal(this.roomMap[roomCount].coordinate)) {
                return this.roomMap[roomCount];
            }
        }
        return null;
    }
    generateRoom(exit) {
        //Uses the coordinates specified by the exit to create a new room
        if (this.hasRoom(exit.exitCoord)) {
            this.activeRoom = labyrinth.getRoom(exit.exitCoord).number;
        }
        else {
            this.createRoom(exit.exitCoord);
            this.activeRoom = this.roomCount - 1;
        }
        player.load(exit);
    }
}

class Room {
    constructor(number, coordinate) {
        this.number = number;
        this.exitMap = {};
        this.coordinate = coordinate;
        this.exitWidthRatio = 0.1;
        this.exitHeightRatio = 0.02;
        this.enemyList = [];
        this.bulletList = [];
        this.createFourExits();
        this.createExitDimensions();
        this.enemyList.push(player);
        this.createEnemy(new Sentry(300, 300, 10, BasicBullet));
    }
    update() {
        this.playerExitCheck();
        this.enemyUpdate();
        this.bulletUpdate();
    }
    draw() {
        this.drawCoordinate();
        this.bulletDraw();
        this.drawExits();
        this.enemyDraw();
        
        
    }
    createEnemy(enemy){
        this.enemyList.push(enemy);
    }
    enemyUpdate(){
        this.enemyList.map(enemy => enemy.update());
    }
    enemyDraw(){
        this.enemyList.map(enemy => enemy.draw());
    }
    createBullet(bullet){
        this.bulletList.push(bullet);
    }
    bulletUpdate(){
        this.bulletList.map(bullet => bullet.update());
        this.bulletList.map(bullet => this.enemyList.map(enemy => bullet.collisionCheck(enemy)));
        this.bulletList = this.findLiving(this.bulletList);
    }
    bulletDraw(){
        this.bulletList.map(bullet => bullet.draw());
    }
    findLiving(objectList){
        let livingList = [];
        for (const object in objectList){
            if(objectList[object].alive){
                livingList.push(objectList[object]);
            }
        }
        return livingList;
    }
    createFourExits() {
        for (const direction in Direction) {
            this.exitMap[Direction[direction]] = new Exit(Direction[direction], this.coordinate);
        }
    }
    createExitDimensions() {
        const wRatio = this.exitWidthRatio;
        const hRatio = this.exitHeightRatio;
        for (const exit in this.exitMap) {
            switch (this.exitMap[exit].direction) {
                case "right":
                    this.exitMap[exit].x = gameMap.width - gameMap.width * hRatio;
                    this.exitMap[exit].y = gameMap.height / 2 - gameMap.height * wRatio / 2;
                    this.exitMap[exit].width = gameMap.width * hRatio;
                    this.exitMap[exit].height = gameMap.height * wRatio;
                    break;
                case "left":
                    this.exitMap[exit].x = 0;
                    this.exitMap[exit].y = gameMap.height / 2 - gameMap.height * wRatio / 2;
                    this.exitMap[exit].width = gameMap.width * hRatio;
                    this.exitMap[exit].height = gameMap.height * wRatio;
                    break;
                case "up":
                    this.exitMap[exit].x = gameMap.width / 2 - gameMap.width * wRatio / 2;
                    this.exitMap[exit].y = 0;
                    this.exitMap[exit].width = gameMap.width * wRatio;
                    this.exitMap[exit].height = gameMap.height * hRatio;
                    break;
                case "down":
                    this.exitMap[exit].x = gameMap.width / 2 - gameMap.width * wRatio / 2;
                    this.exitMap[exit].y = gameMap.height - gameMap.height * hRatio;
                    this.exitMap[exit].width = gameMap.width * wRatio;
                    this.exitMap[exit].height = gameMap.height * hRatio;
                    break;
                default:
                    throw "No exit direction given";
            }
        }
    }
    drawExits() {
        ctx.strokeStyle = "blue";
        for (const exit in this.exitMap) {
            const currExit = this.exitMap[exit];
            ctx.rect(currExit.x, currExit.y, currExit.width, currExit.height);
            
        }
        ctx.stroke();
        ctx.strokeStyle = "black";
    }
    drawCoordinate() {
        //temporary
        ctx.strokeStyle = "black";
        const text = this.coordinate.x + " , " + this.coordinate.y;
        ctx.fillText(text, gameMap.width/2, gameMap.height/2);
        ctx.stroke();
    }
    playerExitCheck() {
        //checks if the center of a player is in an exit
        //the exit will not activate again until the player leaves the exit
        if (!player.usedExit) {
            for (const exit in this.exitMap) {
                if (this.exitMap[exit].containsPoint(player)) {
                    player.usedExit = true;
                    labyrinth.generateRoom(this.exitMap[exit]);
                    break;      
                }
            }
        }
        else {
            this.inExitBool = false;
            for (const exit in this.exitMap) {
                if (this.exitMap[exit].containsPoint(player)) {
                    this.inExitBool = true;
                    break;
                }
            }
            if (!this.inExitBool) {
                player.usedExit = false;
            }
        }

    }
}
class Exit {
    constructor(direction, roomCoord) {
        this.direction = direction;
        this.roomCoord = roomCoord;
        this.exitCoord = this.getExitCoord(this.roomCoord);
    }
    getExitCoord(roomCoord) {
        //generates coordinates for the room the exit is pointing towards
        switch (this.direction) {
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
    movePlayer() {
        if (typeof (labyrinth.getRoom(getExitCoord())) === Coordinate) {
        }
        else {
            labyrinth.createRoom(getExitCoord());
        }
    }
    containsPoint(player) {
        return this.x <= player.x && player.x <= this.x + this.width &&
            this.y <= player.y && player.y <= this.y + this.height;
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
    //isn't really useful anymore
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
canvas.width = gameMap.width;
canvas.height = gameMap.height;
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
    // player.update();
    labyrinth.update();
    camera.fixedUpdate(0, 0);
    // player.draw();
    labyrinth.draw();
    requestAnimationFrame(game_cycle);
}
requestAnimationFrame(game_cycle);