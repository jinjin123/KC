'use strict';

var cradle = require('cradle');
var request = require('request');
var _design = {};
var db = {};

// couchDB views get not sync order
_design.language = 'javascript';
_design.views = {};
_design.views.sync_status = {
    map: function(doc) {
        if (doc.data.uuid && doc._deleted !== true && doc.data.state && (!doc.sync_failed_num || doc.sync_failed_num < 5)) {
            if (!doc.sync_status || doc.sync_status !== 1 || doc.last_state !== doc.data.state) {
                emit(doc.sync_status, doc);
            }
        }
    }
};

_design.views.sync_failed = {
    map: function(doc) {
        if (doc.data.uuid && doc._deleted !== true && doc.data.state && doc.sync_failed_num && doc.sync_failed_num >= 5) {
            if (!doc.sync_status || doc.sync_status !== 1) {
                emit(doc.sync_failed, doc);
            }
        }
    }
};

_design.views.conflicts = {
    map: function(doc) {
        if (doc._conflicts) {
            emit([doc._rev].concat(doc._conflicts), [doc._rev].concat(doc._conflicts));
        }
    }
};

_design.views.checkuuidid = {
    map: function(doc) {
        if (doc.data && doc.data.order_items && doc.data.state && doc._id !== doc.data.uuid) {
            emit(doc.data.uuid, {"_id": doc._id, "uuid": doc.data.uuid});
        }
    }
};

_design.views.hx = {
    map: function(doc) {
        function getOrderTimestamp(doc){
            function convertDate(d) {
                if(typeof(d) === 'string') {
                    var m = d.match(/([0-9]+)-([0-9]+)-([0-9]+) ([0-9]+):([0-9]+):([0-9]+)/);
                    if(m){
                        return m[1] + m[2] + m[3] + m[4] + m[5] + m[6];
                    }
                }
            }
            if(doc && doc.order && doc.order.orderInfo){
                if(doc.timestamp)
                    return doc.timestamp;
                var info = doc.order.orderInfo;
                var fields = ['paytime', 'addtime', 'booktime', 'returntime', 'canceltime', 'mealstime', 'deliverytime', 'receivetime'];
                for(var i in fields) {
                    var ret = convertDate(info[fields[i]]);
                    if(ret){
                        return ret;
                    }
                }
                return doc.timestamp;
            }
        }
        if (doc.order && doc.order.orderInfo && doc.order.orderInfo.orderstatus) {
            var ts = getOrderTimestamp(doc);
            emit(ts, {"orderstatus": doc.order.orderInfo.orderstatus,"totalamount":doc.order.orderInfo.totalamount});
        }
    }
};


_design.views.lh = {
    map: function(doc) {
        function getOrderTimestamp(doc){
            if(doc && doc.data && doc.data.order_items){
                if(doc.timestamp)
                    return doc.timestamp;
                //var info = doc.data.order_items;
                var info = doc.data;
                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];
                for(var i in fields) {
                    var ret = info[fields[i]];
                    if(ret){
                        return ret;
                    }
                }
                return doc.timestamp;
            }
        }
        if (doc.data && doc.data.order_items && doc.data.state) {
            var ts = getOrderTimestamp(doc);
            var t = new Date(ts * 1000);
            var st = Number(doc.data.field_de_store_id) + 0;
            var ymd = t.getFullYear() * 10000 + ((t.getMonth() + 1) * 100 + t.getDate());
            var hms = (t.getHours() + 8) * 10000 +  t.getMinutes() * 100 + t.getSeconds();
            emit([ymd, hms, st], {"state": doc.data.state, "order_number": doc.data.order_number, "sync_status": doc.sync_status});
        }
    }
};

_design.views.order_status = {
    map: function(doc) {
        if(doc.data && doc.data.order_items && doc.data.state){
            emit(doc.data.state, doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);
        }
    }
};

_design.views.refund = {
    map: function(doc) {
        if (doc.data && doc.data.order_items && doc.data.state && doc.data.field_returned) {
            emit(doc.data.uuid,null);
        }
    }
};

_design.views.status = {
    map: function (doc) {
        if (doc.data && doc.data.order_items && doc.data.state) {
            emit([doc.sync_status, doc.data.state], doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);
        }
    }
};

_design.views.store = {
    map: function(doc) {
        function getOrderTimestamp(doc){
            if(doc && doc.data && doc.data.order_items){
                if(doc.timestamp)
                    return doc.timestamp;
                //var info = doc.data.order_items;
                var info = doc.data;
                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];
                for(var i in fields) {
                    var ret = info[fields[i]];
                    if(ret){
                        return ret;
                    }
                }
                return doc.timestamp;
            }
        }
        if (doc.data && doc.data.state) {
            var ts = getOrderTimestamp(doc);
            var rev = doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]
            emit(ts, {"rev": rev, "field_de_store_id": doc.data.field_de_store_id});
        }else if(doc.order && doc.order.orderInfo){
            var ts = doc.order.orderInfo.addtime;
            var rev = doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]
            emit(ts, {"rev": rev, "field_de_store_id": "nothing"});
        }
    }
};

