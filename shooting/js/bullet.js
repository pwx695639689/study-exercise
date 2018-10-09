/**
 *  子弹对象
 *  @param {Object} configObj 游戏基本配置
 */
var Bullet = function (configObj) {
    GameElement.call(this, configObj);
};
// 继承
inheritPrototype(Bullet, GameElement);

/**
 * 绘制子弹
 */
Bullet.prototype.draw = function (context) {
    // 法1
    // context.beginPath();
    // context.lineWidth = this.width;
    // context.strokeStyle = CONFIG.bulletColor;
    // context.moveTo(this.x, this.y);
    // context.lineTo(this.x, this.y - this.height);
    // context.stroke();

    var _self = this,
        offCanvasScreen = offCanvas.call(this, function (oContext) {
        oContext.fillStyle = CONFIG.bulletColor;
        oContext.fillRect(0, 0, _self.width, _self.height);
    });

    // 法2
    context.drawImage(offCanvasScreen,this.x, this.y);
};

/**
 * 子弹向上移动
 */
Bullet.prototype.moveUp = function () {
    this.move(0, -this.speed);
};
