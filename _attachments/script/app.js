/**
 * gether all configuration related code into a module for other app to use
 *    common configure structure
 *    variable susbstitution mechanisms
 *    
 * support browser to browser RPC
 * 
 * gether communication related code into a module for other app to use mq
 * 
 * monitoring
 */
function getTime(d, fmt){
    d = d ? d : (new Date());
    return Math.round(d.getTime()/1000);
}
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
          return doc.timestamp ? doc.timestamp : getTime();
      } 
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
var CONFIG;

function ajax(user, password, options, then){
    if (typeof(options) === 'object') {
        if(options) {
            var verbose = options.verbose;
            delete options.verbose;
            options.timeout = options.timeout ? options.timeout : 60000;
            if(user && password) {
                options.headers = {
                    "Authorization": "Basic " + btoa(user + ":" + password)
                };                
            }
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
function get(url, user, password, then){
    return ajax(user, password, {
        url:url,
        dataType: 'json',
        cache: false,
        crossDomain: true
    }, then);
}
function put_post(method, url, user, password, data, then){
    if (typeof(data) === 'function') {
        then =  data;
        data = undefined;
    }
    if(data === undefined) {
        return ajax(user, password, {
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
        return ajax(user, password, {
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
function post(url, user, password, data, then) {
    return put_post('POST', url, user, password, data, then);
}
function put(url, user, password, data, then) {
    return put_post('PUT', url, user, password, data, then);
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

function run(retry_day, then){
    console.log('run...')
    loadConfig(function(cfg){
        setLocal("configuration", cfg, function(data, err){
            if(typeof(then) === 'function') {
                then(cfg, function(){
                    //receiveOC(cfg);
                    //scanOrders(retry_day, cfg);
                    multipleAjax(retry_day, cfg).run();
                    //scanDatabase(retry_day, cfg);
                })    
            } else {
                //receiveOC(cfg);
                //scanOrders(retry_day, cfg);
                multipleAjax(retry_day, cfg).run();
                //scanDatabase(retry_day, cfg);                  
            }
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
                timestamp: getOrderTimestamp(msg),
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
        console.log("loading get json +++++++++++");
        console.log(result);
        result.baseurl = document.location.protocol + '//' + document.location.host +'/code/_design/kc';
        result.hostname = document.location.hostname;
        if (typeof (fun) === "function") {
            var variables = {};
            result = collect(result, variables);
            variables = obj2array(variables);
            console.log(variables);
            resolve(variables, 0, {}, function(rlt){
                result = render(result, rlt, ["{%", "%}"]);
                window.Mustache.clearCache();
                var xcfg = render(result, result);
                setupShovel(xcfg, function(data, err) {
                    CONFIG = xcfg;
                    fun(xcfg);
                });
            });
        } else {
            throw "Missing argument 'fun'!";
        }
    });
}
function orders(dbcfg, query, fun){
    return get('/' + dbcfg["bid"] + '/_design/kc/_view/' + query, dbcfg["udb"], dbcfg["pdb"], fun);
}
function deleteOrders(dbcfg, data, then){
    if(data){
        //data = JSON.parse(data);
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
        console.log("INFO: Delete ", tmp);
        return post("/" + dbcfg["bid"] + "/_bulk_docs", dbcfg["udb"], dbcfg["pdb"], tmp, then);
    }
}
function ordersBefore(dbcfg, x, fun) {
    var now = new Date();
    now.setDate(now.getDate()- x);
    now = getTime(now);
    return orders(dbcfg, 'timestamp?endkey=' + encodeURI(now), fun);
}
function getMQConfig(cfg){
    return {
        url: cfg["mq-config-url"],
        data: cfg["mq-config"]
    };
}

function compact(dbcfg, then){
    return post("/" + dbcfg["bid"] + "/_compact", dbcfg["udb"], dbcfg["pdb"],  function(data, err){
        if(data){
            post("/" + dbcfg["bid"] + "/_compact/kc", dbcfg["udb"], dbcfg["pdb"], then);
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
    return function (user, password, order, fun) {
      return submitOCN(cfg['oc-submitUrl'], user, password, order, fun);
    };
}
function modifyOC(cfg) {
    'use strict';
    return function (user, password, order, fun) {
      return modifyOCN(cfg['oc-modifyUrl'], user, password, order, fun);
    };
}

function updateOrders(dbcfg, order, then) {
    'use strict';
    order.modifier = 'kc2';
    order.timestamp = getOrderTimestamp(order);
    window.$.couch.db(dbcfg["bid"]).saveDoc(order, {
        username: dbcfg["udb"],
        password: dbcfg["pdb"],
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(dbcfg["udb"] + ":" + dbcfg["pdb"]));
        },
        success: function (data) {
            console.log('update sync_status '+order._id+' success', data);
            then(order);
        },
        error: function (status) {
            console.log("udb:" + dbcfg["udb"]);
            console.log("pdb:" + dbcfg["pdb"]);
            console.log('update sync_status '+order._id+' failed', status);
            then(order);
        }
    },{
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(dbcfg["udb"] + ":" + dbcfg["pdb"]));
        }
    });
}
function sync1Order(dbcfg, od, m, s, xthen) {
    console.log("sync1Order++++++++++++++++++++++++");
    if(od.data.submited == true){
      m(dbcfg["uoc"], dbcfg["poc"], od, function (data, err) {
        console.log(data);
        if (data) {
            if (data.status == 200) {
                od.sync_status = 1;  //success
                od.oc_msg = data;
                //window.updateOrders(dbcfg, od, xthen);
                window._updateDB(dbcfg, od, xthen);
            } else if (data.status == 404) {
                console.log("00000000000000000000000000000000000000000000000000000000000");
                s(dbcfg["uoc"], dbcfg["poc"], od, function (data1, err1) {
                    if(data1){
                        if(data1.status == 200) {
                            od.sync_status = 1;  //success
                            data1.responseJSON = null;
                            data1.responseText = null;
                            od.oc_msg = data1;
                            od.order.submited = true;
                            //window.updateOrdersSubmited(dbcfg, od, xthen);
                            window._updateDB(dbcfg, od, xthen);                           
                        }else if(data1.status == 409){
                          console.log("if 0000000000000000000000000000000000");
                          console.log(od);
                          data1.responseJSON = null;
                          data1.responseText = null;
                          od.sync_status = 1;  //success
                          od.oc_msg = data1;
                          od.order.submited = true;
                          //window.updateOrdersSubmited(dbcfg, od, xthen);
                          window._updateDB(dbcfg, od, xthen);
                        } else {
                            od.sync_status = (data1.status !== undefined && data1.status !== null) ? data1.status : 2; //unknown error code has return data
                            //unknown error code has return data1
                            if(od.sync_status == 200){
                                od.sync_status = 30;
                            }
                            od.oc_msg = data1;
                            //window.updateOrders(dbcfg, od, xthen);
                            window._updateDB(dbcfg, od, xthen);
                        }
                    } else {
                        od.sync_status = 3;  //unknown error code, no return data
                        od.oc_msg = err1;
                        //window.updateOrders(dbcfg, od, xthen);
                        window._updateDB(dbcfg, od, xthen);
                    }
                });
            } else {
                od.sync_status = (data.status !== undefined && data.status !== null) ? data.status : 2;  //unknown error code has return data
                //unknown error code has return data
                if(od.sync_status == 200){
                  od.sync_status = 20;
                }                
                od.oc_msg = data;
                //window.updateOrders(dbcfg, od, xthen);
                window._updateDB(dbcfg, od, xthen);
            }
        } else {
            od.sync_status = 3;  //unknown error code, no return data
            od.oc_msg = err;
            //window.updateOrders(dbcfg, od, xthen);
            window._updateDB(dbcfg, od, xthen);               
        }
      });
    }else{
      od.BeforSubmittingTime = getTime();
      s(dbcfg["uoc"], dbcfg["poc"], od, function (data1, err1) {
        console.log("++++++++++++++++++++++++++submit++++++++++++++++++++++++++++");
        if(data1){
          if(data1.status == 200) {
            od.sync_status = 1;  //success
            data1.responseJSON = null;
            data1.responseText = null;
            od.oc_msg = data1;
            od.AfterSubmittingTime = getTime();
            od.data.submited = true;
            //window.updateOrdersSubmited(dbcfg, od, xthen);
            window._updateDB(dbcfg, od, xthen);                               
          }else if(data1.status == 409 || data1.status == 500){
            console.log("else 00000000000000000000000000000000000000");
            console.log(od);
            od.sync_status = 1;
            data1.responseJSON = null;
            data1.responseText = null;
            od.oc_msg = data1;
            od.AfterSubmittingTime = getTime();
            od.data.submited = true;
            //window.updateOrdersSubmited(dbcfg, od, xthen);
            window._updateDB(dbcfg, od, xthen);
          }else{
            od.sync_status = (data1.status !== undefined && data1.status !== null) ? data1.status : 2; //unknown error code has return data
            //unknown error code has return data1
            if(od.sync_status == 200){
              od.sync_status = 30;
            }
            od.oc_msg = data1;
            //window.updateOrders(dbcfg, od, xthen);
            window._updateDB(dbcfg, od, xthen);
          }
        }else{
          od.sync_status = 3;  //unknown error code, no return data
          od.oc_msg = err1;
          //window.updateOrders(dbcfg, od, xthen);
          window._updateDB(dbcfg, od, xthen);
        }
      });
    }
}
function getStoreName(order){
  if(order){
      if(order.data){
          return order.data.field_de_store_id;
      }
  }
  console.log(order);
}



function syncOC(dbcfg, m, s, docs, index, then) {
    'use strict';
    console.log("docs length:" + docs.length);
    console.log("index:" + index);
    if (index < docs.length) {
        var od = docs[index],
            xthen = function (order) {
                console.log("after sync to OC storename=" + getStoreName(order.order));
                syncOC(dbcfg, m, s, docs, index + 1, then);
            };
        console.log("before sync to OC storename=" + getStoreName(od.order));
        window.sync1Order(dbcfg, od, m, s, xthen);
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
    return get("/code/_local/"+ key,null, null, then);
}
function getLocal(key, then){
    getRawLocal(key, function(data, err){
        then(data ? data.value : data, err);
    });
}

function setRawLocal(key, v, then){
    console.log('setRawLocal('+key+', ' + v + ', ...)');
    return put("/code/_local/" + key, null, null, v, then);
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


function resolveConflicts(dbcfg, xthen) {
    'use strict';
    function separate(data) {
        var irrelevant = data.filter(function (doc) {
            return !((doc.data)
                    && (doc.order.order_items)
                    && (typeof(doc.data) === 'object'));
                    //&& (typeof(doc.data.order_items) === "object"));
        });
        //We are interested in order data only
        data = data.filter(function(doc) {
            return ((doc.data)
                    && (doc.data.order_items)
                    && (typeof(doc.data) === 'object'));
                    //&& (typeof(doc.data.order_items) === "object"));
        }).sort(function(item1, item2) {
            if (item1.data.state > item2.data.state) {
                return -1;
            } else if (item1.data.state < item2.data.state) {
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
            window._deleteDB(dbcfg, data[index], function(d){
                asyncUpdate(data, index + 1, result, then);
            });
        } else {
            then(result);
        }
    }
    function asyncMap(data, index, result, then) {
        if((data.length > 0) && (index < data[0].key.length)) {
            get( "/" + dbcfg["bid"] + "/"+data[0].id+"?include_docs=true&rev="+data[0].key[index], dbcfg["udb"], dbcfg["pdb"], function (dt, err){
                if(dt){
                    result.push(dt);
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
                resolveConflicts(dbcfg, xthen);
            }, 10000);
        }
    }
    get("/" + dbcfg["bid"] + "/_design/kc/_view/conflicts?limit=1",dbcfg["udb"], dbcfg["pdb"], function (data, err){
        if(data){
            asyncMap(data.rows, 0, [], function(results){
                if(results.length > 0) {
                    results = separate(results);
                    asyncUpdate(results.remove.concat(results.irrelevant), 0, [], function() {
                        if(results.remove.length > 0){
                            resolveConflicts(dbcfg, xthen);
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
function onOrderChange(cfg, last_seq) {
    'use strict';
    if ((last_seq === undefined) || (last_seq === null)) {
        last_seq = 'now';
    }
    console.log('listen to changes since '+last_seq);
    window.$.getJSON("/orders/_changes?feed=longpoll&since="+last_seq+"&include_docs=true&conflicts=true", function (result) {
        var tmp = result.results.filter(function (o) {
            if (!o.doc.deleted) {
                if (o.doc.data) {
                    //if (o.doc.data.orderInfo) {
                        if (o.doc.data.state >= 7) {
                            return o.doc.sync_status === 0;
                        }
                    //}
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


function retryFailed(dbcfg, retry_day, cfg, then) {
  'use strict';
  var today = new Date();
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-retry_day);
  today = encodeURI(getTime(today));
  yesterday = encodeURI(getTime(yesterday));
  //window.$.getJSON("/" + dbcfg["bid"] + "/_design/kc/_view/timestatus?startkey=[\""+yesterday+"\",2,3]&endkey=[\""+today+"\",9999,100]&include_docs=true&conflicts=true", function(result){
  get("/" + dbcfg["bid"] + "/_design/kc/_view/timestatus?startkey=[\""+yesterday+"\",2,3]&endkey=[\""+today+"\",9999,100]&include_docs=true&conflicts=true", dbcfg["udb"], dbcfg["pdb"], function(result){
      var tmp = result.rows.filter(function (o) {
          if (!o.doc.deleted) {
              if (o.doc.data) {
                  if (o.doc.data) {
                      if(o.doc.sync_status >= 2){
                          if(o.doc.data.state >= 3){
                              //filter out 1002 "该订单状态还不能直接跳级修改"
                              return o.doc.oc_msg.status != 500;
                              //return true;
                          }
                      }
                  }
              }
          }
          return false;
      }),
      m = window.modifyOC(cfg),
      s = window.submitOC(cfg); 
      console.log("retryFailed+++++++++++++++++++++++++++++++");
      window.syncOC(dbcfg, m, s, tmp.filter(function(item){
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
