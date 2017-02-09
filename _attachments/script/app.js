
function getDate(d, fmt){
    d = d ? d : (new Date());
    fmt = fmt ? fmt : 'YYYYMMDDHHmmss';
    return moment(d).format(fmt);
}
function isArray(o){
    return Object.prototype.toString.call(o) == '[object Array]';
}
function ajaxError(jqXHR, textStatus, errorThrown, options){
    return {
        "textStatus": textStatus,
        "errorThrown": typeof(errorThrown) === 'string' ? errorThrown : JSON.stringify(errorThrown),
        "responseText": jqXHR.responseText,
        "status":jqXHR.status,
        "getAllResponseHeaders":jqXHR.getAllResponseHeaders(),
        "options":options
    };
}
function ajax(options, then){
    if (typeof(options) === 'object') {
        if(options) {
            var verbose = options.verbose;
            delete options.verbose;
            options.timeout = options.timeout ? options.timeout : 60000;
            options.crossOrigin = true;
            return window.$.ajax(options).done(function (data, textStatus, jqXHR) {
                if(verbose){
                    console.log('--------success--------');
                    console.log(data);
                }
                if(typeof(then) === 'function'){
                    then(data, null);
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                var err = ajaxError(jqXHR, textStatus, errorThrown, options);
                if(verbose) {
                    console.log('---------error---------');
                    console.log(err);
                }
                if(typeof(then) === 'function') { 
                    then(null,err);
                }
            });
        }
    }
}
function get(url, then){
    return ajax({
        url:url,
        dataType: 'json',
        cache: false,
        crossDomain: true
    }, then);
}
function put_post(method, url, data, then){
    if (typeof(data) === 'function') {
        then =  data;
        data = undefined;
    }
    if(data === undefined) {
        return ajax({
            url:url,
            method: method,
            data:"",
            contentType : 'application/json',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true  
        }, then);
    } else {
        return ajax({
            url:url,
            method: method,
            data:JSON.stringify(data),
            contentType : 'application/json',
            dataType:"json",
            processData: false,
            cache: false,
            crossDomain: true  
        }, then);
    }    
}
function post(url, data, then) {
    return put_post('POST', url, data, then);
}
function put(url, data, then) {
    return put_post('PUT', url, data, then);
}
function topic(cfg, on_err, on_dbg) {
    'use strict';
    on_err = typeof (on_err) === "function" ? on_err : function (x) {console.log(x); };
    var ws = new WebSocket(cfg["bus-host"]),
        client = Stomp.over(ws),
        ret = {},
        status_str,
        sub = [];
    function dbg(str) {
        var f = typeof (on_dbg) === 'function' ? on_dbg : function (str) {};
        f(status_str + " " + str);
    }
    client.debug = dbg;
    ret.receive = function (on_msgs, keys, uids) {
        if(isArray(on_msgs)){
            if(on_msgs.length === 0){
                on_msgs = [function (x) {console.log(x); }];
            }
        } else if(typeof(on_msgs) === 'function'){
            on_msgs = [on_msgs];
        } else {
            on_msgs = [function (x) {console.log(x); }];
        }
        if(!isArray(keys)) {
            keys = [keys];
        }
        if(!isArray(uids)) {
            uids = [uids];
        }
        function getOptions(index) {
            if(index< uids.length) {
                return uids[index] ? {id: uids[index], durable: true, "auto-delete": false} : {"auto-delete": false};
            }
            return {"auto-delete": false};
        }
        function getOnMsg(index){
            if(index < on_msgs.length) {
                return on_msgs[index];
            } else {
                return on_msgs[on_msgs.length - 1];
            }
        }
        status_str = 'Try connect to ' + cfg["bus-host"];
        function suball(keys, index) {
            if(index < keys.length) {
                sub.push(client.subscribe('/topic/' + keys[index], getOnMsg(index), getOptions(index)));
                suball(keys, index + 1);
            }
        }
        if(client.connected) {
            suball(keys, 0);
        } else {
            client.connect('guest', 'guest', function () {
                status_str = 'Connected to ' + cfg["bus-host"] + '/topic/' + JSON.stringify(keys);
                suball(keys, 0);
            }, on_err, '/');
        }
    };
    ret.send = function (key, msg) {
        if(typeof(msg) !== 'string') {
            msg = JSON.stringify(msg);
        }
        if(typeof(key) !== 'string'){
            key = JSON.stringify(key);
        }
        client.send("/topic/" + key, {}, msg);
    };
    ret.close = function () {
        if (sub) {
            for(var i in sub) {
                sub[i].unsubscribe();
            }
            sub = null;
        }
        client.disconnect(function (x) {
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
//          console.log("disconnect of MQ")
        });
    };
    return ret;
}

function run(then){
    console.log('run...')
    loadConfig(function(cfg){
        getLocal('resolve-conflicts', function(c, err){
            setLocal("configuration", cfg, function(data, err){
                console.log("run resolve-conflicts +++++++++++");
                console.log(c);
                if(typeof(then) === 'function') {
                    then(cfg, function(){
                        receiveOC(cfg);
                        scanOrders(cfg, c);
                    })    
                } else {
                    receiveOC(cfg);
                    scanOrders(cfg, c);                    
                }
            });
        }); 
    });
}
function getAllURLs(){
    var result = [];
    window.$('.url').each(function(i, item){
        result.push({
            type:"anchor",
            name: item.name, 
            href: item.href,
            function:null
        });
    });
    return result;
}
function queryPOS(cfg){
    var mq = topic(cfg)
}
function receivePOS(cfg, on_req, on_error){
    var pending = {};
    var mq = topic(cfg, function (x){
        mq.close();
        if(typeof(on_error) === 'function') {
            on_error.call(mq, x);
        } else  {
            window.$('#stomp_info').html(x);
            console.log(x);
        }
    }, function(err){
        window.$('#stomp_info').html(err);
        console.log(err);        
    });
    function hook_msg(key, id){
        mq.receive(function(msg){
            var tmp = {"msg":JSON.parse(msg.body), destination:msg.headers.destination};
            if(tmp.msg.type === 'request') {
                if(typeof(on_req) === 'function') {
                    if(tmp.msg.to === cfg['kc-name'] || tmp.msg.to === 'all'){
                        if(tmp.msg.type === 'request'){
                            on_req.call(mq, tmp);
                        }
                    }
                } else {
                    console.log(tmp);
                }                
            } else if (tmp.msg.type === 'response') {
                if(typeof(pending[tmp.msg.id]) === 'function'){
                    var fun = pending[tmp.msg.id];
                    if(!tmp.msg.more){
                        delete pending[tmp.msg.id];
                    }
                    fun.call(mq, tmp);
                }
            }
        }, key, id);
    }
    hook_msg([cfg['kc-name'] + '.*.*','all.*.*']);
    var send = mq.send;
    mq.send = function (to, evt, msg, on_reply) {
        if(typeof(on_reply) === 'function' && msg.id) {
            pending[msg.id] = on_reply;
        }
        return send(to + '.' + cfg['kc-name'] + '.' + evt, msg);
    }
    return mq;
}

function receiveOC(cfg) {
    console.log('receiveOC...')
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
    function shovelByName(name){
        var i;
        for(i=0 ;i < cfg['mq-config'].parameters.length; ++i){
            if(cfg['mq-config'].parameters[i].name === name){
                return cfg['mq-config'].parameters[i].value;
            }        
        }
    }
    var from_oc = shovelByName('from-oc');
    if(from_oc) {
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
        }, from_oc["dest-queue"]);
    }
    return mq;
}

