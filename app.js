/**
 * 导入库
 */
var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var service      = require('./services');

/**
 * 加载配置信息
 */
global.config = require('./config');

/**
 * 加载路由列表
 */
var routes = require('./routes');

/**
 * 实例化应用
 */
var app = express();

/**
 * view engine setup
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/**
 * uncomment after placing your favicon in /public
 * app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
 */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 应用路由
 */
for (var i in routes) {
    app.use(i, routes[i]);
}

/**
 * 启动kc
 */
service.kc.start();

/**
 * catch 404 and forward to error handler
 */
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/**
 * error handler
 */
app.use(function(err, req, res, next) {
    /**
     * set locals, only providing error in development
     * @type {*}
     */
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    /**
     * render the error page
     */
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