_design.views.submittime = {
    map: function(doc) {
        function getOrderTimestamp(doc){
            if(doc && doc.data && doc.data.order_items){
                if(doc.timestamp)
                    return doc.timestamp;
                //var info = doc.data.order_items;
                var info = doc.data;
                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];
                for(var i in fields) {
                    var ret = info[fields[i]];
                    if(ret){
                        return ret;
                    }
                }
                return doc.timestamp;
            }
        }
        if (doc.order && doc.order.orderInfo && doc.order.orderInfo.orderstatus) {
            var ts = getOrderTimestamp(doc);
            emit(ts, {beforeSubmit: doc.BeforSubmittingTime, afterSubmit: doc.AfterSubmittingTime});
        }
    }
};

_design.views.timeprice = {
    map: function(doc) {
        function getOrderTimestamp(doc){
            if(doc && doc.data && doc.data.order_items){
                if(doc.timestamp)
                    return doc.timestamp;
                //var info = doc.data.order_items;
                var info = doc.data;
                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];
                for(var i in fields) {
                    var ret = info[fields[i]];
                    if(ret){
                        return ret;
                    }
                }
                return doc.timestamp;
            }
        }
        function GetDate(t){
            var t = new Date(t * 1000);
            //return t.Format("yyyy-MM-dd HH:mm:ss");
            return t.toLocaleString();
        }
        if (doc.data && doc.data.order_items && doc.data.state) {
            var ts = getOrderTimestamp(doc);
            var timestamp = GetDate(doc.timestamp);
            var BeforSubmittingTime = GetDate(doc.BeforSubmittingTime);
            var AfterSubmittingTime = GetDate(doc.AfterSubmittingTime);
            emit(ts, {"timestamp":timestamp,"BeforSubmittingTime":BeforSubmittingTime, "AfterSubmittingTime":AfterSubmittingTime});
        }
    }
};

_design.views.timestamp = {
    map: function(doc) {
        function getOrderTimestamp(doc){
            if(doc && doc.data && doc.data.order_items){
                if(doc.timestamp)
                    return doc.timestamp;
                //var info = doc.data.order_items;
                var info = doc.data;
                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];
                for(var i in fields) {
                    var ret = info[fields[i]];
                    if(ret){
                        return ret;
                    }
                }
                return doc.timestamp;
            }
        }
        if (doc.data && doc.data.state) {
            var ts = getOrderTimestamp(doc);
            var rev = doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]
            emit(ts, {"rev": rev, "field_de_store_id": doc.data.field_de_store_id});
        }
    }
};

_design.views.timestatus = {
    map: function(doc) {
        function getOrderTimestamp(doc){
            if(doc && doc.data && doc.data.order_items){
                if(doc.timestamp)
                    return doc.timestamp;
                //var info = doc.data.order_items;
                var info = doc.data;
                var fields = ['placed', 'completed', 'field_canceled', 'field_delivering_time', 'field_delivered', 'field_payment_received', 'field_returned'];
                for(var i in fields) {
                    var ret = info[fields[i]];
                    if(ret){
                        return ret;
                    }
                }
                return doc.timestamp;
            }
        }
        if (doc.data && doc.data.order_items && doc.data.state) {
            var ts = getOrderTimestamp(doc);
            var t = new Date(ts * 1000);
            var ymd = t.getFullYear() * 10000 + (t.getMonth() * 100 + t.getDate());
            var hms = t.getHours() * 10000 +  t.getMinutes() * 100 + t.getSeconds();
            emit([doc.sync_status, doc.data.state, ymd, hms], doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);
        }
    }
};

_design.views.uuid = {
    map: function(doc) {
        if (doc["35"] && doc["34"]) {
            emit(doc["35"], doc._conflicts ? [doc._rev].concat(doc._conflicts) : [doc._rev]);
        }
    }
};

_design.filters = {
    design: function(doc, req) {
        if (doc._id.match(/^_design\//)) {
            if (doc.order === undefined) {
                return true;
            }
        }
        return false;
    },
    data: function(doc, req) {
        if (doc.data) {
            return true;
        }
        return false;
    },
    store: function(doc, req) {
        if (doc.data && doc.data.field_de_store_id == req.query.field_de_store_id) {
            return true;
        }
        return false;
    }
};

_design.updates = {
    KCRequest: function (doc, req) {
        var newDoc = JSON.parse(req.body);
        if (req.query.send_by_kc != 1){
            newDoc.sync_status = false;
        }else{
            newDoc.sync_status = true;
        }
        return [newDoc, {json: {'id': newDoc._id}}];
    }
}

db.init = function (dbname) {
    var connection = new(cradle.Connection)(global.config.database.host, global.config.database.port, {
        auth: { username: global.config.database.user, password: global.config.database.pwd }
    });
    var cdb =  connection.database(dbname);

    // 写入view
    console.log('write kc view')
    cdb.save('_design/kc', _design, function (err, res) {
        console.log(err)
        console.log(res)
    });

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