function compareOC(cfg, then){
    return get(cfg['oc-listUrl'], then);
}

function comparePOS(cfg, then){

}
function deploy(para, then){
    function deployOne(t, i){
        if(i<t.length) {
            post("_replicate", t[i].data, function (data, err){
                console.log(t[i].data);
                if(data){
                    then(data);
                } else {
                    then(null, err);
                }
                deployOne(t, i+1);
            });
        } 
    }
    if(typeof(para) === 'function') {
        then = para;
        para = undefined;
    }
    para = para ? para : "kc.target.json"; 
    if(typeof(para) === 'string') {
        window.$.getJSON(para, function (result) {
            deployOne(result.target, 0);
        });    
    } else if(isArray(para)) {
        deployOne(result.target, 0);        
    } 
}

function loadConfig(fun) {
    'use strict';
    console.log('loadConfig...');
    window.Mustache.clearCache();
    function walk(x, acc, func) {
        if(typeof(func) === "function") {
            var i;
            if (typeof (x) === "string") {
                return func(x, acc);
            } else if (typeof (x) === "object") {
                for (i in x) {
                    x[i] = walk(x[i], acc, func);
                }
            }
        }
        return x;
    }
    function render(x, env, tags) {
        return walk(x, {
            "tags": tags,
            "env": env 
        }, function(x, acc){
            if(!acc.tags){
                return window.Mustache.render(x, acc.env);
            } else {
                var buffer="", ii, a = window.Mustache.parse(x, acc.tags);
                for(ii in a) {
                    var obj = a[ii];
                    if(obj[0] === "name") {
                        buffer += env[obj[1]];
                    } else {
                        buffer += obj[1];
                    }
                }
                return buffer;
            }
        });
    }

    function collect(x, result) {
        var reg = /{%([0-9a-zA-Z_-]+)%}/;
        return walk(x, {}, function (x, acc) {
            var m = x.match(reg);
            if(m){
                result[m[1]] = true;
            }
            return x;            
        });
    }
    function obj2array(o){
        var i, ret = [];
        for(i in o){
            ret.push(i);
        }
        return ret;
    }
    function resolve(vars, index, result, then){
        if(index < vars.length) {
            getLocal(vars[index], function(data, err){
                result[vars[index]] = data;
                resolve(vars, index + 1, result, then);
            });
        } else {
            then(result);
        }
    }
    window.$.getJSON("kc.config.json", function (result) {
        result.baseurl = document.location.protocol + '//' + document.location.host +'/orders/_design/kc';
        result.hostname = document.location.hostname;
        if (typeof (fun) === "function") {
            var variables = {};
            result = collect(result, variables);
            variables = obj2array(variables);
            resolve(variables, 0, {}, function(rlt){
                result = render(result, rlt, ["{%", "%}"]);
                window.Mustache.clearCache();
                var xcfg = render(result, result);
                setupShovel(xcfg, function(data, err) {
                    fun(xcfg);
                });
            });
        } else {
            throw "Missing argument 'fun'!";
        }
    });
}
function orders(query, fun){
    return get('/orders/_design/kc/_view/' + query, fun);
}
function deleteOrders(data, then){
    if(data){
        data = JSON.parse(data);
        var tmp = {
            "docs":[]
        };
        for(var i in data.rows){
            for(var j in data.rows[i].value){
                tmp.docs.push({
                    "_id": data.rows[i].id,
                    "_rev":data.rows[i].value[j],
                    "_deleted": true
                });
            }
        }
        return post("/orders/_bulk_docs", tmp, then);
    }
}
function ordersBefore(x, fun) {
    var now = new Date();
    now.setDate(now.getDate()-x);
    now = getDate(now);
    return orders('timestamp?endkey=' + encodeURI(now), fun);
}
function getMQConfig(cfg){
    return {
        url: cfg["mq-config-url"],
        data: cfg["mq-config"]
    };
}

