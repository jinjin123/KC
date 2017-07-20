/**
 * db library
 * author:zfm
 * date:2017-07-12
 */

'use strict';

var db = {};

// 选数据库
switch (config.database.driver) {
    case 'couchDB':db = require('./couchDB');break;
    default:db = require('./couchDB');break;
}

module.exports = db;