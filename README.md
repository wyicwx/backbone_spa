# 基于Backbone的spa MVC框架

## 调用

```js
var app = require('./base.js');
```

## 抽象方法

**autoload** 模块异步加载函数,需要自己实现

```js
app.autoload = function(model, callback) {
	// 加载model模块完成后执行callback
};
```

## 

```js

```

## 基础类

**BaseView**: 基础视图

*app*: {Object} app对象引用

*ajaxQueue*: {Function} ajax对象队列，当前视图调用的ajax需要手动推入这个队列，在视图切换过程中会自动清理这个队列的所有ajax队列

*ajax*: {Function} ajax函数，由这个函数发起的ajax请求自动加入ajaxQueue队列

**MainView**: 主视图，继承自BaseView



















