var express = require('express');
var app = express();

// 加载配置信息
var environment = process.env.NODE_ENV || 'development';
if (environment === 'production') {
    global.config =  require('./env/production');
} else {
    global.config = require('./env/development');
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var kc = require('./services/kc');

app.get('/', function (req, res) {
    res.send('KC service now is running !');
});

var server = app.listen(global.config.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    // 启动KC服务
    kc.start();
    console.log('opp listening at http://%s:%s', host, port);
});