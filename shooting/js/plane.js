/**
 *  飞机对象
 *  @param {Object} configObj 游戏基本配置
 */
var Plane = function (configObj) {
    GameElement.call(this, configObj);

    // 飞机移动的左边界
    this.minX = configObj.minX;
    // 飞机移动的右边界
    this.maxX = configObj.maxX;

    // 存放子弹的数组
    this.bullets = [];
    // 子弹宽度
    this.bulletWidth = configObj.bulletWidth || CONFIG.bulletWidth;
    // 子弹高度
    this.bulletHeight = configObj.bulletHeight || CONFIG.bulletHeight;
    // 子弹速度
    this.bulletSpeed = configObj.bulletSpeed || CONFIG.bulletSpeed;
};

// 继承
inheritPrototype(Plane, GameElement);

/**
 *  绘制飞机
 */
Plane.prototype.draw = function (context) {
    // 处理子弹
    this.doBullets(context);

    // 绘制图片
    drawImage.call(this, CONFIG.planeImg, context);
};

/**
 * 水平移动飞机
 */
Plane.prototype.translateX = function (direction, context) {
    var speed = this.speed;

    // 在大于 minX（即：左边界）的情况下，飞机可左移
    // 在小于 maxX（即：右边界）的情况下，飞机可右移
    if (/left/.test(direction)) {
        if (this.x > this.minX) {
            this.move(-speed, 0);
        }
    } else {
        if( this.x < this.maxX) {
            this.move(speed, 0);
        }
    }
};

/**
 * 处理子弹
 */
Plane.prototype.doBullets = function (context) {
    var _self = this,
        bullets = this.bullets;

    // 动画循环三要素：更新，清除，绘制
    bullets.forEach(function (bullet, i) {

       if (bullet) {
           _self.clearBullet(context, bullet);
       }

        // 子弹向上移动
        bullet.moveUp();

        // 子弹飞出画布外，则删除该子弹
        if (bullet.y <= 0) {
            bullets.splice(i, 1);
        } else {
            // 绘制子弹
            bullet.draw(context);
        }
    })
};

/**
 * 发射子弹
 */
Plane.prototype.shoot = function () {
    this.bullets.push(new Bullet({
        x: this.x + parseInt(this.width / 2),
        y: this.y,
        width: this.bulletWidth,
        height: this.bulletHeight,
        speed: this.bulletSpeed
    }));
};

/**
 * 清除子弹画布
 * @param {Object}  context canvas上下文对象
 * @param {Object}  bullet 子弹对象
 */
Plane.prototype.clearBullet = function (context, bullet) {
    context.clearRect(bullet.x, bullet.y, bullet.width, bullet.height);
};
/**
 * 碰撞检测
 */
Plane.prototype.crash = function (enemy, context) {
    var bullets = this.bullets,
        len = bullets.length;

    // 正常从 0 开始循环遍历数组有可能会出错，因为循环过程中调用 splice 方法删除数组的项，
    // 这样会影响数组后面项的序号，所以应该从数组后面开始遍历，这样就不会影响前面项
    while (len--) {
        var bullet = bullets[len],
            isCrashX = bullet.x >= enemy.x && bullet.x <= (enemy.x + enemy.width),
            isCrashY = bullet.y >= enemy.y && bullet.y <= (enemy.y + enemy.height);

        // 子弹与怪兽碰撞，就将这颗子弹删除
        // isCrashX 和 isCrashY 这两个条件保证了子弹射到的是一个敌人的范围
        if (isCrashX && isCrashY) {
            // 清除画布上的子弹
            this.clearBullet(context, bullet);

            bullets.splice(len, 1);

            return true;
        }
    }

    return false;
};
