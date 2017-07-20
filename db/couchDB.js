/**
 * couchDB library
 * author:zfm
 * date:2017-07-12
 */

'use strict';

var cradle = require('cradle');
var request = require('request');
var couchDB = {};

/**
 * 数据库初始化
 */
couchDB.init = function () {
    var connection = new(cradle.Connection)(config.database.host, config.database.port, {
        auth: { username: config.database.user, password: config.database.pwd }
    });

    return  connection.database(config.database.name);
};

/**
 * 获取数据
 * @param url
 * @param callback
 */
couchDB.get = function (url, callback) {
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

/**
 * 推送数据
 * @param url
 * @param data
 * @param callback
 */
couchDB.put = function (url, data, callback) {
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

/**
 * 获取配置数据
 * @param callback
 */
couchDB.getConf = function (callback) {
    couchDB.get('/kc/config', function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            callback(null, body);
        }
    });
};

/**
 * 获取配置数据
 * @param confDoc
 * @param callback
 */
couchDB.saveConf = function (confDoc, callback) {
    couchDB.put('/kc/config', confDoc, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, confDoc.data)
        }
    });
};

/**
 * 获取全部以b开头的数据库名
 * @param callback
 */
couchDB.getAllDB = function (callback) {
    couchDB.get('/_all_dbs', function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            var dbName = {};
            var rule = new RegExp("^b");
            for (var i in body) {
                if (rule.test(body[i])) {
                    dbName[body[i]] = body[i];
                }
            }
            callback(null, dbName);
        }
    });
};

/**
 * 推送数据
 * @param url
 * @param callback
 */
couchDB.delete = function (url, callback) {
    var opts = {
        method: 'delete',
        uri: config.database.host + ':' + config.database.port + url,
        headers:{'Content-Type':'application/vnd.api+json'},
        auth: {
            'user': config.database.user,
            'pass': config.database.pwd,
            'sendImmediately': true
        }
    };
    request(opts, callback)
};


/**
 * 增加couchDB数据库
 * @param db_name
 * @param callback
 */
couchDB.dbAdd = function (db_name, callback) {
    couchDB.put('/'+db_name, {}, function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            callback(null, body);
        }
    });
};

/**
 * 删除couchDB数据库
 * @param db_name
 * @param callback
 */
couchDB.dbDelete = function (db_name, callback) {
    couchDB.delete('/'+db_name, function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            callback(null, body);
        }
    });
};

/**
 * 获取用户信息
 * @param user_name
 * @param callback
 */
couchDB.getUserInfo = function (user_name, callback) {
    couchDB.get('/_users/org.couchdb.user:' + user_name, function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            callback(null, body);
        }
    });
};

/**
 * 增加或修改couchDB用户
 * @param user_name
 * @param user_pwd
 * @param roles
 * @param callback
 */
couchDB.userEdit = function (user_name, user_pwd, roles, callback) {
    var data = {
        "name"    : user_name,
        "password": user_pwd,
        "roles"   : roles,
        "type"    : "user"
    };
    couchDB.put('/_users/org.couchdb.user:' + user_name, data, function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            callback(null, body);
        }
    });
};

/**
 * 删除couchDB用户
 * @param user_name
 * @param callback
 */
couchDB.userDelete = function (user_name, callback) {
    couchDB.get('/_users/org.couchdb.user:' + user_name, function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            couchDB.delete('/_users/org.couchdb.user:' + user_name + '?rev='+body._rev, function (err, response, body) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, body);
                }
            });
        }
    });
};

/**
 * 将用户授权给数据库
 * @param user_name
 * @param db_name
 * @param roles
 * @param callback
 */
couchDB.dbAuthUser = function (user_name, db_name, roles, callback) {
    var data = {
        "members": {
            "names": [user_name],
            "roles": roles
        }
    };
    couchDB.put("/" + db_name + "/_security", data, function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            callback(null, body);
        }
    });
};



module.exports = couchDB;