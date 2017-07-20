'use strict';

var express = require('express');
var users = express.Router();

/**
 * 用户登录
 */
users.get('/login', function(req, res, next) {
  res.send('respond with a resource');
});

/**
 * 用户登出
 */
users.get('/logout', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = users;
