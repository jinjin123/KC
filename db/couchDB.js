/**
 * couchDB library
 * author:zfm
 * date:2017-07-12
 */

'use strict';

var cradle = require('cradle');
var request = require('request');
var couchDB = {};

var _design = {};
var _report = {};

_report.language = 'javascript';
_report.views = {
    "today_order": {
        "map": "function (doc) {\n  var timestamp=Date.parse(new Date().toLocaleDateString())/1000;\n  if (doc.createtime > timestamp) {\n    emit(doc.sync_status, doc.data);\n  }\n}"
    }
};

_design.language = 'javascript';
_design.views = {
    "sync_status": {
        "map": "function (doc) {\n        if (doc.data.uuid && doc._deleted !== true && doc.data.state && (!doc.sync_failed_num || doc.sync_failed_num < 5)) {\n            if (!doc.sync_status || doc.sync_status !== 1 || doc.last_state !== doc.data.state) {\n                emit(doc.sync_status, doc);\n            }\n        }\n    }"
    },
    "sync_failed": {
        "map": "function (doc) {\n        if (doc.data.uuid && doc._deleted !== true && doc.data.state && doc.sync_failed_num && doc.sync_failed_num >= 5) {\n            if (!doc.sync_status || doc.sync_status !== 1) {\n                emit(doc.sync_failed, doc);\n            }\n        }\n    }"
    },
    "conflicts": {
        "map": "function (doc) {\n        if (doc._conflicts) {\n            emit([doc._rev].concat(doc._conflicts), [doc._rev].concat(doc._conflicts));\n        }\n    }"
    },
    "checkuuidid": {
        "map": "function (doc) {\n        if (doc.data && doc.data.order_items && doc.data.state && doc._id !== doc.data.uuid) {\n            emit(doc.data.uuid, {\"_id\": doc._id, \"uuid\": doc.data.uuid});\n        }\n    }"
    },
    "hx": {
        "map": "function (doc) {\n        function getOrderTimestamp(doc){\n            function convertDate(d) {\n                if(typeof(d) === 'string') {\n                    var m = d.match(/([0-9]+)-([0-9]+)-([0-9]+) ([0-9]+):([0-9]+):([0-9]+)/);\n                    if(m){\n                        return m[1] + m[2] + m[3] + m[4] + m[5] + m[6];\n                    }\n                }\n            }\n            if(doc && doc.order && doc.order.orderInfo){\n                if(doc.timestamp)\n                    return doc.timestamp;\n                var info = doc.order.orderInfo;\n                var fields = ['paytime', 'addtime', 'booktime', 'returntime', 'canceltime', 'mealstime', 'deliverytime', 'receivetime'];\n                for(var i in fields) {\n                    var ret = convertDate(info[fields[i]]);\n                    if(ret){\n                        return ret;\n                    }\n                }\n                return doc.timestamp;\n            }\n        }\n        if (doc.order && doc.order.orderInfo && doc.order.orderInfo.orderstatus) {\n            var ts = getOrderTimestamp(doc);\n            emit(ts, {\"orderstatus\": doc.order.orderInfo.orderstatus,\"totalamount\":doc.order.orderInfo.totalamount});\n        }\n    }"
    },
    "lh": {
        "map": "function (doc) {\n        function getOrderTimestamp(doc){\n            if(doc && doc.data && doc.data.order_items){\n                if(doc.timestamp)\n                    return doc.timestamp;\n                //var info = doc.data.order_items;\n                var info = doc.data;\n                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];\n                for(var i in fields) {\n                    var ret = info[fields[i]];\n                    if(ret){\n                        return ret;\n                    }\n                }\n                return doc.timestamp;\n            }\n        }\n        if (doc.data && doc.data.order_items && doc.data.state) {\n            var ts = getOrderTimestamp(doc);\n            var t = new Date(ts * 1000);\n            var st = Number(doc.data.field_de_store_id) + 0;\n            var ymd = t.getFullYear() * 10000 + ((t.getMonth() + 1) * 100 + t.getDate());\n            var hms = (t.getHours() + 8) * 10000 +  t.getMinutes() * 100 + t.getSeconds();\n            emit([ymd, hms, st], {\"state\": doc.data.state, \"order_number\": doc.data.order_number, \"sync_status\": doc.sync_status});\n        }\n    }"
    },
    "order_status": {
        "map": "function (doc) {\n        if(doc.data && doc.data.order_items && doc.data.state){\n            emit(doc.data.state, doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);\n        }\n    }"
    },
    "refund": {
        "map": "function (doc) {\n        if (doc.data && doc.data.order_items && doc.data.state && doc.data.field_returned) {\n            emit(doc.data.uuid,null);\n        }\n    }"
    },
    "status": {
        "map": "function (doc) {\n        if (doc.data && doc.data.order_items && doc.data.state) {\n            emit([doc.sync_status, doc.data.state], doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);\n        }\n    }"
    },
    "store": {
        "map": "function (doc) {\n        function getOrderTimestamp(doc){\n            if(doc && doc.data && doc.data.order_items){\n                if(doc.timestamp)\n                    return doc.timestamp;\n                //var info = doc.data.order_items;\n                var info = doc.data;\n                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];\n                for(var i in fields) {\n                    var ret = info[fields[i]];\n                    if(ret){\n                        return ret;\n                    }\n                }\n                return doc.timestamp;\n            }\n        }\n        if (doc.data && doc.data.state) {\n            var ts = getOrderTimestamp(doc);\n            var rev = doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]\n            emit(ts, {\"rev\": rev, \"field_de_store_id\": doc.data.field_de_store_id});\n        }else if(doc.order && doc.order.orderInfo){\n            var ts = doc.order.orderInfo.addtime;\n            var rev = doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]\n            emit(ts, {\"rev\": rev, \"field_de_store_id\": \"nothing\"});\n        }\n    }"
    },
    "submittime": {
        "map": "function (doc) {\n        function getOrderTimestamp(doc){\n            if(doc && doc.data && doc.data.order_items){\n                if(doc.timestamp)\n                    return doc.timestamp;\n                //var info = doc.data.order_items;\n                var info = doc.data;\n                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];\n                for(var i in fields) {\n                    var ret = info[fields[i]];\n                    if(ret){\n                        return ret;\n                    }\n                }\n                return doc.timestamp;\n            }\n        }\n        if (doc.order && doc.order.orderInfo && doc.order.orderInfo.orderstatus) {\n            var ts = getOrderTimestamp(doc);\n            emit(ts, {beforeSubmit: doc.BeforSubmittingTime, afterSubmit: doc.AfterSubmittingTime});\n        }\n    }"
    },
    "timeprice": {
        "map": "function (doc) {\n        function getOrderTimestamp(doc){\n            if(doc && doc.data && doc.data.order_items){\n                if(doc.timestamp)\n                    return doc.timestamp;\n                //var info = doc.data.order_items;\n                var info = doc.data;\n                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];\n                for(var i in fields) {\n                    var ret = info[fields[i]];\n                    if(ret){\n                        return ret;\n                    }\n                }\n                return doc.timestamp;\n            }\n        }\n        function GetDate(t){\n            var t = new Date(t * 1000);\n            //return t.Format(\"yyyy-MM-dd HH:mm:ss\");\n            return t.toLocaleString();\n        }\n        if (doc.data && doc.data.order_items && doc.data.state) {\n            var ts = getOrderTimestamp(doc);\n            var timestamp = GetDate(doc.timestamp);\n            var BeforSubmittingTime = GetDate(doc.BeforSubmittingTime);\n            var AfterSubmittingTime = GetDate(doc.AfterSubmittingTime);\n            emit(ts, {\"timestamp\":timestamp,\"BeforSubmittingTime\":BeforSubmittingTime, \"AfterSubmittingTime\":AfterSubmittingTime});\n        }\n    }"
    },
    "timestamp": {
        "map": "function (doc) {\n        function getOrderTimestamp(doc){\n            if(doc && doc.data && doc.data.order_items){\n                if(doc.timestamp)\n                    return doc.timestamp;\n                //var info = doc.data.order_items;\n                var info = doc.data;\n                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];\n                for(var i in fields) {\n                    var ret = info[fields[i]];\n                    if(ret){\n                        return ret;\n                    }\n                }\n                return doc.timestamp;\n            }\n        }\n        if (doc.data && doc.data.state) {\n            var ts = getOrderTimestamp(doc);\n            var rev = doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]\n            emit(ts, {\"rev\": rev, \"field_de_store_id\": doc.data.field_de_store_id});\n        }\n    }"
    },
    "timestatus": {
        "map": "function (doc) {\n        function getOrderTimestamp(doc){\n            if(doc && doc.data && doc.data.order_items){\n                if(doc.timestamp)\n                    return doc.timestamp;\n                //var info = doc.data.order_items;\n                var info = doc.data;\n                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];\n                for(var i in fields) {\n                    var ret = info[fields[i]];\n                    if(ret){\n                        return ret;\n                    }\n                }\n                return doc.timestamp;\n            }\n        }\n        if (doc.data && doc.data.order_items && doc.data.state) {\n            var ts = getOrderTimestamp(doc);\n            var t = new Date(ts * 1000);\n            var ymd = t.getFullYear() * 10000 + (t.getMonth() * 100 + t.getDate());\n            var hms = t.getHours() * 10000 +  t.getMinutes() * 100 + t.getSeconds();\n            emit([doc.sync_status, doc.data.state, ymd, hms], doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);\n        }\n    }"
    },
    "uuid": {
        "map": "function (doc) {\n        if (doc[\"35\"] && doc[\"34\"]) {\n            emit(doc[\"35\"], doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);\n        }\n    }"
    }
};

