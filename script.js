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
    selfCabDistance() {
        return Math.abs(this.x) + Math.abs(this.y);
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
        this.hp;
        this.color = "black";
        this.wallCollisionBehavior = {};
        //Default behavior of a circle when hitting a wall is to just prevent furthur movement in that direction
        this.wallCollisionBehavior[Direction.LEFT] = function () { this.xVelocity = 0; this.x = gameMap.x + this.radius; };
        this.wallCollisionBehavior[Direction.RIGHT] = function () { this.xVelocity = 0; this.x = gameMap.x + gameMap.width - this.radius; };
        this.wallCollisionBehavior[Direction.UP] = function () { this.yVelocity = 0; this.y = gameMap.y + this.radius; };
        this.wallCollisionBehavior[Direction.DOWN] = function () { this.yVelocity = 0; this.y = gameMap.y + gameMap.height - this.radius; };
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
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2, true);
        ctx.stroke();
    }
    wallCollisionCheck() {
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
class PlayerClass extends Circle {
    constructor() {
        super(0, 0);
        this.x = (gameMap.width + gameMap.x) / 2;
        this.y = (gameMap.height + gameMap.y) / 2;
        this.xVelocityTop = gameMap.width / 150;
        this.yVelocityTop = gameMap.height / 150;
        this.hp = 1000;
        this.hpMax = this.hp;
        this.faction = Faction.PLAYER;
        this.lastX = 0;
        this.lastY = 0;
        this.usedExit = false;
        this.bulletCycleTime = 250;
        this.lastBulletCycle = new Date();
        this.alive = true;
        this.gold = 0;
    }
    static get faction() {
        return Faction.PLAYER;
    }
    update() {
        currentTime = new Date();
        lastTime = currentTime;
        if (this.hp <= 0) {
            labyrinth.playerAlive = false;
        }
        const inputVector = controller.getNormalizeInput();
        this.xVelocity = inputVector.x * this.xVelocityTop;
        this.yVelocity = inputVector.y * this.yVelocityTop;
        super.update();
        if (controller.mouse === true) {
            this.shoot();
        }
    }
    draw() {
        super.draw();
        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.rect(this.x - this.radius, this.y + 20, this.radius * 2, this.radius / 2);
        ctx.stroke();
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.fillRect(this.x - this.radius, this.y + 20, this.radius * 2 * this.hp / this.hpMax, this.radius / 2);
    }
    shoot() {
        if (new Date() - this.lastBulletCycle > this.bulletCycleTime) {
            this.basicShoot();
            this.lastBulletCycle = new Date();
        }
    }
    basicShoot() {
        labyrinth.createBullet(new BasicBullet(this.x, this.y, getMousePos(canvas, controller.e), 1, 10, 7000 / 2, 10, this));
    }
    //Shooting codes needs refinement
    flameThrower() {
        this.bulletCycleTime = 30;
        labyrinth.createBullet(new AngleBullet(this.x, this.y, this.firingAngleDeviation(30), 0.1, 5, 750, 3, this));
        labyrinth.createBullet(new AngleBullet(this.x, this.y, this.firingAngleDeviation(30), 0.3, 4, 750, 4, this));
        labyrinth.createBullet(new AngleBullet(this.x, this.y, this.firingAngleDeviation(30), 0.75, 3, 750, 5, this));
    }
    machineGun() {
        this.bulletCycleTime = 50;
        labyrinth.createBullet(new AngleBullet(this.x, this.y, this.firingAngleDeviation(10), 0.5, 7, 5000, 4, this));
    }
    superMachineGun(){
        //bullets are limited to about 60 bullets per second
        this.bulletCycleTime = 10;
        labyrinth.createBullet(new AngleBullet(this.x, this.y, this.firingAngleDeviation(20), 0.5, 15, 5000, 2, this));
    }
    mower() {
        //Piercing shot
        this.bulletCycleTime = 250;
        labyrinth.createBullet(new PiercingBullet(this.x, this.y, getMousePos(canvas, controller.e), 5, 2, 7000 / 2, 10, this));
    }
    sword() {
        //Short range fast bullets, imitating a sword
        this.bulletCycleTime = 40;
        labyrinth.createBullet(new PiercingBullet(this.x, this.y, getMousePos(canvas, controller.e), 0.5, 10, 150, 10, this));
    }
    blast() {
        //Randomly spawns bullets within an arc to shoot
        this.bulletCycleTime = 1000;
        for (let i = 0; i < 10; i++) {
            labyrinth.createBullet(new AngleBullet(this.x, this.y, this.firingAngleDeviation(45), 1, 10, 5000, 10, this));
        }
    }
    multiShot(speed) {
        //Similar to blast, but bullets always fire at the same angle
        const bulletCount = 5;
        const spreadRad = 7.5 * Math.PI / 180;
        const firingVector = getMousePos(canvas, controller.e);
        const firingAngle = Math.atan2(firingVector.y - player.y, firingVector.x - player.x);
        for (let j = 0; j < bulletCount; j++) {
            labyrinth.createBullet(new AngleBullet(this.x, this.y, firingAngle + spreadRad * (j - (bulletCount - 1) / 2), 0.2, speed, 1000, 10, this));
        }
    }
    shotgun() {
        //multiple multi-shot blasts at different speeds
        this.bulletCycleTime = 500;
        const waveCount = 5;
        for (let j = 0; j < waveCount; j++) {
            this.multiShot(10 - j);
        }

    }
    growthShot() {
        //temporary solution
        //Bullet "grows" over time
        let mousePos = getMousePos(canvas, controller.e);
        this.bulletCycleTime = 500;
        let speed = 2;
        let targetVector = new Vector(mousePos.x - this.x, mousePos.y - this.y);
        if (targetVector.magnitude === 0) {
            targetVector = new Vector(Math.random() - 0.5, Math.random() - 0.5);
        }
        let currXVelocity = targetVector.unit().x * speed;
        let currYVelocity = targetVector.unit().y * speed;
        labyrinth.createBullet(new GrowthBullet(this.x, this.y, currXVelocity, currYVelocity, 0.15, speed, 100, 10, this, 1.1));
    }
    testingBeam() {
        //kills everything
        this.bulletCycleTime = 1;
        labyrinth.createBullet(new BasicBullet(this.x, this.y, getMousePos(canvas, controller.e), 100000, 50, 7000 / 2, 50, this));
    }
    firingAngleDeviation(degree) {
        //Generates a random firing angle with deviation "degree"
        let mouseTarget = getMousePos(canvas, controller.e);
        let targetAngle = Math.atan2(mouseTarget.y - this.y, mouseTarget.x - this.x);
        return (Math.random() * degree / 180 * Math.PI - degree / 360 * Math.PI + targetAngle);
    }
    load(exit) {
        switch (exit.direction) {
            //temporary solution
            case ("right"):
                this.x = gameMap.width - this.x;
                break;
            case ("left"):
                this.x = gameMap.width - this.x;
                break;
            case ("up"):
                this.y = gameMap.height - this.y;
                break;
            case ("down"):
                this.y = gameMap.height - this.y;
                break;
            default:
                throw "No exit direction given";
        }
    }
}
class Enemy extends Circle {
    //Base enemy class, contains all the functions
    constructor(x, y, hp, hpMod) {
        super(x, y);
        this.hp = hp * hpMod;
        this.hpMax = this.hp;
        this.movementCycleTime = 100;
        this.lastMovementCycle = new Date() - 1000000;
        this.bulletCycleTime = 1000;
        this.lastBulletCycle = new Date();
        this.behavior = this.keepDistance;
        this.bulletBehavior = this.basicShoot;
        this.behaviorParam = [];
        this.bulletBehaviorParam = [];
        this.faction = Faction.ENEMY;
        this.radius = 10;
        this.alive = true;
        this.idleSpeedVector = { x: 0, y: 0 };
        this.symbol = "e";
        this.goldValue = 1;
    }
    static get faction() {
        return Faction.ENEMY;
    }
    static get scoreObjectList() {
        const enemyScoreList = [];
        for (const enemy of GlobalEnemyList) {
            enemyScoreList.push(new EnemyScore(enemy));
        }
        return enemyScoreList;
    }
    static get scoreList() {
        return this.scoreObjectList.map(object => object.enemyScore);
    }
    update() {
        if (this.hp <= 0) {
            this.alive = false;
            player.gold += this.goldValue;
        }
        const currentTime = new Date();
        if (currentTime - this.lastMovementCycle > this.movementCycleTime) {
            this.behavior.apply(this, this.behaviorParam);
            this.xVelocity += (Math.random() - 0.5) * this.idleSpeedVector.x;
            this.yVelocity += (Math.random() - 0.5) * this.idleSpeedVector.y;
            this.lastMovementCycle = new Date();
        }
        this.shoot();
        super.update();
    }
    draw() {
        super.draw();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.rect(this.x - this.radius, this.y + 20, this.radius * 2, this.radius / 2);
        ctx.stroke();
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.fillRect(this.x - this.radius, this.y + 20, this.radius * 2 * this.hp / this.hpMax, this.radius / 2);
    }

    selfDestruct() {
        this.alive = false;
        player.gold += this.goldValue;
    }
    chase(speed) {
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
    keepDistance(speed, dist) {
        //Same as chase, but the enemy will stop moving if it gets within a certain distance from the player
        const chaseSpeed = speed;
        const chaseDistX = player.x - this.x;
        const chaseDistY = player.y - this.y;
        const chaseVector = new Vector(chaseDistX, chaseDistY);
        if (chaseVector.magnitude > dist) {
            const stableDistX = player.x - this.x - chaseVector.unit().x * dist;
            const stableDistY = player.y - this.y - chaseVector.unit().y * dist;
            this.xVelocity = clamp(chaseVector.unit().x * chaseSpeed, -Math.abs(stableDistX), Math.abs(stableDistX));
            this.yVelocity = clamp(chaseVector.unit().y * chaseSpeed, -Math.abs(stableDistY), Math.abs(stableDistY));
        }
        else {
            this.xVelocity = 0;
            this.yVelocity = 0;
        }
    }
    noMovement() {
        this.xVelocity = 0;
        this.yVelocity = 0;
    }
    shoot() {
        if (new Date() - this.lastBulletCycle > this.bulletCycleTime) {
            this.bulletBehavior.apply(this, this.bulletBehaviorParam);
            this.lastBulletCycle = new Date();
        }
    }
    explosion(damage, speed, lifetime, radius, bulletCount, proximity) {
        let playerDistance = new Vector(player.x - this.x, player.y - this.y);
        if (playerDistance.magnitude <= proximity) {
            for (let j = 0; j < bulletCount; j++) {
                labyrinth.createBullet(new AngleBullet(this.x, this.y, j * (2 * Math.PI / bulletCount), damage, speed, lifetime, radius, this));
            }
            this.selfDestruct();
        }
    }
    superExplosion(damage, speed, lifetime, radius, bulletCount, proximity, rings) {
        //Spawns multiple rings of bullets, unlike explosion
        let playerDistance = new Vector(player.x - this.x, player.y - this.y);
        if (playerDistance.magnitude <= proximity) {
            for (let k = 0; k < rings; k++){
                for (let j = 0; j < bulletCount; j++) {
                    labyrinth.createBullet(new AngleBullet(this.x, this.y, j * (2 * Math.PI / bulletCount), damage, speed * (k+1)/rings, lifetime, radius, this));
                }
            }
            this.selfDestruct();
        }
    }
    basicShoot(damage, speed, lifetime, radius) {
        labyrinth.createBullet(new BasicBullet(this.x, this.y, player, damage, speed, lifetime, radius, this));
    }
    homingShoot(damage, speed, lifetime, radius) {
        labyrinth.createBullet(new HomingBullet(this.x, this.y, player, damage, speed, lifetime, radius, this));
    }
    predictiveShoot(damage, speed, lifetime, radius) {
        labyrinth.createBullet(new BasicBullet(this.x, this.y, this.predictiveTargeting(speed), damage, speed, lifetime, radius, this));
    }
    predictiveTargeting(bulletSpeed) {
        //Code Stolen from the wonderful internet
        //https://gamedevelopment.tutsplus.com/tutorials/unity-solution-for-hitting-moving-targets--cms-29633
        const xDistance = player.x - this.x;
        const yDistance = player.y - this.y;
        const playerXVelocity = player.xVelocity * 60;
        const playerYVelocity = player.yVelocity * 60;
        //Quadratic equation
        const a = playerXVelocity ** 2 + playerYVelocity ** 2 - (bulletSpeed * 60) ** 2;
        const b = 2 * (playerXVelocity * xDistance + playerYVelocity * yDistance);
        const c = xDistance ** 2 + yDistance ** 2;
        const D = b ** 2 - (4 * a * c);
        let t1 = (-b + Math.sqrt(D)) / (2 * a);
        let t2 = (-b - Math.sqrt(D)) / (2 * a);
        let tFinal;
        if (t1 === Infinity) {
            t1 = 0;
        }
        if (t2 === Infinity) {
            t2 = 0;
        }
        if (t1 > 0 && t2 > 0) {
            tFinal = Math.min(t1, t2);
        }
        else if (t1 > 0) {
            tFinal = t1;
        }
        else if (t2 > 0) {
            tFinal = t2;
        }
        else {
            tFinal = 0;
        }
        const aimX = tFinal * playerXVelocity + player.x;
        const aimY = tFinal * playerYVelocity + player.y;
        return (new Vector(aimX, aimY));
    }
    multiShotCircular(damage, speed, lifetime, radius, bulletCount) {
        //Shoots equally spaced circles around the enemy
        for (let j = 0; j < bulletCount; j++) {
            labyrinth.createBullet(new AngleBullet(this.x, this.y, j * (2 * Math.PI / bulletCount), damage, speed, lifetime, radius, this));
        }
    }
    multiShotAimed(damage, speed, lifetime, radius, bulletCount, spread) {
        //Shoots a spread of bullets with the center aimed at the player
        //If an even amount of bullets is shot, no bullet will be on a direct collision course with the player
        bulletCount = Math.round(bulletCount);
        const spreadRad = spread * Math.PI / 180;
        const playerAngle = Math.atan2(player.y - this.y, player.x - this.x);
        for (let j = 0; j < bulletCount; j++) {
            labyrinth.createBullet(new AngleBullet(this.x, this.y, playerAngle + spreadRad * (j - (bulletCount - 1) / 2), damage, speed, lifetime, radius, this));
        }
    }
    cycle(cycleParam) {
        if (!cycleParam.hasOwnProperty("behaviors") ||
            !cycleParam.hasOwnProperty("behaviorParams") ||
            !cycleParam.hasOwnProperty("behaviorCycleTimes")
        ) {
            throw "cycleParam does not have all necessary properties";
        }
        if (this.behaviorCycleBegin === undefined) {
            this.behaviorCycleBegin = new Date();
            this.currentBehavior = 0;
        }
        let currentTime = new Date();
        if (currentTime - this.behaviorCycleBegin > cycleParam.behaviorCycleTimes[this.currentBehavior]) {
            this.currentBehavior += 1;
            if (this.currentBehavior >= cycleParam.behaviors.length) {
                this.currentBehavior = 0;
            }
            this.behaviorCycleBegin = new Date();
        }
        let currentBehavior = cycleParam.behaviors[this.currentBehavior];
        let currentBehaviorParam = cycleParam.behaviorParams[this.currentBehavior];
        currentBehavior.apply(this, currentBehaviorParam);
    }
    bulletCycle(cycleParam){
        if (!cycleParam.hasOwnProperty("behaviors") ||
            !cycleParam.hasOwnProperty("behaviorParams") ||
            !cycleParam.hasOwnProperty("behaviorCycleTimes") ||
            !cycleParam.hasOwnProperty("bulletCycleTimes")
        ) {
            throw "cycleParam does not have all necessary properties";
        }
        if (this.bulletBehaviorCycleBegin === undefined) {
            this.bulletBehaviorCycleBegin = new Date();
            this.currentBulletBehavior = 0;
        }
        let currentTime = new Date();
        if (currentTime - this.bulletBehaviorCycleBegin >= cycleParam.behaviorCycleTimes[this.currentBulletBehavior]) {
            this.currentBulletBehavior += 1;
            if (this.currentBulletBehavior >= cycleParam.behaviors.length) {
                this.currentBulletBehavior = 0;
            }
            this.bulletBehaviorCycleBegin = new Date();
        }
        if (currentTime - this.overrideLastBulletCycle >= cycleParam.bulletCycleTimes[this.currentBulletBehavior]){
            let currentBehavior = cycleParam.behaviors[this.currentBulletBehavior];
            let currentBehaviorParam = cycleParam.behaviorParams[this.currentBulletBehavior];
            currentBehavior.apply(this, currentBehaviorParam);
            this.overrideLastBulletCycle = new Date();
        }
    }
    shotgun(shotgunParam) {
        if (new Date() - this.lastBulletCycle > this.bulletCycleTime) {
            if (!shotgunParam.hasOwnProperty("bulletBehavior") ||
                !shotgunParam.hasOwnProperty("bulletBehaviorParam")
            ) {
                throw "shotgunParam does not have all necessary properties";
            }
            for (let bulletNum in shotgunParam.bulletBehavior) {
                this.lastBulletCycle = new Date() - 10000;
                shotgunParam.bulletBehavior[bulletNum].apply(this, shotgunParam.bulletBehaviorParam[bulletNum]);
            }
        }

    }
}
class Zombie extends Enemy {
    //Basic enemy, chases the player and shoots.
    constructor(x, y, hpMod, damageMod, speedMod) {
        super(x, y, 8, hpMod);
        this.bulletCycleTime = 500;
        this.behavior = this.chase;
        this.behaviorParam = [2];
        this.bulletBehavior = this.basicShoot;
        //Better bullet behavior param soon...
        this.bulletBehaviorParam = [10, 4, 5000, 15];
        this.radius = 10;
        this.symbol = "z";
        this.idleSpeedVector = { x: 2, y: 2 };
        this.goldValue = 1;
    }
    static get score() {
        return 1;
    }
}
class Creeper extends Enemy {
    //stolen from the hit game
    //Chases the player and blows up
    constructor(x, y, hpMod, damageMod, speedMod) {
        super(x, y, 3, hpMod);
        this.bulletCycleTime = 20;
        this.behavior = this.chase;
        this.behaviorParam = [4];
        this.bulletBehavior = this.explosion;
        this.bulletBehaviorParam = [5, 1, 8000, 5, 32, 20];
        this.radius = 10;
        this.symbol = "C";
        this.idleSpeedVector = { x: 0, y: 0 };
        this.goldValue = 1;
    }
    static get score() {
        return 1;
    }
}
class SuperCreeper extends Enemy{
    //has multiple layers of explosions
    constructor(x, y, hpMod, damageMod, speedMod) {
        super(x, y, 10, hpMod);
        this.bulletCycleTime = 20;
        this.behavior = this.chase;
        this.behaviorParam = [5];
        this.bulletBehavior = this.superExplosion;
        this.bulletBehaviorParam = [5, 2, 5000, 5, 32, 40, 3];
        this.radius = 10;
        this.symbol = "sc";
        this.idleSpeedVector = { x: 0, y: 0 };
        this.goldValue = 3;
    }
    static get score() {
        return 3;
    }
}
class DodgeCreeper extends Enemy{
    //explodes as soon as the player enters the room, creating a lot of bullets for the player to dodge.
    constructor(x, y, hpMod, damageMod, speedMod) {
        super(x, y, 10, hpMod);
        this.bulletCycleTime = 20;
        this.behavior = this.chase;
        this.behaviorParam = [5];
        this.bulletBehavior = this.superExplosion;
        this.bulletBehaviorParam = [5, 2, 5000, 5, 16, 600, 3];
        this.radius = 10;
        this.symbol = "dc";
        this.idleSpeedVector = { x: 0, y: 0 };
        this.goldValue = 3;
    }
    static get score() {
        return 5;
    }
}
class Sentry extends Enemy {
    //Stays still and shoots a spread of bullets at the player
    constructor(x, y, hpMod) {
        super(x, y, 5, hpMod);
        this.bulletCycleTime = 1000;
        this.behavior = this.noMovement;
        this.bulletBehavior = this.multiShotAimed;
        this.bulletBehaviorParam = [10, 8, 7000 / 2, 7, 3, 15];
        this.radius = 10;
        this.symbol = "S";
        this.idleSpeedVector = { x: 0, y: 0 };
        this.goldValue = 2;
    }
    static get score() {
        return 2;
    }
}
class Turret extends Enemy {
    //Stationary, fires a ring of bullets
    constructor(x, y, hpMod) {
        super(x, y, 8, hpMod);
        this.bulletCycleTime = 1000;
        this.behavior = this.noMovement;
        this.bulletBehavior = this.multiShotCircular;
        this.bulletBehaviorParam = [5, 3, 7000 / 2, 7, 8];
        this.radius = 15;
        this.symbol = "Turret";
        this.idleSpeedVector = { x: 0, y: 0 };
        this.goldValue = 2;
    }
    static get score() {
        return 2;
    }
}
class Bull extends Enemy {
    //will cycle between standing still and charging the player
    constructor(x, y, hpMod) {
        super(x, y, 5, hpMod);
        this.bulletCycleTime = 100;
        this.behavior = this.cycle;
        this.behaviorParam = [{
            behaviors: [this.noMovement, this.keepDistance],
            behaviorParams: [[], [5, 30]],
            behaviorCycleTimes: [1500, 1500]
        }];
        this.bulletBehavior = this.multiShotAimed;
        this.bulletBehaviorParam = [1, 10, 100, 4, 5, 10];
        this.radius = 10;
        this.symbol = "b";
        this.idleSpeedVector = { x: 2, y: 2 };
        this.goldValue = 4;
    }
    update() {
        super.update();
    }
    static get score() {
        return 4;
    }
}
class Slime extends Enemy {
    //randomly wanders the room and fires at the player
    constructor(x, y, hpMod) {
        super(x, y, 2, hpMod);
        this.bulletCycleTime = 840;
        this.behavior = this.noMovement;
        this.bulletBehavior = this.multiShotAimed;
        this.bulletBehaviorParam = [5, 8, 10000, 7, 1.2, 15];
        this.radius = 10;
        this.symbol = "s";
        this.movementCycleTime = 500;
        this.idleSpeedVector = { x: 3, y: 3 };
        this.goldValue = 3;
    }
    static get score() {
        return 5;
    }
}
class Barrier extends Enemy {
    constructor(x, y, hpMod) {
        //temporary fix to the diagonal cheese, where you simply move diagonally between the exits to bypass all the enemies
        super(x, y, 10, hpMod);
        this.bulletCycleTime = 50;
        this.behavior = this.noMovement;
        this.bulletBehavior = this.multiShotAimed;
        this.bulletBehaviorParam = [10, 10, 5000, 5, 2, 55];
        this.radius = 10;
        this.symbol = "B";
        this.movementCycleTime = 500;
        this.idleSpeedVector = { x: 0, y: 0 };
        this.goldValue = 5;
    }
    static get score() {
        return 10;
    }
}

class TrenchSoldier extends Enemy {
    //Fires a massive shotgun of bullets at the player
    constructor(x, y, hpMod) {
        super(x, y, 5, hpMod);
        this.bulletCycleTime = 2000;
        this.behavior = this.noMovement;
        this.bulletBehavior = this.shotgun;
        this.bulletBehaviorParam = [{
            bulletBehavior: [this.multiShotAimed, this.multiShotAimed, this.multiShotAimed, this.multiShotAimed, this.basicShoot],
            bulletBehaviorParam: [
                [1, 15, 10000, 2, 9, 2],
                [2, 12, 10000, 4, 6, 3],
                [4, 9, 10000, 6, 5, 4],
                [10, 6, 10000, 8, 4, 5],
                [20, 3, 10000, 10]
            ]
        }];
        this.radius = 10;
        this.symbol = "T";
        this.movementCycleTime = 500;
        this.idleSpeedVector = { x: 0, y: 0 };
        this.goldValue = 3;
    }
    static get score() {
        return 4;
    }
}
class Librarian extends Enemy {
    //Fires homing bullets at the player
    constructor(x, y, hpMod) {
        super(x, y, 5, hpMod);
        this.bulletCycleTime = 200;
        this.behavior = this.keepDistance;
        this.bulletBehavior = this.homingShoot;
        this.behaviorParam = [2, 150];
        this.bulletBehaviorParam = [2, 5, 4000, 4];
        this.radius = 10;
        this.symbol = "L";
        this.movementCycleTime = 250;
        this.idleSpeedVector = { x: 2, y: 2 };
        this.goldValue = 4;
    }
    static get score() {
        return 5;
    }
}
class Boss extends Enemy{
    //temporary, until actual boss feature is added
    constructor(x, y, hpMod) {
        super(x, y, 60, hpMod);
        this.bulletCycleTime = 10;
        this.behavior = this.cycle;
        this.behaviorParam = [{
            behaviors: [this.noMovement, this.keepDistance, this.noMovement, this.chase],
            behaviorParams: [[], [2, 200], [], [4]],
            behaviorCycleTimes: [3000, 4000, 4000, 2250]
        }];
        this.bulletBehavior = this.bulletCycle;
        this.bulletBehaviorParam = [{
            behaviors: [this.basicShoot, this.multiShotAimed, this.predictiveShoot, this.shotgun],
            behaviorParams: [
                [10, 0, 1000, 5], 
                [5, 4, 5000, 8, 9, 20], 
                [10, 10, 5000, 10], 
                [{
                    bulletBehavior: [this.multiShotAimed, this.multiShotAimed, this.multiShotAimed, this.multiShotAimed, this.basicShoot],
                    bulletBehaviorParam: [
                        [2, 20, 10000, 2, 9, 2],
                        [4, 16, 10000, 4, 6, 3],
                        [8, 12, 10000, 6, 5, 4],
                        [15, 8, 10000, 8, 4, 5],
                        [40, 4, 10000, 10]
                    ]
                }]
            ],
            behaviorCycleTimes: [3000, 4000, 4000, 2250],
            bulletCycleTimes: [100, 500, 250, 750]
        }];
        this.radius = 15;
        this.symbol = "B";
        this.idleSpeedVector = { x: 1, y: 1 };
        this.goldValue = 10;
        this.overrideLastBulletCycle = new Date();
    }
    static get score() {
        return 25;
    }
}
class Bullet extends Circle {
    //Base class for bullets
    constructor(x, y, xVelocity, yVelocity, damage, speed, lifetime, radius, creator) {
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
        this.behavior = this.wallCheckOverride;
        this.alive = true;
    }
    update() {
        super.update();
        this.behavior();
        this.lifeDecay();
    }
    lifeDecay() {
        if (new Date() - this.lifeStart > this.lifetime) {
            this.alive = false;
        }
    }
    wallCheckOverride() {
        //Wall collision behavior
        function mapBorderCheckCallback() {
            this.alive = false;
        }
        this.wallCollisionBehavior[Direction.LEFT] = mapBorderCheckCallback;
        this.wallCollisionBehavior[Direction.RIGHT] = mapBorderCheckCallback;
        this.wallCollisionBehavior[Direction.UP] = mapBorderCheckCallback;
        this.wallCollisionBehavior[Direction.DOWN] = mapBorderCheckCallback;
    }
    collisionCheck(object) {
        //Checks if objects are colliding, and checks if they are of opposing factions.
        if ((this.x - object.x) ** 2 + (this.y - object.y) ** 2 <= (this.radius + object.radius) ** 2 &&
            (this.faction != object.faction)) {
            object.hp -= this.damage;
            object.lastHit = this.creator.constructor.name;
            this.alive = false;
        }
    }
}
class BasicBullet extends Bullet {
    //Uses a vector/anything with an x and y value for targeting. 
    constructor(x, y, target, damage, speed, lifetime, radius, creator) {
        super(x, y, 0, 0, damage, speed, lifetime, radius, creator);
        this.target = target;
        this.calculateVelocity();
    }
    calculateVelocity() {
        let targetVector = new Vector(this.target.x - this.x, this.target.y - this.y);
        if (targetVector.magnitude === 0) {
            targetVector = new Vector(Math.random() - 0.5, Math.random() - 0.5);
        }
        this.xVelocity = targetVector.unit().x * this.speed;
        this.yVelocity = targetVector.unit().y * this.speed;
    }
    update() {
        super.update();
    }
}
class AngleBullet extends Bullet {
    //Uses an angle in radians for targeting
    constructor(x, y, angle, damage, speed, lifetime, radius, creator) {
        super(x, y, 0, 0, damage, speed, lifetime, radius, creator);
        this.angle = angle;
        this.faction = creator.constructor.faction;
        this.calculateVelocity();
    }
    calculateVelocity() {
        this.xVelocity = Math.cos(this.angle) * this.speed;
        this.yVelocity = Math.sin(this.angle) * this.speed;
    }
}
class HomingBullet extends BasicBullet {
    //Changes its velocity to find the player
    constructor(x, y, target, damage, speed, lifetime, radius, creator) {
        super(x, y, target, damage, speed, lifetime, radius, creator);
    }
    homing() {
        let targetVector = new Vector(this.target.x - this.x, this.target.y - this.y);
        if (targetVector.magnitude === 0) {
            targetVector = new Vector(Math.random() - 0.5, Math.random() - 0.5);
        }
        let currentVector = new Vector(this.xVelocity, this.yVelocity);
        //The vector is divided by 20 in order to make the homing bullet less "perfect";
        //It takes more time for the homing bullet to change velocity
        let newVector = currentVector.unit().add(targetVector.unit().divide(20));
        this.xVelocity = newVector.unit().x * this.speed;
        this.yVelocity = newVector.unit().y * this.speed;
    }
    update() {
        super.update();
        this.homing();
    }
}
class PiercingBullet extends BasicBullet {
    //Bullet does not disappear upon hitting an object
    constructor(x, y, target, damage, speed, lifetime, radius, creator) {
        super(x, y, target, damage, speed, lifetime, radius, creator);
    }
    update() {
        super.update();
    }
    collisionCheck(object) {
        if ((this.x - object.x) ** 2 + (this.y - object.y) ** 2 <= (this.radius + object.radius) ** 2 &&
            (this.faction != object.faction)) {
            object.hp -= this.damage;
            object.lastHit = this.creator.constructor.name;
        }
    }
}
class GrowthBullet extends Bullet {
    //Bullet grows in size everytime the bullet reaches its "lifetime"
    constructor(x, y, xVelocity, yVelocity, damage, speed, lifetime, radius, creator, growthFactor) {
        super(x, y, xVelocity, yVelocity, damage, speed, lifetime, radius, creator);
        this.growthFactor = growthFactor;
    }
    update() {
        super.update();
    }
    collisionCheck(object) {
        if ((this.x - object.x) ** 2 + (this.y - object.y) ** 2 <= (this.radius + object.radius) ** 2 &&
            (this.faction != object.faction)) {
            object.hp -= this.damage;
            object.lastHit = this.creator.constructor.name;
        }
    }
    lifeDecay() {
        //creates a new bullet with bigger stats
        if (new Date() - this.lifeStart > this.lifetime) {
            this.alive = false;
            labyrinth.createBullet(new GrowthBullet(
                this.x, this.y, this.xVelocity, this.yVelocity,
                this.damage * this.growthFactor,
                this.speed * this.growthFactor,
                this.lifetime,
                this.radius * Math.sqrt(this.growthFactor),
                this.creator,
                this.growthFactor,
            ));
        }
    }
}
class GameMap {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 600;
        this.height = 600;
        this.xCenter = (this.width + this.x) / 2;
        this.yCenter = (this.height + this.y) / 2;
        this.UIWidth = canvas.width - this.width;
        this.UIHeight = canvas.height;
    }
    draw() {
        this.drawGameArea();
        this.drawUI();
    }
    drawGameArea() {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.stroke();
    }
    drawUI() {
        this.drawHPBar();
        this.drawStats();
    }
    drawHPBar() {
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.rect(this.width + this.UIWidth / 10, this.UIHeight / 4, this.UIWidth * 0.8, this.UIHeight * 0.025);
        ctx.fillRect(this.width + this.UIWidth / 10, this.UIHeight / 4, this.UIWidth * 0.8 * (player.hp / player.hpMax), this.UIHeight * 0.025);
        ctx.stroke();
    }
    drawStats() {
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText("HP: " + player.hp + " / " + player.hpMax, this.width + this.UIWidth / 10, this.UIHeight / 4 + this.UIHeight / 10);
        ctx.fillText("Gold: " + player.gold, this.width + this.UIWidth / 10, this.UIHeight / 4 + this.UIHeight / 7.5);
        ctx.font = "10px sans-serif";
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
    init() {
        this.roomMap[this.activeRoom].init();
    }
    update() {
        if (!this.initBool) {
            this.init();
            this.initBool = true;
        }
        (!this.playerAlive) ? this.roomMap[this.activeRoom].deadUpdate() : this.roomMap[this.activeRoom].update()
    }
    draw() {
        this.roomMap[this.activeRoom].draw();
    }
    createEnemy(enemy) {
        this.roomMap[this.activeRoom].createEnemy(enemy);
    }
    createBullet(bullet) {
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
    init() {
        this.bulletList = [];
        this.enemyList.map(enemy => enemy.lastBulletCycle = new Date());
    }
    update() {
        this.exitUpdate();
        this.enemyUpdate();
        this.bulletUpdate();
    }
    draw() {
        this.drawExits();
        this.drawCoordinate();
        this.enemyDraw();
        this.bulletDraw();
        this.deadDraw();
    }
    deadUpdate() {
        //tbd
    }
    deadDraw() {
        if (!labyrinth.playerAlive) {
            ctx.fillStyle = "black";
            ctx.font = "32px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("You were killed by " + player.lastHit, gameMap.xCenter, gameMap.yCenter);
        }
        ctx.font = "10px sans-serif";
    }
    enemyGeneration() {
        const cabDistance = this.coordinate.selfCabDistance();
        let roomScore = Math.floor(cabDistance * Math.sqrt(cabDistance));
        const maxEnemyCount = 6;
        const maxEnemyScore = 25;
        const maxTotalEnemyScore = maxEnemyCount * maxEnemyScore;
        let enemyConstructorList = [];
        let enemyList = [];
        const currentMaxScore = Math.min(roomScore, maxTotalEnemyScore);
        let enemyTotalScore = Math.ceil(0.5 * currentMaxScore + Math.random() * currentMaxScore / 2);
        roomScore -= enemyTotalScore;
        while (enemyConstructorList.length < maxEnemyCount && enemyTotalScore > 0) {
            //Randomly creates enemies
            let rangeRoll = Math.random() ** ((enemyConstructorList.length + 1) / 2);
            let scoreRoll = Math.ceil(maxEnemyScore * (rangeRoll));
            //The exponent increases the likelyhood of selecting a stronger enemy for the first 3 enemies
            //After 2 enemies, there is a greater chance of selecting a weaker enemy
            let enemyScoreRoll = Enemy.scoreList.reduce(function (prev, curr) {
                return ((Math.abs(curr - scoreRoll) < Math.abs(prev - scoreRoll)) && (curr <= enemyTotalScore) ? curr : prev);
            });
            enemyTotalScore -= enemyScoreRoll;
            const potentialEnemyList = [];
            for (const score of Enemy.scoreObjectList) {
                if (score.enemyScore === enemyScoreRoll) {
                    potentialEnemyList.push(score.enemyConstructor);
                }
            }
            if (potentialEnemyList.length === 0) {
                throw "Found No Potential Enemies";
            }
            let enemyRoll = Math.random() * potentialEnemyList.length;
            enemyConstructorList.push(potentialEnemyList[Math.floor(enemyRoll)]);
        }
        roomScore += enemyTotalScore;
        const bulletBuff = 0;
        roomScore -= bulletBuff;
        const hpModifier = 1 + roomScore / 200;
        //Haven't implemented bulletMod and hpMod yet
        for (let enemyConstructor of enemyConstructorList) {
            enemyList.push(new enemyConstructor(
                uniDistribution(gameMap.xCenter, gameMap.width / 24),
                uniDistribution(gameMap.yCenter, gameMap.height / 24),
                hpModifier
            ));
        }
        this.enemyList = enemyList;
    }
    createEnemy(enemy) {
        this.enemyList.push(enemy);
    }
    enemyUpdate() {
        this.enemyList.map(enemy => enemy.update());
        this.enemyList = this.findLiving(this.enemyList);
    }
    enemyDraw() {
        this.enemyList.map(enemy => enemy.draw());
    }
    createBullet(bullet) {
        this.bulletList.push(bullet);
    }
    bulletUpdate() {
        this.bulletList.map(bullet => bullet.update());
        this.bulletList.map(bullet => this.enemyList.map(enemy => bullet.collisionCheck(enemy)));
        this.bulletList = this.findLiving(this.bulletList);
    }
    bulletDraw() {
        this.bulletList.map(bullet => bullet.draw());
    }
    findLiving(objectList) {
        let livingList = [];
        for (const object in objectList) {
            if (objectList[object].alive) {
                livingList.push(objectList[object]);
            }
        }
        return livingList;
    }
    drawExits() {
        for (const exit in this.exitMap) {
            this.exitMap[exit].draw();
        }
    }
    drawCoordinate() {
        //temporary
        ctx.fillStyle = "black";
        ctx.beginPath();
        const text = this.coordinate.x + " , " + this.coordinate.y;
        ctx.fillText(text, gameMap.xCenter, gameMap.yCenter);
        // ctx.stroke();
    }
    exitUpdate() {
        //checks if the center of a player is in an exit
        //the exit will not activate again until the player leaves the exit
        //also locks the exit if all the enemies are not dead
        this.exitLocking();
        if (!player.usedExit && !this.exitLock) {
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
    exitLocking() {
        if (this.enemyList.length > 1) {
            this.exitLock = true;
            for (const exit in this.exitMap) {
                this.exitMap[exit].locked = true;
            }
        }
        else {
            this.exitLock = false;
            for (const exit in this.exitMap) {
                this.exitMap[exit].locked = false;
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
        this.color = "blue";
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
    draw() {
        if (this.locked) {
            ctx.strokeStyle = "red";
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fillRect(this.x, this.y, this.width, this.height)
            ctx.stroke();
        }
        else {
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.stroke();
        }

    }
}
class Shop {
    //unfinished
    constructor(roomNumber, roomCoord){
        this.roomNumber = roomNumber;
        this.roomCoord = roomCoord;
        this.itemObject = {};
    }
    init(){

    }
}
class ShopItem {
    constructor(location){

    }
    buy(){

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

class EnemyScore {
    constructor(enemyConstructor) {
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
function uniDistribution(center, spread) {
    return center + spread * 2 * (Math.random() - 0.5);
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    if (evt === undefined) {
        return {
            x: 0,
            y: 0
        }
    }
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
function mouseDown(e) {
    controller.mouse = true;
}
function mouseUp(e) {
    controller.mouse = false;
}
function mouseMove(e) {
    controller.e = e;
}

const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext("2d");
let gameMap = new GameMap();
document.body.appendChild(canvas);
document.onkeydown = keyDownCheck;
document.onkeyup = keyUpCheck;
document.onmousedown = mouseDown;
document.onmouseup = mouseUp;
document.onmousemove = mouseMove;
//First Enemy on GlobalEnemyList MUST be something with a score of 1 ex: zombie, creeper
let GlobalEnemyList = [Zombie, Creeper, SuperCreeper, DodgeCreeper, Sentry, Turret, Slime, Bull, Librarian, TrenchSoldier, Boss];
let player = new PlayerClass();
let controller = new Controller();
let camera = new Camera();
let labyrinth = new Labyrinth();
function game_cycle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    controller.update();
    labyrinth.update();
    camera.fixedUpdate(0, 0);
    labyrinth.draw();
    gameMap.draw();
    requestAnimationFrame(game_cycle);
}
requestAnimationFrame(game_cycle);
var currentTime = new Date();
var lastTime = new Date();