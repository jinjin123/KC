'use strict';

var cradle = require('cradle');
var request = require('request');
var view = {};
var db = {};

// couchDB views get not sync order
view.sync_status = {
    map: function(doc) {
        if (doc.data.uuid && doc._deleted !== true && doc.data.state && (!doc.sync_failed_num || doc.sync_failed_num < 5)) {
            if (!doc.sync_status || doc.sync_status !== 1 || doc.last_state !== doc.data.state) {
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

view.conflicts = {
    map: function(doc) {
        if (doc._conflicts) {
            emit([doc._rev].concat(doc._conflicts), [doc._rev].concat(doc._conflicts));
        }
    }
};

db.init = function (dbname) {
    var connection = new(cradle.Connection)(global.config.database.host, global.config.database.port, {
        auth: { username: global.config.database.user, password: global.config.database.pwd }
    });
    var cdb =  connection.database(dbname);

    // 写入view
    cdb.save('_design/kc2', view);

    // 全局DB写入
    return cdb;
};

// 重新初始化
db.re_init = function (dbname) {
    var connection = new(cradle.Connection)(global.config.database.host, global.config.database.port, {
        auth: { username: global.config.database.user, password: global.config.database.pwd }
    });
    return connection.database(dbname);
};

db.get = function (url, callback) {
    var opts = {
        method: 'get',
        uri: config.database.host + ':' + config.database.port + url,
        json: true,
        headers:{'Content-Type':'application/vnd.api+json'},
        auth: {
            'user': config.database.user,
            'pass': config.database.pwd,
            'sendImmediately': true
        }
    };
    request(opts, callback)
};

db.put = function (url, data, callback) {
    var opts = {
        method: 'put',
        uri: config.database.host + ':' + config.database.port + url,
        body: JSON.stringify(data),
        headers:{'Content-Type':'application/vnd.api+json'},
        auth: {
            'user': config.database.user,
            'pass': config.database.pwd,
            'sendImmediately': true
        }
    };
    request(opts, callback)
};

module.exports = db;