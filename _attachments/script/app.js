
function getDate(){
    return (new Date()).toLocaleString();
}
function topic(cfg, on_err, on_dbg) {
    'use strict';
    on_err = typeof (on_err) === "function" ? on_err : function (x) {console.log(x); };
    var ws = new WebSocket(cfg["bus-host"]),
        client = Stomp.over(ws),
        ret = {},
        status_str,
        sub = null;
    function dbg(str) {
        var f = typeof (on_dbg) === 'function' ? on_dbg : function (str) {};
        f(status_str + " " + str);
    }
    client.debug = dbg;
    ret.receive = function (on_msg, key, uid) {
        on_msg = typeof (on_msg) === "function" ? on_msg : function (x) {console.log(x); };
        status_str = 'Try connect to ' + cfg["bus-host"];
        if (uid) {
            client.connect('guest', 'guest', function () {
                status_str = 'Connected to ' + cfg["bus-host"] + '/queue/' + key;
                sub = client.subscribe('/topic/' + key, on_msg, {id: uid, durable: true, "auto-delete": false});
            }, on_err, '/');
        } else {
            client.connect('guest', 'guest', function () {
                status_str = 'Connected to ' + cfg["bus-host"] + '/queue/' + key;
                sub = client.subscribe('/topic/' + key, on_msg, {"auto-delete": false});
            }, on_err, '/');
        }
    };
    ret.send = function (key, msg) {
        client.send("/topic/" + key, {}, msg);
    };
    ret.close = function () {
        if (sub) {
            sub.unsubscribe();
            sub = null;
        }
        client.disconnect(function (x) {
//            console.log(x);
//            ws.close();
        });
    };
    return ret;
}
function getOCQueryURL(cfg, orderid){
    return cfg['oc-queryUrl'] + orderid;
}
function queue(cfg, on_err, on_dbg) {
    'use strict';
    on_err = typeof (on_err) === "function" ? on_err : function (x) {console.log(x); };
    var ws = new window.WebSocket(cfg["bus-host"]),
        client = window.Stomp.over(ws),
        ret = {},
        status_str,
        sub = null;
    function dbg(str) {
        var f = typeof (on_dbg) === 'function' ? on_dbg : function (str) {};
        f(status_str + " " + str);
    }
    client.debug = dbg;
    ret.receive = function (on_msg, key) {
        on_msg = typeof (on_msg) === "function" ? on_msg : function (x) {console.log(x); };
        status_str = 'Try connect to ' + cfg["bus-host"];
        client.connect('guest', 'guest', function () {
            status_str = 'Connected to ' + cfg["bus-host"] + '/queue/' + key;
            sub = client.subscribe('/queue/' + key, on_msg);
        }, on_err, '/');
    };
    ret.send = function (key, msg) {
        client.send("/queue/" + key, {}, msg);
    };
    ret.close = function () {
        if (sub) {
            sub.unsubscribe();
            sub = null;
        }
        client.disconnect(function (x) {
//            console.log("disconnect of MQ")
        });
    };
    return ret;
}

function receiveOC(cfg) {
    var mq = queue(cfg, function (x) {
        window.$('#stomp_info').html(x);
        mq.close();
        window.setTimeout(function () {   
            receiveOC(cfg);
        }, 10000);
    }, function (str) {
        window.$('#stomp_info').html(str);
        console.log(str);
    });
    mq.receive(function(msg){
        var doc = {
            _id: msg.orderInfo.orderid,
            sync_status: 1,
            timestamp: getDate(),
            oc_msg: null,
            order: msg
        };
        window.$.couch.db('orders').saveDoc(doc, function(data, status){
            console.log('save data from oc to orders');
        });
    }, cfg.shovels['from-oc']["dest-queue"]);
}

function loadConfig(fun) {
    'use strict';
    function render(x, env) {
        var i;
        if (typeof (x) === "string") {
            return window.Mustache.render(x, env);
        } else if (typeof (x) === "object") {
            for (i in x) {
                x[i] = render(x[i], env);
            }
        }
        return x;
    }
    window.$.getJSON("kc.config.json", function (result) {
        result.baseurl = document.location.protocol + '//' + document.location.host +'/orders/_design/kc';
        result.hostname = document.location.hostname;
        if (typeof (fun) === "function") {
            fun(render(result, result));
        } else {
            throw "Missing argument 'fun'!";
        }
    });
}