function compact(then){
    return post("/orders/_compact", function(data, err){
        if(data){
            post("/orders/_compact/kc", then);
        } else {
            then(data, err);
        }
    });
}
function setupShovel(cfg, then) {
    'use strict';
    if(typeof(then) === 'function'){
        then(cfg);
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
        if (!order.orderInfo) {
            order = order.order;
        }
        return post(cfg['oc-submitUrl'], order, fun);
    };
}
function modifyOC(cfg) {
    'use strict';
    return function (order, fun) {
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
        return post(cfg['oc-modifyUrl'], d, function(data, err){
            if(order.orderInfo.returntime) {
                post(cfg['oc-refundStatus'], {
                        orderid:order.orderInfo.orderid,
                        redundstatus:"1",
                        redundCheckStatus:"4"
                    }, fun);
            } else {
                fun(data, err);
            }
        });
    };
}

function updateOrders(order, then) {
    'use strict';
    order.timestamp = order.timestamp ? order.timestamp : getDate();
    window.$.couch.db('orders').saveDoc(order, {
        success: function (data) {
            console.log('update sync_status '+order._id+' success', data);
            then(order);
        },
        error: function (status) {
            console.log('update sync_status '+order._id+' failed', status);
            then(order);
        }
    });
}
function sync1Order(od, m, s, xthen) {
    console.log("sync1Order++++++++++++++++++++++++");
    m(od, function (data, err) {
        console.log(data);
        if (data){
            if (data.code == 0) {
                od.sync_status = 1;  //success
                od.oc_msg = data;
                window.updateOrders(od, xthen);
            } else if (data.code == 1001) {
                s(od, function (data1, err1) {
                    if(data1){
                        if(data.code == 0) {
                            od.sync_status = 1;  //success
                            od.oc_msg = data1;
                            window.updateOrders(od, xthen);                                
                        } else {
                            od.sync_status = (data1.code !== undefined && data1.code !== null) ? data1.code : 2; //unknown error code has return data
                            od.oc_msg = data1;
                            window.updateOrders(od, xthen);
                        }
                    } else {
                        od.sync_status = 3;  //unknown error code, no return data
                        od.oc_msg = err1;
                        window.updateOrders(od, xthen);
                    }
                });
            } else {
                od.sync_status = (data.code !== undefined && data.code !== null) ? data.code : 2;  //unknown error code has return data
                od.oc_msg = data;
                window.updateOrders(od, xthen);
            }
        } else {
            od.sync_status = 3;  //unknown error code, no return data
            od.oc_msg = err;
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
    console.log("docs length:" + docs.length);
    console.log("index:" + index);
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
function getRawLocal(key, then){
    console.log('getRawLocal('+key+', ...)');
    return get("/orders/_local/"+ key, then);
}
function getLocal(key, then){
    getRawLocal(key, function(data, err){
        then(data ? data.value : data, err);
    });
}

function setRawLocal(key, v, then){
    console.log('setRawLocal('+key+', ' + v + ', ...)');
    return put("/orders/_local/" + key, v, then);
}
function setLocal(key, v, then){
    getRawLocal(key, function(data, err){
        if(data){
            data.value = v;
        } else {
            data = {_id:key, value:v};
        }
        setRawLocal(key, data, then);
    });
}


function resolveConflicts(xthen) {
    'use strict';
    function separate(data) {
        var irrelevant = data.filter(function (doc) {
            return !((doc.order)
                    && (doc.order.orderInfo)
                    && (typeof(doc.order) === 'object') 
                    && (typeof(doc.order.orderInfo) === "object"));
        });
        //We are interested in order data only
        data = data.filter(function(doc) {
            return ((doc.order)
                    && (doc.order.orderInfo)
                    && (typeof(doc.order) === 'object') 
                    && (typeof(doc.order.orderInfo) === "object"));
        }).sort(function(item1, item2) {
            if (item1.order.orderInfo.orderstatus > item2.order.orderInfo.orderstatus) {
                return -1;
            } else if (item1.order.orderInfo.orderstatus < item2.order.orderInfo.orderstatus) {
                return 1;
            } else {
                if (item1.sync_status > item2.sync_status) {
                    return 1;
                } else if (item2.sync_status > item1.sync_status) {
                    return -1;
                }
                return 0;
            }
        });
        return {
            "keep": data.slice(0,1), 
            "remove": data.slice(1), 
            "irrelevant": irrelevant
        };
    }
    function asyncUpdate(data, index, result, then) {
        if(index < data.length) {
            window.$.couch.db("orders").removeDoc(data[index], {
                success: function(data) {
                    console.log(data);
                    asyncUpdate(data, index + 1, result, then);
                },
                error: function(status) {
                    console.log(status);
                    asyncUpdate(data, index + 1, result, then);
                }
            });
        } else {
            then(result);
        }
    }
    function asyncMap(data, index, result, then) {
        if((data.length > 0) && (index < data[0].key.length)) {
            get( "/orders/"+data[0].id+"?include_docs=true&rev="+data[0].key[index], function (data, err){
                if(data){
                    result.push(x);
                }
                asyncMap(data, index + 1, result, then);
            });
        } else {
            then(result);
        }
    }
    function next(err){
        if(err) {
            console.log(JSON.stringify(err));
        }
        if (typeof (xthen) === 'function'){
            xthen(err);
        } else {
            window.setTimeout(function () {
                resolveConflicts(xthen);
            }, 10000);
        }
    }
    get("/orders/_design/kc/_view/conflicts?limit=1", function (data, err){
        if(data){
            asyncMap(data.rows, 0, [], function(results){
                if(results.length > 0) {
                    results = separate(results);
                    asyncUpdate(results.remove.concat(results.irrelevant), 0, [], function() {
                        if(results.remove.length > 0){
                            resolveConflicts(xthen);
                        } else {
                            next();
                        }
                    });
                } else {
                    next();               
                }
            });
        } else {
            next(err);
        }
    });
}

function scanOrders(cfg, resolve) {
    'use strict';
    function next() {
        if(resolve) {
            resolveConflicts(function (){
                window.setTimeout(function () {
                    scanOrders(cfg);
                }, 10000);
            });
        } else {
            window.setTimeout(function () {
                scanOrders(cfg);
            }, 10000);                
        }
    }
    console.log("scanOrders ++++++++++++++++++");
    get("/orders/_design/kc/_view/status?startkey=[0,3]&endkey=[0,100]&include_docs=true&conflicts=true", function(data, err) {
        console.log(data);
        if(data){
            var m = modifyOC(cfg),
                s = submitOC(cfg);
            scanDBCounter.success++;
            window.$('#scan_db_success').html(scanDBCounter.success);
            window.syncOC(m, s, data.rows.filter(function(item){
                console.log("item ++++++++++++++++++++++");
                console.log(item);
                console.log(item.value);
                console.log(item.value.length);
                return item.value.length === 1;
            }).map(function (o) {
                return o.doc;
            }), 0, function () {
                next();
            });
        } else {
            scanDBCounter.fail++;
            window.$('#scan_db_fail').html(scanDBCounter.fail);
            next();
        }
    });
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
        window.syncOC(m, s, tmp.filter(function(item){
            return item.value.length === 1;
        }).map(function (o) {
            return o.doc;
        }), 0, function () {
            window.setTimeout(function () {
                window.onOrderChange(cfg, result.last_seq);
            }, 10000);
        });
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log(JSON.stringify(ajaxError(jqXHR, textStatus, errorThrown)));
        window.setTimeout(function () {
            onOrderChange.onOrderChange(cfg, last_seq);
        }, 10000);
    });
    return last_seq;
}

function retryFailed(cfg, then) {
    'use strict';
    window.$.getJSON("/orders/_design/kc/_view/status?startkey=[2,3]&endkey=[9999,100]&include_docs=true&conflicts=true", function(result){
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
        window.syncOC(m, s, tmp.filter(function(item){
            return item.value.length === 1;
        }).map(function (o) {
            return o.doc;
        }), 0, function () {
            if(typeof(then) === "function") {
                then("success");
            }
        });
    }).fail(function(xhr, err){
        if(typeof(then) === "function") {
            then(null, err);
        }
    })
}
