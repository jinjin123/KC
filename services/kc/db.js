'use strict';

var cradle = require('cradle');
var request = require('request');
var view = {};
var db = {};

// couchDB views get not sync order
view.sync_status = {
    map: function(doc) {
        if (doc.data.uuid && doc._deleted !== true && doc.data.state && (!doc.sync_failed_num || doc.sync_failed_num < 5)) {
            if (!doc.sync_status || doc.sync_status !== 1) {
                emit(doc.sync_status, doc);
            }
        }
    }
};

view.sync_failed = {
    map: function(doc) {
        if (doc.data.uuid && doc._deleted !== true && doc.data.state && doc.sync_failed_num && doc.sync_failed_num >= 5) {
            if (!doc.sync_status || doc.sync_status !== 1) {
                emit(doc.sync_failed, doc);
            }
        }
    }
};

db.init = function (dbname) {
    var connection = new(cradle.Connection)(global.config.couchDb.host, global.config.couchDb.port, {
        auth: { username: global.config.couchDb.dbuser, password: global.config.couchDb.dbpwd }
    });
    var cdb =  connection.database(dbname);

    // 写入view
    cdb.save('_design/kc2', view);

    // 全局DB写入
    return cdb;
};

// 重新初始化
db.re_init = function (dbname) {
    var connection = new(cradle.Connection)(global.config.couchDb.host, global.config.couchDb.port, {
        auth: { username: global.config.couchDb.dbuser, password: global.config.couchDb.dbpwd }
    });
    return connection.database(dbname);
};

db.get = function (url, callback) {
    var reData = {state:false, errCode:500, message:"error", data:{}};
    var opts = {
        method: 'get',
        uri: url,
        json: true,
        headers:{'Content-Type':'application/vnd.api+json'},
        auth: global.config.oc.auth
    };
    request(opts, function (err, response, body) {
        console.log('db.get:'+response.statusCode);
        if (err) {
            reData.message = err;
        } else if(response.statusCode === 200) {
            reData.state   = true;
            reData.errCode = response.statusCode;
            reData.message = response.statusMessage;
            reData.data    = body;
        } else {
            reData.errCode = response.statusCode;
            reData.message = response.statusMessage;
        }
        callback(reData.state, reData);
    })
};

db.put = function (url, data, callback) {
    var reData = {state:false, errCode:500, message:"error", data:{}};
    var opts = {
        method: 'put',
        uri: url,
        body: JSON.stringify(data),
        headers:{'Content-Type':'application/vnd.api+json'},
        auth: global.config.oc.auth
    };
    request(opts, function (err, response, body) {
        console.log('db.put:'+response.statusCode);
        if (err) {
            reData.message = err;
        } else if(response.statusCode === 200) {
            reData.state   = true;
            reData.errCode = response.statusCode;
            reData.message = response.statusMessage;
            reData.data    = body;
        } else {
            reData.errCode = response.statusCode;
            reData.message = response.statusMessage;
        }
        callback(reData.state, reData);
    })
};

module.exports = db;