function setupShovel(cfg) {
    'use strict';
    var i;
    function on_success(data, textStatus, jqXHR) {
        console.log(data, textStatus);
    }
    function on_err(jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
    }
    for (i in cfg.shovels) {
        window.$.ajax({
            url: cfg["shovel-url"] + i,
            type: "PUT",
            cache: false,
            username: 'guest',
            password: 'guest',
            data: JSON.stringify({"value": cfg.shovels[i]}),
            success: on_success,
            error: on_err
        });
    }
}

function queryOC(cfg) {
    'use strict';
    return function (id, fun) {
        fun = typeof (fun) === "function" ? fun : function (x) {console.log(x); };
        window.$.getJSON(cfg['oc-queryUrl'] + id, fun);
    };
}
function submitOC(cfg) {
    'use strict';
    return function (order, fun) {
        fun = typeof (fun) === "function" ? fun : function (x, y) {console.log(x, y); };
        if (!order.orderInfo) {
            order = order.order;
        }
        window.$.ajax({
            url: cfg['oc-submitUrl'],
            method: 'POST',
            cache: false,
            contentType: 'application/json',
            timeout: 60000,
            dataType: 'json',
            data: JSON.stringify(order),
            processData: false
        }).done(function (data, textStatus, jqXHR) {
            fun(data, textStatus);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            fun(null, {
                "textStatus": textStatus,
                "errorThrown": typeof(errorThrown) === 'string' ? errorThrown : JSON.stringify(errorThrown),
                "statusCode": jqXHR.statusCode()
            });
        });        
    };
}
function modifyOC(cfg) {
    'use strict';
    return function (order, fun) {
        fun = typeof (fun) === "function" ? fun : function (x, y) {console.log(x, y); };
        if (!order.orderInfo) {
            order = order.order;
        }
        var d = {},
            f = ["orderid",
                "orderstatus",
                "cancelorderoperator",
                "deliveryway",
                "ischange",
                "Isneedinvoice",
                "Invoicetitle",
                "mealstime",
                "deliverytime",
                "receivetime",
                "returntime",
                "canceltime",
                "paytime"];
        
        for (var i in f) {
            var k = f[i];
            var v = order.orderInfo[k];
            if(v !== undefined && v !== null) {
                d[k] = v;    
            }
        }
        window.$.ajax({
            url: cfg['oc-modifyUrl'],
            method: 'POST',
            contentType: 'application/json',
            cache: false,
            timeout: 60000,
            dataType: 'json',
            data: JSON.stringify(d),
            processData: false
        }).done(function (data, textStatus, jqXHR) {
            fun(data, textStatus);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            fun(null, {
                "textStatus": textStatus,
                "errorThrown": typeof(errorThrown) === 'string' ? errorThrown : JSON.stringify(errorThrown),
                "statusCode": jqXHR.statusCode()
            });
        });
    };
}
function updateOrders(order, then) {
    'use strict';
    order.timestamp = order.timestamp ? order.timestamp : getDate();
    window.$.couch.db('orders').saveDoc(order, {
        success: function (data) {
            console.log('update order '+order._id+' success', data);
            then(order);
        },
        error: function (status) {
            console.log('update order '+order._id+' failed', status);
            then(order);
        }
    });
}
function sync1Order(od, m, s, xthen) {
    m(od, function (data, status) {
        if (data){
            if (data.code == 0) {
                od.sync_status = 1;
                od.oc_msg = data;
                window.updateOrders(od, xthen);
            } else if (data.code == 1001) {
                s(od, function (data, status) {
                    if(data){
                        if(data.code == 0) {
                            od.sync_status = 1;
                            od.oc_msg = data;
                            window.updateOrders(od, xthen);                                
                        } else {
                            od.sync_status = data.code ? data.code : 2;
                            od.oc_msg = data;
                            window.updateOrders(od, xthen);
                        }
                    } else {
                        od.sync_status = 3;
                        od.oc_msg = status;
                        window.updateOrders(od, xthen);
                    }
                });
            } else {
                od.sync_status = data.code ? data.code : 2;
                od.oc_msg = data;
                window.updateOrders(od, xthen);
            }
        } else {
            od.sync_status = 3;
            od.oc_msg = status;
            window.updateOrders(od, xthen);                
        }
    });    
}
function getStoreName(order){
    if(order){
        if(order.orderInfo){
            return order.orderInfo.storename;
        }
    }
    console.log(order);
}
function syncOC(m, s, docs, index, then) {
    'use strict';
    if (index < docs.length) {
        var od = docs[index],
            xthen = function (order) {
                console.log("after sync to OC storename=" + getStoreName(order.order));
                syncOC(m, s, docs, index + 1, then);
            };
        console.log("before sync to OC storename=" + getStoreName(od.order));
        window.sync1Order(od, m, s, xthen);
    } else {
        then();
    }
}
var scanDBCounter = {
    success: 0,
    fail: 0
};
function test(){
    
    window.$.ajax({
//        url: "http://127.0.0.1:5984/orders/CN000001201612158654",
        url: "http://127.0.0.1:5984/orders/_design/kc/_view/status?startkey=[0,4]&endkey=[0,100]&include_docs=true&conflicts=true",
        cache: false
    }).done(function (data, textStatus, jqXHR) {
        console.log('success');
        console.log(data);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log('failed ' + textStatus);
    });        

}
function scanOrders(cfg) {
    'use strict';
    window.$.ajax({
        url: cfg.baseurl + "/_view/status?startkey=[0,4]&endkey=[0,100]&include_docs=true&conflicts=true",
        cache: false,
        timeout: 60000
    }).done(function (data, textStatus, jqXHR) {
        data = JSON.parse(data);
        var m = modifyOC(cfg),
            s = submitOC(cfg);
        scanDBCounter.success++;
        window.$('#scan_db_success').html(scanDBCounter.success);
        window.syncOC(m, s, data.rows.map(function (o) {
            return o.doc;
        }), 0, function () {
            window.setTimeout(function () {
                scanOrders(cfg);
            }, 10000);
        });
    }).fail(function (jqXHR, textStatus, errorThrown) {
        scanDBCounter.fail++;
        window.$('#scan_db_fail').html(scanDBCounter.fail);
        console.log(status);
        window.setTimeout(function () {
            scanOrders(cfg);
        }, 10000);
    });        

/*
    window.$.couch.db('orders').view('kc/status?startkey=[0,4]&endkey=[0,100]&include_docs=true&conflicts=true', {
        success: function(data) {
            var m = modifyOC(cfg),
                s = submitOC(cfg);
            scanDBCounter.success++;
            window.$('#scan_db_success').html(scanDBCounter.success);
            window.syncOC(m, s, data.rows.map(function (o) {
                return o.doc;
            }), 0, function () {
                window.setTimeout(function () {
                    scanOrders(cfg);
                }, 10000);
            });
        },
        error: function(status) {
            scanDBCounter.fail++;
            window.$('#scan_db_fail').html(scanDBCounter.fail);
            console.log(status);
            window.setTimeout(function () {
                scanOrders(cfg);
            }, 10000);
        }
    });
*/    
}
function onOrderChange(cfg, last_seq) {
    'use strict';
    if ((last_seq === undefined) || (last_seq === null)) {
        last_seq = 'now';
    }
    console.log('listen to changes since '+last_seq);
    window.$.getJSON("/orders/_changes?feed=longpoll&since="+last_seq+"&include_docs=true&conflicts=true", function (result) {
        var tmp = result.results.filter(function (o) {
            if (!o.doc.deleted) {
                if (o.doc.order) {
                    if (o.doc.order.orderInfo) {
                        if (o.doc.order.orderInfo.orderstatus >= 4) {
                            return o.doc.sync_status === 0;
                        }
                    }
                }                
            }
            return false;
        }),
        m = window.modifyOC(cfg),
        s = window.submitOC(cfg); 
        window.syncOC(m, s, tmp.map(function (o) {
            return o.doc;
        }), 0, function () {
            window.setTimeout(function () {
                window.onOrderChange(cfg, result.last_seq);
            }, 10000);
        });
    }).fail(function(xhr, err) {
        console.log(err);
        window.setTimeout(function () {
            onOrderChange.onOrderChange(cfg, last_seq);
        }, 10000);
    });
    return last_seq;
}

function retryFailed(cfg, then) {
    'use strict';
    window.$.getJSON("/orders/_design/kc/_view/status?startkey=[2,4]&endkey=[9999,100]&include_docs=true&conflicts=true", function(result){
        var tmp = result.rows.filter(function (o) {
            if (!o.doc.deleted) {
                if (o.doc.order) {
                    if (o.doc.order.orderInfo) {
                        return o.doc.order.orderInfo.orderstatus >= 4;
                    }
                }                
            }
            return false;
        }),
        m = window.modifyOC(cfg),
        s = window.submitOC(cfg); 
        window.syncOC(m, s, tmp.map(function (o) {
            return o.doc;
        }), 0, function () {
            if(typeof(then) === "function") {
                then();
            }
        });        
    }).fail(function(xhr, err){
        if(typeof(then) === "function") {
            then(err);
        }
    })
}
