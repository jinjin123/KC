'use strict';

var cradle = require('cradle');
var view = {};
var db = {};

// couchDB views get not sync order
view.sync_status = {
    map: function(doc) {
        if (doc.data) {
            if (!doc.sync_status || doc.sync_status !== 1) {
                emit(doc.sync_status, doc);
            }
        }
    }
};

db.init = function (dbname) {
    var connection = new(cradle.Connection)(config.couchDb.host, config.couchDb.port, {
        auth: { username: config.couchDb.dbuser, password: config.couchDb.dbpwd }
    });
    var cdb =  connection.database(dbname);

    // 写入view
    cdb.save('_design/kc2', view);

    // 全局DB写入
    return cdb;
};

// 重新初始化
db.re_init = function (dbname) {
    var connection = new(cradle.Connection)(config.couchDb.host, config.couchDb.port, {
        auth: { username: config.couchDb.dbuser, password: config.couchDb.dbpwd }
    });
    return connection.database(dbname);
};

module.exports = db;