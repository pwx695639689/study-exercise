
// 获取元素
var doc = document,
    container = doc.getElementById('game'),
    canvas = doc.getElementById('canvas'),
    canvasWidth = canvas.width,
    canvasHeight = canvas.height,
    progressRunning = doc.querySelector('.progress-running'),
    progressPercentage = doc.querySelector('.progress-percentage'),
    progressDes = doc.querySelector('.progress-des'),
    context;

if (canvas.getContext) {
    context = canvas.getContext('2d');
} else {
    alert('您的浏览器不支持canvas!');
}

/**
 * 整个游戏对象
 */
var GAME = {
    getEles: function () {
        this.finalScore = doc.querySelector('.score');
        this.gameNextLevel = doc.querySelector('.game-next-level');
    },
    /**
     * 初始化函数,这个函数只执行一次
     * @param  {Object} configObj 游戏配置对象
     */
    init: function(configObj) {
        // 获取元素
        this.getEles();

        var option = Object.assign({},CONFIG, configObj), // 基本配置的游戏对象
            canvasPadding = option.canvasPadding, // 画布边距
            maxHeight = canvasHeight - canvasPadding - option.planeHeight, // 飞机以及敌人在y轴上的最大高度
            planeWidth = option.planeWidth; // 飞机宽度

        this.option = option;
        this.cP = canvasPadding;

        // 初始关卡数
        this.currentLevel = option.level;

        // 飞机
        this.plane = null;
        // 飞机的初始x坐标
        this.planeX = parseFloat((canvasWidth  - planeWidth) / 2);
        // 飞机的初始y坐标
        this.planeY = maxHeight;
        // 飞机移动的左边界
        this.planeMinX = canvasPadding;
        // 飞机移动的右边界
        this.planeMaxX = canvasWidth - planeWidth - canvasPadding;

        // 敌人
        this.enemies = null;
        // 敌人移动的左边界
        this.enemyMinX = canvasPadding;
        // 敌人移动的右边界
        this.enemyMaxX = canvasWidth - option.enemyWidth - canvasPadding;
        // 敌人向下移动的界限
        this.enemyDownLimit = maxHeight;

        // 键盘
        this.board = Board;

        // 游戏的状态：游戏开始
        this.status = 'start';
        this.setStatus(this.status);

        // 默认游戏分数为0
        this.score = 0;

        // 事件监听
        this.bindEvent();
    },
    bindEvent: function() {
        var _self = this;

        // 事件委托
        addHandler(container, 'click', function (e) {
            var target = getTarget(getEvent(e));

            // 第一次玩/重新玩游戏
            if(hasClass(target, 'js-play') || hasClass(target, 'js-replay')) {
                // 重置分数和关卡数
                _self.resetLevelAndScore();

                _self.play();
            } else if (hasClass(target, 'js-next')) { // 玩下一关游戏
                _self.play();
            }
        }, false);

        this.board.init();
    },
    /**
     * 更新游戏状态，分别有以下几种状态：
     * start  游戏前
     * playing 游戏中
     * failed 游戏失败
     * success 游戏成功
     * stop 游戏暂停
     */
    setStatus: function(status) {
        this.status = status;
        container.setAttribute("data-status", status);
    },
    /**
     * 启动游戏
     */
    play: function() {
        // 创建飞机
        this.createPlane();

        // 创建敌人
        this.createEnemies();

        // 游戏状态：游戏中
        this.setStatus('playing');

        // 更新动画
        this.update();
    },
    /**
     * 更新游戏动画
     */
    update: function () {
        var _self = this,
            enemiesLength,
            lastEnemy;

        // 清除飞机
        this.clearPlane();

        // 清除敌人
        this.clearEnemy();

        // 清除分数
        this.clearScore();

        // 更新飞机的动画
        this.updatePlane();

        // 更新敌人的动画
        this.updateEnemies();

        // 绘制
        this.draw();

        // 在敌人完全被消灭的情况下，阻止动画的更新
        enemiesLength = this.enemies.length;
        if (enemiesLength === 0) {
            // 闯完所有关
            if (this.currentLevel === this.option.totalLevel) {
                this.endGame('all-success');
            } else { // 闯完一关
                this.endGame('success');

                // 更新关卡数
                this.updateLevel();
            }
            return;
        }

        // 只要有一个敌人到了下边界，就证明敌人没有被飞机全部消灭，那么此时游戏闯关失败
        // 换位思考：选择最后一个敌人作为参照点
        lastEnemy = this.enemies[this.enemies.length - 1];
        if (lastEnemy.y >= this.enemyDownLimit) {
            // 游戏状态：闯关失败
            this.endGame('failed');

            // 获取最终得分
            this.getFinalScore();

            return;
        }

        requestAnimFrame(function () {
            _self.update();
        });
    },
    /**
     * 绘制动画元素
     */
    draw: function () {

        // 绘制飞机
        this.plane.draw(context);

        // 绘制敌人
        this.enemies.forEach(function (item) {
            item.draw(context);
        });

        // 绘制分数
        this.drawScore();
    },
    /**
     * 创建飞机
     */
    createPlane: function () {
        var option = this.option;

        this.plane = new Plane({
            x: this.planeX,
            y: this.planeY,
            width: option.planeWidth,
            height: option.planeHeight,
            speed: option.planeSpeed,
            minX: this.planeMinX,
            maxX: this.planeMaxX
        });
    },
    /**
     * 创建敌人
     */
    createEnemies: function () {
        var option = this.option,
            enemyPerLine = option.enemyPerLine,
            enemyGap = option.enemyGap,
            enemyWidth = option.enemyWidth,
            enemyHeight = option.enemyHeight,
            enemySpeed = option.enemySpeed,
            padding = this.cP;

        // 每次创建敌人前，需清空数组
        this.enemies = [];

        // 外循环控制敌人行数，内循环控制敌人列数
        for (var i = 0; i < this.currentLevel; i++) {
            for (var j = 0; j < enemyPerLine; j++) {
                var enemy = {
                    x: padding + j * (enemyWidth + enemyGap),
                    y: padding + i * (enemyHeight + enemyGap),
                    width: enemyWidth,
                    height: enemyHeight,
                    speed: enemySpeed
                };

                this.enemies.push(new Enemy(enemy));
            }
        }

    },
    /**
     * 更新飞机动画
     */
    updatePlane: function () {
        var board = this.board,
            plane = this.plane;

        // 左箭头：左移
        if (board.pressedLeft) {
            plane.translateX('left');
        }

        // 右箭头：右移
        if (board.pressedRight) {
            plane.translateX('right');
        }

        // 空格键：射击
        if (board.pressedSpace) {
            board.pressedSpace = false;
            plane.shoot();
        }

    },
    /**
     * 更新敌人动画
     */
    updateEnemies: function () {
        var plane = this.plane,
            enemies = this.enemies,
            len = enemies.length,
            boundary = getXBoundary(enemies),
            isDown = false; // 默认不能向下移动

        // 边界判断
        if (boundary.minX < this.enemyMinX || boundary.maxX > this.enemyMaxX) {
            // 修改敌人水平移动的方向（注意：敌人做的是反弹运动）
            this.option.enemyDirection = this.option.enemyDirection === 'right' ? 'left' : 'right';

            // 当敌人做反向运动的那一刻，敌人都会向下移动
            isDown = true;
        }

        // 正常从 0 开始循环遍历数组有可能会出错，因为循环过程中调用 splice 方法删除数组的项，
        // 这样会影响数组后面项的序号，所以应该从数组后面开始遍历，这样就不会影响前面项
        while (len--) {
            var enemy = enemies[len],
                status = enemy.status;

            // 如果 isDown = true，敌人做向下运动
            if (isDown) {
                enemy.translate('down');
            }

            // 敌人水平移动
            enemy.translate(this.option.enemyDirection);

            // 判断敌人的状态
            switch (status) {
                case 'normal': // 敌人正常
                    if (plane.crash(enemy, context)) {
                        enemy.eliminate();
                        context.clearRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    }
                    break;
                case 'booming': // 敌人被消灭中
                    enemy.eliminate();
                    break;
                case 'eliminated': // 敌人被消灭
                    // 在数组中删除已被消灭的敌人
                    enemies.splice(len, 1);

                    // 更新分数
                    this.updateScore();
                    break;
            }
        }
    },
    /**
     * 更新关卡数
     */
    updateLevel: function () {
        this.gameNextLevel.innerHTML = '下一个Level：' + (++this.currentLevel);
    },
    /**
     * 更新分数
     */
    updateScore: function () {
        ++this.score;
    },
    /**
     * 清除画布
     */
    clearScreen: function () {
        context.clearRect(0, 0, canvasWidth, canvasHeight);
    },
    clearPlane: function () {
        var plane = this.plane;
        context.clearRect(plane.x, plane.y, plane.width, plane.height);
    },
    clearEnemy: function () {
        this.enemies.forEach(function (item) {
            context.clearRect(item.x, item.y, item.width, item.height);
        })
    },
    clearScore: function () {
        context.clearRect(0, 0, 100, 70);
    },
    /**
     * 绘制分数
     */
    drawScore: function () {
        var _self = this,
            offScreenCanvas = offCanvas(function (oContext) {
                oContext.font = '18px';
                oContext.fillStyle = 'white';
                oContext.fillText('分数：' + (_self.score), 20, 20);
        }, {
            width: 100,
            height: 70
        });
       context.drawImage(offScreenCanvas, 0, 0);
    },
    /**
     * 得到最终分数
     */
    getFinalScore: function () {
        this.finalScore.innerHTML = this.score;
    },
    /**
     * 重置关卡数和分数
     */
    resetLevelAndScore: function () {
        // 重置关卡数为第一关
        this.currentLevel = 1;
        // 重置分数为0
        this.score = 0;
    },
    /**
     * 游戏结束
     * @param {String} status 游戏状态
     */
    endGame: function (status) {
        // 清除画布
        this.clearScreen();
        // 修改游戏状态
        this.setStatus(status);
    }
};

