'use strict';

var express = require('express');
var couchDB = require('../db');
var basicAuth = require("basic-auth");
var home = express.Router();

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

var auth = function(req, resp, next) {
    function unauthorized(resp) {
        console.log("需要登录");
        resp.set('WWW-Authenticate', 'Basic realm=Input User&Password');
        return resp.sendStatus(401);
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(resp);
    }

    var time = new Date().Format('yyyyMMdd');

    if (user.name === global.config.admin_user && user.pass === global.config.admin_user +'@'+ time) {
        return next();
    } else {
        console.log("未能登录");
        return unauthorized(resp);
    }
};

/**
 * home page
 * 检查用户是否为登录状态
 */
home.get('*', auth, function(req, resp, next) {

    next();
});

/**
 * 所有POST方法都需要验证是否登录
 */
home.post('*', auth, function(req, resp, next) {

    next();
});

/**
 * 所有POST方法都需要验证是否登录
 */
home.get('/', function(req, resp) {

    resp.redirect('/kc/config');
});

module.exports = home;