;!function (e) {
    e.couchDB = {};

    var _design = {};

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
        "store": "function (doc, req) {\nserviceStatus        if (doc.data && doc.data.field_de_store_id == req.query.field_de_store_id) {\n            return true;\n        }\n        return false;\n    }"
    };

    _design.updates = {
        "KCRequest": "function (doc, req) {\n        var newDoc = JSON.parse(req.body);\n        if (req.query.send_by_kc != 1){\n            newDoc.sync_status = false;\n        }else{\n            newDoc.sync_status = true;\n        }\n        return [newDoc, {json: {'id': newDoc._id}}];\n    }"
    };

    /**
     * 获取数据
     * @param method
     * @param url
     * @param user
     * @param data
     * @param password
     * @param callback
     */
    couchDB.ajax = function (method, url, data, user, password, callback) {
        var opts = {
            method: method,
            contentType : 'application/json',
            url:'http://localhost:5984/' + url,
            data: JSON.stringify(data),
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(callback).fail(function (jqXHR, textStatus, errorThrown) {
            layer.msg('couchDB操作失败', {icon: 2});
            console.log(url);
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
    };

    /**
     * 增加数据库
     * @param mc_id
     * @param user
     * @param password
     * @param callback
     */
    couchDB.addDB = function (mc_id, user, password, callback) {
        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/'+mc_id,
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(function (data) {
            callback(data)
        }).fail(function () {
            couchDB.ajax('put', mc_id, {}, user, password, function () {
                couchDB.ajax('put', mc_id+'/_design/kc', _design, user, password, callback)
            })
        });
    };

    /**
     * 编辑用户
     * @param mc_id
     * @param user_data
     * @param user
     * @param password
     * @param callback
     */
    couchDB.editUser = function (mc_id, user_data, user, password, callback) {
        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/_users/org.couchdb.user:'+mc_id,
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(function (data) {
            user_data._rev = data._rev;
            couchDB.ajax('put', '_users/org.couchdb.user:'+mc_id, user_data, user, password, callback)
        }).fail(function () {
            couchDB.ajax('put', '_users/org.couchdb.user:'+mc_id, user_data, user, password, callback)
        });
    };

    /**
     * 给用户授权
     * @param mc_id
     * @param user
     * @param password
     * @param callback
     * @constructor
     */
    couchDB.AuthUser = function (mc_id, user, password, callback) {
        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/'+mc_id+'/_security',
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        var auth = {
            "members": {
                "names": [mc_id],
                "roles": []
            }
        };
        $.ajax(opts).done(function (data) {
            auth._rev = data._rev;
            couchDB.ajax('put', mc_id+'/_security', auth, user, password, callback)
        }).fail(function () {
            couchDB.ajax('put', '_users/org.couchdb.user:'+mc_id, auth, user, password, callback)
        });
    };

    /**
     * 配置上行
     * @param mc_id
     * @param up
     * @param user
     * @param password
     * @param callback
     */
    couchDB.replicatorUP = function (mc_id, up, user, password, callback) {
        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/_replicator/up'+mc_id,
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(function (data) {
            up._rev = data._rev;
            couchDB.ajax('put', '_replicator/up'+mc_id, up, user, password, callback);
        }).fail(function () {
            couchDB.ajax('put', '_replicator/up'+mc_id, up, user, password, callback);
        });
    };

    /**
     * 配置下行
     * @param mc_id
     * @param down
     * @param user
     * @param password
     * @param callback
     */
    couchDB.replicatorDown = function (mc_id, down, user, password, callback) {

        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/_replicator/down'+mc_id,
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(function (data) {
            down._rev = data._rev;
            couchDB.ajax('put', '_replicator/down'+mc_id, down, user, password, callback);
        }).fail(function () {
            couchDB.ajax('put', '_replicator/down'+mc_id, down, user, password, callback);
        });
    };

    /**
     * 获取门店配置信息
     * @param user
     * @param password
     * @param callback
     */
    couchDB.getStoreConf = function (user, password, callback) {

        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/_replicator/_all_docs',
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(function (data) {
            var dbs = [];
            var res = [];
            var rows = data.rows;
            for (var i=1;i<rows.length;i++) {
                dbs.push(rows[i].id)
            }
            couchDB.getStoreReplicator(dbs, 0, res, user, password, callback)
        }).fail(function (data) {
            if (data.status === 404) {
                couchDB.ajax('put', '_replicator', {}, user, password, function () {
                    couchDB.ajax('put', '_users', {}, user, password, function () {
                        layer.msg('新门店初始化成功', {icon: 1});
                    });
                })
            } else {
                layer.msg('取门店配置数据失败', {icon: 2});
                console.log(data);
            }

        });
    };

    /**
     * 获取所有的同步关系
     * @param dbs
     * @param index
     * @param res
     * @param user
     * @param password
     * @param then
     */
    couchDB.getStoreReplicator = function (dbs, index, res, user, password, then) {
        if (index >= dbs.length) {
            then(res)
        } else {
            var opts = {
                method: 'get',
                contentType : 'application/json',
                url:'http://localhost:5984/_replicator/'+dbs[index],
                data: '',
                dataType:"json",
                processData: false,
                cache: false,
                crossDomain: true,
                headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
            };
            $.ajax(opts).done(function (data) {
                var d = {
                    "mc_id":data.mc_id,
                    "mc_pass":data.mc_pass,
                    "mc_type":data.mc_type,
                    "source":data.source,
                    "target":data.target,
                    "store_id":data.query_params.field_de_store_id
                };
                res.push(d);
                couchDB.getStoreReplicator(dbs, ++index, res, user, password, then)
            }).fail(function () {
                var d = {
                    "mc_id":'null',
                    "mc_pass":'null',
                    "mc_type":'null',
                    "source":'null',
                    "target":'null',
                    "store_id":'null'
                };
                res.push(d);
                couchDB.getStoreReplicator(dbs, ++index, res, user, password, then)
            })
        }
    };

    couchDB.deleteStoreConf = function (replicatorName, user, password, callback) {
        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/_replicator/'+replicatorName,
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(function (data) {
            couchDB.ajax('delete', '_replicator/'+replicatorName+'?rev='+data._rev, {}, user, password, function () {
                couchDB.getStoreConf(user, password, callback);
            });
        }).fail(function () {
            couchDB.getStoreConf(user, password, callback);
        });
    };

    /**
     * 增加门店配置信息
     * @param mc_id
     * @param mc_pass
     * @param target
     * @param store_id
     * @param user
     * @param password
     * @param callback
     */
    couchDB.addStoreConf = function (mc_id, mc_pass, target, store_id, user, password, callback) {
        var opts = {
            method: 'get',
            contentType : 'application/json',
            url:'http://localhost:5984/' + mc_id,
            data: '',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true,
            headers:{"Authorization": "Basic " + btoa(user + ":" + password)}
        };
        $.ajax(opts).done(function () {
            layer.msg('配置数据已经存在，如要重置，请删除原配置！', {icon: 2});

        }).fail(function (data) {
            if (data.status === 404) {
                var user_data = {
                    "name"    : mc_id,
                    "password": mc_pass,
                    "roles"   : [],
                    "type"    : "user"
                };
                var up = {
                    "source" : 'http://'+mc_id+':'+mc_pass+'@localhost:5984/'+mc_id,
                    "target" : target,
                    "mc_id" : mc_id,
                    "mc_pass" : mc_pass,
                    "mc_type" : 'up',
                    "continuous" : true,
                    "filter" : 'kc/store',
                    "query_params" : {
                        "field_de_store_id":store_id
                    }
                };
                var down = {
                    "source" : target,
                    "target" : 'http://'+mc_id+':'+mc_pass+'@localhost:5984/'+mc_id,
                    "mc_id" : mc_id,
                    "mc_pass" : mc_pass,
                    "mc_type" : 'down',
                    "continuous" : true,
                    "filter" : 'kc/store',
                    "query_params" : {
                        "field_de_store_id":store_id
                    }
                };
                couchDB.addDB(mc_id, user, password, function () {
                    couchDB.editUser(mc_id, user_data, user, password, function () {
                        couchDB.AuthUser(mc_id, user, password, function () {
                            couchDB.replicatorUP(mc_id, up, user, password, function () {
                                couchDB.replicatorDown(mc_id, down, user, password, function () {
                                    couchDB.getStoreConf(user, password, callback);
                                });
                            });
                        });
                    });
                });

            } else {
                layer.msg('增加配置失败', {icon: 2});
                console.log(data);
            }
        });
    }

}(window);