_design.filters = {
    "design": "function (doc, req) {\n        if (doc._id.match(/^_design\\//)) {\n            if (doc.order === undefined) {\n                return true;\n            }\n        }\n        return false;\n    }",
    "data": "function (doc, req) {\n        if (doc.data) {\n            return true;\n        }\n        return false;\n    }",
    "store": "function (doc, req) {\n        if (doc.data && doc.data.field_de_store_id == req.query.field_de_store_id) {\n            return true;\n        }\n        return false;\n    }"
};

_design.updates = {
    "KCRequest": "function (doc, req) {\n        var newDoc = JSON.parse(req.body);\n        if (req.query.send_by_kc != 1){\n            newDoc.sync_status = false;\n        }else{\n            newDoc.sync_status = true;\n        }\n        return [newDoc, {json: {'id': newDoc._id}}];\n    }"
};

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
 * 初始化指定
 */
couchDB.initDB = function (dbName) {
    var connection = new(cradle.Connection)(config.database.host, config.database.port, {
        auth: { username: config.database.user, password: config.database.pwd }
    });

    return  connection.database(dbName);
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
            if (body.error === 'not_found') {
                var config = {
                    data:[]
                };
                couchDB.put('/kc', {}, function (err, response, body) {
                    couchDB.put('/kc/config', config, function (err, response, body) {
                        callback(null, config);
                    })
                })
            } else {
                callback(null, body);
            }
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
 * 增加couchDB数据库
 * @param db_name
 * @param callback
 */
couchDB.dbSaveViews = function (db_name, callback) {
    couchDB.put('/'+db_name+'/_design/report', _report, function (err) {
        if (err) {
            callback(err);
        } else {
            couchDB.put('/'+db_name+'/_design/kc', _design, function (err, response, body) {
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
    couchDB.get('/_users', function (err, response, body) {
        if (err) {
            callback(err);
        } else {
            if (body.error === 'not_found') {
                couchDB.put('/_users', {}, function (err, response, body) {
                    couchDB.put('/_users/org.couchdb.user:' + user_name, data, function (err, response, body) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, body);
                        }
                    });
                })
            } else {
                couchDB.put('/_users/org.couchdb.user:' + user_name, data, function (err, response, body) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, body);
                    }
                });
            }
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