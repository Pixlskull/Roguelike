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
        super(x, y);
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
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.direction = 0;
        this.radius = 10;
        this.color = "black";
        this.wallCollisionBehavior = {};
        //Default behavior of a circle when hitting a wall is to just prevent furthur movement in that direction
        this.wallCollisionBehavior[Direction.LEFT] = function(){this.xVelocity = 0; this.x = gameMap.x + this.radius;};
        this.wallCollisionBehavior[Direction.RIGHT] = function(){this.xVelocity = 0; this.x = gameMap.x + gameMap.width - this.radius;};
        this.wallCollisionBehavior[Direction.UP] = function(){this.yVelocity = 0; this.y = gameMap.y + this.radius;};
        this.wallCollisionBehavior[Direction.DOWN] = function(){this.yVelocity = 0; this.y = gameMap.y + gameMap.height - this.radius;};
    }
    get area() {
        return Math.PI * this.radius ** 2;
    }
    update() {
        this.x += this.xVelocity;
        this.y += this.yVelocity;
        this.wallCollisionCheck();
    }
    draw() {
        const drawRange = 200;
        const drawX = this.x - camera.getX();
        const drawY = this.y - camera.getY();
        // //The if statement is just there in case there are no walls on the game map
        // if (drawX < gameMap.width + drawRange && drawX > 0 - drawRange &&
        //     drawY < gameMap.height + drawRange && drawY > 0 - drawRange
        // ) {
        ctx.strokeStyle = "color";
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2, true);
        ctx.stroke();
    }
    wallCollisionCheck(){
        //Runs a function when a circle hits a wall
        if (this.x - this.radius < gameMap.x) {
            this.wallCollisionBehavior[Direction.LEFT].bind(this)();
        }
        else if (this.x + this.radius > gameMap.width + gameMap.x) {
            this.wallCollisionBehavior[Direction.RIGHT].bind(this)();
        }
        if (this.y - this.radius < gameMap.y) {
            this.wallCollisionBehavior[Direction.UP].bind(this)();
        }
        else if (this.y + this.radius > gameMap.height + gameMap.y) {
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
}
class Player extends Circle {
    constructor() {
        super(0, 0);
        this.x = (gameMap.width + gameMap.x)/ 2;
        this.y = (gameMap.height + gameMap.y)/ 2;
        this.xVelocityTop = gameMap.width / 150;
        this.yVelocityTop = gameMap.height / 150;
        this.hp = 1000;
        this.faction = Faction.PLAYER;
        this.lastX = 0;
        this.lastY = 0;
        this.usedExit = false;
        this.bulletCycleTime = 250;
        this.lastBulletCycle = new Date();
        this.alive = true;
    }
    static get faction(){
        return Faction.PLAYER;
    }
    update() {
        if (this.hp <= 0){
            console.log("dead");
            labyrinth.playerAlive = false;
        }
        const inputVector = controller.getNormalizeInput();
        this.xVelocity = inputVector.x * this.xVelocityTop;
        this.yVelocity = inputVector.y * this.yVelocityTop;
        super.update();
        if(controller.mouse === true){
            this.shoot();
        }
    }

    draw() {
        super.draw();
    }
    shoot(){
        if (new Date() - this.lastBulletCycle > this.bulletCycleTime){
            labyrinth.createBullet(new BasicBullet(this.x, this.y, getMousePos(canvas, controller.e), 1, 5, 7000/2, 10, this));
            this.lastBulletCycle = new Date();
        }
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
class Enemy extends Circle {
    //Base enemy class, contains all the functions
    constructor(x, y, hp, hpMod){
        super(x, y);
        this.hp = hp * hpMod;
        this.movementCycleTime = 100;
        this.lastMovementCycle = new Date();
        this.bulletCycleTime = 1000;
        this.lastBulletCycle = new Date();
        this.behavior = this.keepDistance;
        this.bulletBehavior = this.basicShoot;
        this.behaviorParam = [];
        this.bulletBehaviorParam = [];
        this.faction = Faction.ENEMY;
        this.radius = 10;
        this.alive = true;
        this.idleSpeedVector = {x: 0, y: 0};
        this.symbol = "e";
    }
    static get faction(){
        return Faction.ENEMY;
    }
    static get scoreObjectList(){
        const enemyScoreList = [];
        for (const enemy of GlobalEnemyList){
            enemyScoreList.push(new EnemyScore(enemy));
        }
        return enemyScoreList;
    }
    static get scoreList(){
        return this.scoreObjectList.map(object => object.enemyScore);
    }
    update(){
        if (this.hp <= 0){
            this.alive = false;
        }
        const currentTime = new Date();
        if (currentTime - this.lastMovementCycle > this.movementCycleTime){
            this.behavior.apply(this, this.behaviorParam);
            this.xVelocity +=  (Math.random()-0.5) * this.idleSpeedVector.x;
            this.yVelocity +=  (Math.random()-0.5) * this.idleSpeedVector.y;
            this.lastMovementCycle = new Date();
        }
        this.bulletBehavior.apply(this, this.bulletBehaviorParam);
        super.update();
    }
    draw(){
        super.draw();
        ctx.strokeStyle = "black";
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.stroke();
    }
    chase(speed){
        //Moves the enemy towards the player
        const chaseSpeed = speed;
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
    keepDistance(speed, dist){
        //Same as chase, but the enemy will stop moving if it gets within a certain distance from the player
        const chaseSpeed = speed;
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
        this.xVelocity = 0;
        this.yVelocity = 0;
    }
    basicShoot(damage, speed, lifetime, radius){
        if (new Date() - this.lastBulletCycle > this.bulletCycleTime){
            labyrinth.createBullet(new BasicBullet(this.x, this.y, player, damage, speed, lifetime, radius, this));
            this.lastBulletCycle = new Date();
        }
    }
    predicationShoot(damage, speed, lifetime, radius, target){
        //not working yet
        if (new Date() - this.lastBulletCycle > this.bulletCycleTime){
            labyrinth.createBullet(new BasicBullet(this.x, this.y, player, damage, speed, lifetime, radius, this));
            this.lastBulletCycle = new Date();
        }
    }
    multiShotCircular(damage, speed, lifetime, radius, bulletCount){
        //Shoots equally spaced circles around the enemy
        const currentTime = new Date();
        if (currentTime - this.lastBulletCycle > this.bulletCycleTime){
            for (let j = 0; j < bulletCount; j ++){
                labyrinth.createBullet(new AngleBullet(this.x, this.y, j * (2 * Math.PI / bulletCount), 10, this));
            }
            this.lastBulletCycle = new Date();
        }
    }
    multiShotAimed(damage, speed, lifetime, radius, bulletCount, spread){
        //Shoots a spread of bullets with the center aimed at the player
        //If an even amount of bullets is shot, no bullet will be on a direct collision course with the player
        const currentTime = new Date();
        if (currentTime - this.lastBulletCycle > this.bulletCycleTime){
            const spreadRad = spread * Math.PI / 180;
            const playerAngle = Math.atan2(player.y - this.y, player.x - this.x);
            for (let j = 0; j < bulletCount; j ++){
                labyrinth.createBullet(new AngleBullet(this.x, this.y, playerAngle + spreadRad * (j - (bulletCount-1)/2), damage, speed, lifetime, radius, this));
            }
            this.lastBulletCycle = new Date();
        }
    }
    cycle(cycleParam){
        if(!cycleParam.hasOwnProperty("behaviors") || 
        !cycleParam.hasOwnProperty("behaviorParams") ||
        !cycleParam.hasOwnProperty("behaviorCycleTimes")
        ){
            throw "cycleParam does not have all necessary properties";
        }
        if (this.behaviorCycleBegin === undefined){
            this.behaviorCycleBegin = new Date();
            this.currentBehavior = 0;
        }
        let currentTime = new Date();
        if (currentTime - this.behaviorCycleBegin > cycleParam.behaviorCycleTimes[this.currentBehavior]){
            this.currentBehavior +=1;
            if(this.currentBehavior >= cycleParam.behaviors.length){
                this.currentBehavior = 0;
            }
            this.behaviorCycleBegin = new Date();
        }
        let currentBehavior = cycleParam.behaviors[this.currentBehavior];
        let currentBehaviorParam = cycleParam.behaviorParams[this.currentBehavior];
        currentBehavior.apply(this, currentBehaviorParam);
    }
}
class Zombie extends Enemy{
    constructor(x, y, hpMod, damageMod, speedMod){
        super(x, y, 5, hpMod);
        this.bulletCycleTime = 500;
        this.behavior = this.chase;
        this.behaviorParam = [2];
        this.bulletBehavior = this.basicShoot;
        this.bulletBehaviorParam = [10, 3, 10000, 15];
        this.radius = 10;
        this.symbol = "z";
        this.idleSpeedVector = {x: 2, y: 2};
    }
    static get score(){
        return 1;
    }
}
class Sentry extends Enemy{
    //Stays still and shoots a spread of bullets at the player
    constructor(x, y, hpMod){
        super(x, y, 10, hpMod);
        this.bulletCycleTime = 1000;
        this.behavior = this.noMovement;
        this.bulletBehavior = this.multiShotAimed;
        this.bulletBehaviorParam = [10, 8, 7000/2, 7, 3, 15];
        this.radius = 10;
        this.symbol = "S";
        this.idleSpeedVector = {x: 0, y: 0};
    }
    static get score(){
        return 2;
    }
}
class Bull extends Enemy{
    //Will cycle between standing still and charging the player
    constructor(x, y, hpMod){
        super(x, y, 5, hpMod);
        this.bulletCycleTime = 100;
        this.behavior = this.cycle;
        this.behaviorParam = [{
            behaviors: [this.noMovement, this.keepDistance],
            behaviorParams: [[],[5, 30]],
            behaviorCycleTimes: [1500, 1500]
        }];
        this.bulletBehavior = this.multiShotAimed;
        this.bulletBehaviorParam = [1, 10, 100, 4, 5, 10];
        this.radius = 10;
        this.symbol = "b";
        this.idleSpeedVector = {x: 2, y: 2};
    }
    update(){
        super.update();
    }
    static get score(){
        return 4;
    }
}
class Librarian extends Enemy{
    constructor(x, y, hpMod){

    }
}
class Bullet extends Circle{
    //Base class for bullets
    constructor(x, y, xVelocity, yVelocity, damage, speed, lifetime, radius, creator){
        super(x, y);
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
        this.damage = damage;
        this.speed = speed;
        this.lifetime = lifetime;
        this.radius = radius;
        this.creator = creator;
        this.faction = creator.constructor.faction;
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
            console.log("hit");
            object.hp -= this.damage;
            object.lastHit = this.creator.constructor.name;
            this.alive = false;
        }
    }
}
class BasicBullet extends Bullet{
    //Uses a vector/anything with an x and y value for targeting. 
    constructor(x, y, target, damage, speed, lifetime, radius, creator){
        super(x, y, 0, 0, damage, speed, lifetime, radius, creator);
        this.target = target;
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
    constructor(x, y, angle, damage, speed, lifetime, radius, creator){
        super(x, y, 0, 0, damage, speed, lifetime, radius, creator);
        this.angle = angle;
        this.faction = creator.constructor.faction;
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




class GameMap {
    //This is used in case the moveable area is less than the size of the canvas
    //Isn't functioning yet
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 600;
        this.height = 600;
        this.xCenter = (this.width + this.x)/2;
        this.yCenter = (this.height + this.y)/2;
    }

}

class Labyrinth {
    constructor() {
        this.roomMap = {};
        this.roomCount = 0;
        this.activeRoom = 0;
        this.initBool = false;
        this.playerAlive = true;
        this.createRoom(new Coordinate(0, 0));
    }
    init(){
        this.roomMap[this.activeRoom].init();
    }
    update() {
        if (!this.initBool){
            this.init();
            this.initBool = true;
        }
        (!this.playerAlive) ? this.roomMap[this.activeRoom].deadUpdate() : this.roomMap[this.activeRoom].update()
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
    moveToRoom(exit) {
        //Uses the coordinates specified by the exit to create a new room
        //Also moves the player to that room
        if (this.hasRoom(exit.exitCoord)) {
            this.activeRoom = labyrinth.getRoom(exit.exitCoord).number;
        }
        else {
            this.createRoom(exit.exitCoord);
            this.activeRoom = this.roomCount - 1;
        }
        player.load(exit);
        this.initBool = false;
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
        this.enemyGeneration();
        this.enemyList.push(player);
        this.createFourExits();
        this.createExitDimensions();
    }
    init(){
        this.bulletList = [];
        this.enemyList.map(enemy => enemy.lastBulletCycle = new Date());
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
        this.deadDraw();      
    }
    deadUpdate(){
        
    }
    deadDraw(){
        if(!labyrinth.playerAlive){
            ctx.font = "32px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("You were killed by " + player.lastHit, gameMap.xCenter, gameMap.yCenter);
        }
        ctx.font = "10px sans-serif";
    }
    enemyGeneration(){
        let roomScore = Math.floor(this.number * Math.sqrt(this.number));
        const maxScore = 1000;
        const maxEnemyCount = 10;
        let enemyConstructorList = [];
        let enemyList = [];
        const currentMaxScore = Math.min(roomScore, maxScore)
        let enemyTotalScore = Math.ceil(0.5 * currentMaxScore + Math.random() * currentMaxScore/2);
        roomScore -= enemyTotalScore;
        while (enemyConstructorList.length < maxEnemyCount && enemyTotalScore > 0){
            //Randomly creates enemies
            let scoreRoll = Math.ceil(currentMaxScore * (Math.random() ** ((enemyConstructorList.length + 1)/2)));
            //The exponent increases the likelyhood of selecting a stronger enemy for the first 3 enemies
            //After 4 enemies, there is a greater chance of selecting a weaker enemy
            let enemyScoreRoll = Enemy.scoreList.reduce(function (prev, curr) {
                return (Math.abs(curr - scoreRoll) < Math.abs(prev - scoreRoll) ? curr : prev);
            });
            enemyTotalScore -= enemyScoreRoll;
            const potentialEnemyList = [];
            for (const score of Enemy.scoreObjectList){
                if (score.enemyScore === enemyScoreRoll){
                    potentialEnemyList.push(score.enemyConstructor);
                }
            }
            if(potentialEnemyList.length === 0){
                throw "Found No Potential Enemies";
            }
            enemyConstructorList.push(potentialEnemyList[Math.floor(Math.random() * potentialEnemyList.length)]);
        }
        roomScore += enemyTotalScore;
        const bulletBuff = 0;
        roomScore -= bulletBuff;
        const hpModifier = 1 + roomScore / 1000;
        for (let enemyConstructor of enemyConstructorList){
            enemyList.push(new enemyConstructor(
                uniDistribution(gameMap.xCenter, gameMap.width/24), 
                uniDistribution(gameMap.yCenter, gameMap.height/24), 
                hpModifier
            ));
        }
        this.enemyList = enemyList;
    }
    createEnemy(enemy){
        this.enemyList.push(enemy);
    }
    enemyUpdate(){
        this.enemyList.map(enemy => enemy.update());
        this.enemyList = this.findLiving(this.enemyList);
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
        ctx.fillText(text, gameMap.xCenter, gameMap.yCenter);
        ctx.stroke();
    }
    playerExitCheck() {
        //checks if the center of a player is in an exit
        //the exit will not activate again until the player leaves the exit
        if (!player.usedExit) {
            for (const exit in this.exitMap) {
                if (this.exitMap[exit].containsPoint(player)) {
                    player.usedExit = true;
                    labyrinth.moveToRoom(this.exitMap[exit]);
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
                    this.exitMap[exit].x = gameMap.width + gameMap.x - gameMap.width * hRatio;
                    this.exitMap[exit].y = gameMap.yCenter - gameMap.height * wRatio / 2;
                    this.exitMap[exit].width = gameMap.width * hRatio;
                    this.exitMap[exit].height = gameMap.height * wRatio;
                    break;
                case "left":
                    this.exitMap[exit].x = gameMap.x;
                    this.exitMap[exit].y = gameMap.yCenter - gameMap.height * wRatio / 2;
                    this.exitMap[exit].width = gameMap.width * hRatio;
                    this.exitMap[exit].height = gameMap.height * wRatio;
                    break;
                case "up":
                    this.exitMap[exit].x = gameMap.xCenter - gameMap.width * wRatio / 2;
                    this.exitMap[exit].y = gameMap.y;
                    this.exitMap[exit].width = gameMap.width * wRatio;
                    this.exitMap[exit].height = gameMap.height * hRatio;
                    break;
                case "down":
                    this.exitMap[exit].x = gameMap.xCenter - gameMap.width * wRatio / 2;
                    this.exitMap[exit].y = gameMap.height - gameMap.height * hRatio;
                    this.exitMap[exit].width = gameMap.width * wRatio;
                    this.exitMap[exit].height = gameMap.height * hRatio;
                    break;
                default:
                    throw "No exit direction given";
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
        this.mouse = false;
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

class EnemyScore{
    constructor(enemyConstructor){
        this.enemyConstructor = enemyConstructor;
        this.enemyScore = enemyConstructor.score;
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
function uniDistribution(center, spread){
    return center + spread * 2 * (Math.random() - 0.5);
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}
function keyDownCheck(e) {
    switch (e.key) {
        case "a":
            controller.left = true;
            break;
        case "d":
            controller.right = true;
            break;
        case "w":
            controller.up = true;
            break;
        case "s":
            controller.down = true;
            break;
    }
}

function keyUpCheck(e) {
    switch (e.key) {
        case "a":
            controller.left = false;
            break;
        case "d":
            controller.right = false;
            break;
        case "w":
            controller.up = false;
            break;
        case "s":
            controller.down = false;
            break;
    }
}
function mouseDown(e){
    controller.mouse = true;
}
function mouseUp(e){
    controller.mouse = false;
}
function mouseMove(e){
    controller.e = e;
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
document.onmousedown = mouseDown;
document.onmouseup = mouseUp;
document.onmousemove = mouseMove;
let GlobalEnemyList = [Zombie, Sentry, Bull];
let player = new Player();
let controller = new Controller();
let camera = new Camera();
let labyrinth = new Labyrinth();
function game_cycle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    controller.update();
    labyrinth.update();
    camera.fixedUpdate(0, 0);
    labyrinth.draw();
    requestAnimationFrame(game_cycle);
}
requestAnimationFrame(game_cycle);