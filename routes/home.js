'use strict';

var express = require('express');
var couchDB = require('../db');
var basicAuth = require("basic-auth");
var home = express.Router();

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

    var mon = new Date().getMonth() + 1;
    var day = new Date().getDate();

    if (user.name === global.config.admin_user && user.pass === mon.toString()+day.toString()+'@'+global.config.admin_pwd) {
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