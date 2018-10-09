// 工具函数
var doc = document;

// requestAnimationFrame 兼容
window.requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (fn) {
        // 时间设置为 1000/30 是因为动画每秒钟所需要的帧数通常介于25到30帧之间。
        // 1s是1000ms，用 1000/30 = 33ms
        setTimeout(fn, 1000/30);
    };

/**
 * 添加事件处理程序
 * @param element 元素
 * @param type 事件名称
 * @param handler 函数
 * @param useCap 是否冒泡
 */
function addHandler(element,type,handler,useCap) {
    if (element.addEventListener) this.addHandler = function (element,type,handler,useCap) {
        // console.log(handler);
        element.addEventListener(type,handler,useCap);
    };
    else if (element.attachEvent)this.addHandler = function (element,type,handler) {
        element.attachEvent('on'+type,handler);//IE
    };
    else this.addHandler = function (element,type,handler) {
            element['on'+type]=handler;//DOM0
        };

    this.addHandler(element,type,handler,useCap);
}
/**
 *  获取事件对象
 * @param event
 */
function getEvent (event) {
    if(event)
        this.getEvent = function (event) {
            return event;
        };
    else
        this.getEvent = function () {
            return window.event;
        };
    return this.getEvent(event);
}

/**
 * 获取事件目标
 * @param event
 */
function getTarget (event) {
    if(event.target)
        this.getTarget = function (event) {
            return event.target
        };
    else
        this.getTarget = function (event) {
            return event.srcElement
        };

    return this.getTarget(event);
}
/**
 * 判断是否有类名
 * @param eleObj 元素
 * @param className 类名
 * @returns {boolean}
 */
function hasClass (eleObj, className) {
    var cName = eleObj.className;

    if (cName.indexOf(className) > -1) return true;

    return false;
}

function inheritPrototype (subType,superType) {
    // 法1：
    var pro = Object.create(superType.prototype);
    subType.prototype.constructor = subType;
    subType.prototype = pro;

    // 法2：
    // function F() {};
    // F.prototype = superType.prototype;
    // subType.prototype = new F();
    // subType.prototype.constructor = subType.constructor;
}

/**
 * 获取元素最小和最大边界
 * @param {Array} elems
 * @returns {{minX: *, maxX: *}}
 **/
function getXBoundary(elems) {
    var currentX1,
        currentX2;

    // 通过遍历，利用 currentX1 记录元素的最小 x 坐标，currentX2 记录元素的最大 x 坐标，
    // 并与新遍历的元素的 x 坐标作比较，直到找到 最小的 x 坐标（即：左边界），最大的 x 坐标（即：右边界）为止
    // 其实，这里就是属于选择排序的“选择”思想：从数组的开头开始，将第一个元素和其他元素进行比较，找到最小值为止。
    // 即：一次遍历，两种比较，找到最小值以及最大值就可以了
    elems.forEach(function (item) {
        if (!currentX1 && !currentX2) {
            currentX1 = item.x;
            currentX2 = item.x;
        } else {
            // 寻找最小值
            if (item.x < currentX1) {
                currentX1 = item.x;
            }

            //寻找最大值
            if (item.x > currentX2) {
                currentX2 = item.x;
            }
            // console.log(item.x, currentX1, currentX2);
        }
    });

    return {
        minX: currentX1,
        maxX: currentX2
    };
}

/**
 * 绘制图片
 */
function drawImage (img, context) {

    var _self = this,
        canvasOffscreen = offCanvas.call(this, function (oContext) {
            oContext.drawImage(img, 0, 0, _self.width, _self.height);
    });

    context.drawImage(canvasOffscreen, this.x, this.y)
}

/**
 * 离屏绘制
 * @param fn
 * @param config
 * @returns {Element}
 */
function offCanvas(fn, config) {
    var canvasOffscreen = doc.createElement('canvas'),
        off_context;

    canvasOffscreen.width = config ? config.width : this.width;
    canvasOffscreen.height = config ? config.height : this.height;

    if(canvasOffscreen.getContext) {
        off_context = canvasOffscreen.getContext('2d');
        fn && fn (off_context);
    }

    return canvasOffscreen;
}

/**
 *  图片资源预加载
 */
var PreloadImg = (function () {
    // 判断是否为函数
    var isFn = function (obj) {
        return new RegExp('Function'.toLowerCase(),'i').test(Object.prototype.toString.call(obj));
    };

    var PreloadImg = function (config) {
        this.option = {
            resourceType : 'image', // 资源类型，默认为图片
            baseUrl : './', // 基准url
            resources : [], // 资源路径数组
            onStart : null, // 加载开始回调函数
            onProgress : null, // 正在加载回调函数
            onComplete : null // 加载完毕回调函数
        };

        // 如果 config 存在，则覆盖 this.option对象
        if (config) {
            for(var i in config) {
                this.option[i] = config[i];
            }
        } else {
            alert('参数错误！');
            return;
        }

        // 资源总数
        this.total = this.option.resources.length || 0;
        // 当前正在加载的资源索引
        this.currentIndex = 0;
    };

    PreloadImg.prototype.start = function(){
        var _self = this,
            baseUrl = this.option.baseUrl;

        // 加载图片
        this.option.resources.forEach(function (item) {
            var url = baseUrl + item,
                img = new Image();

            img.onload = function () {
                _self.loaded();
            };

            img.src = url;
        });

        // 加载开始回调函数，传入参数total
        if (isFn(this.option.onStart)) {
            this.option.onStart(this.total);
        }
    };

    PreloadImg.prototype.loaded = function(){
        // 正在加载回调函数，传入参数 currentIndex, total
        if (isFn(this.option.onProgress)) {
            this.option.onProgress(++this.currentIndex, this.total);
        }

        // 加载完毕回调函数，传入参数total
        if (this.currentIndex === this.total) {
            if (isFn(this.option.onComplete)) {
                this.option.onComplete(this.total);
            }
        }
    };

    return PreloadImg;
})();