var preloadImg = new PreloadImg({
    // 图片资源
    resources : [
       'img/plane.png',
       'img/enemy.png',
       'img/boom.png'
    ],
    // 图片正在加载
    onProgress : function(current, total){
        var per = Math.round(current / total * 100) + '%';

        progressRunning.style.transform= 'scaleX(' + per + ')';
        progressPercentage.innerHTML = per;

        if(current === total) {
            progressDes.innerHTML = '游戏加载完毕';
        }
    },
    // 图片加载完毕
    onComplete : function(){
        // 图片的路径
        var planeSrc = CONFIG.planeImg,
            enemyNormalSrc = CONFIG.enemyNormalImg,
            enemyBoomedSrc = CONFIG.enemyBoomedImg;

        CONFIG.planeImg = new Image();
        CONFIG.enemyNormalImg = new Image();
        CONFIG.enemyBoomedImg = new Image();

        CONFIG.planeImg.src = planeSrc;
        CONFIG.enemyNormalImg.src = enemyNormalSrc;
        CONFIG.enemyBoomedImg.src = enemyBoomedSrc;

        // 图片加载完毕后，延迟300ms才出现游戏界面，这样可以增加进度条与游戏界面的过渡性
        setTimeout(function () {
            // 游戏初始化
            GAME.init();
        },500);
    }
});

// 图片预加载开始
preloadImg.start();

