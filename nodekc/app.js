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
 var Mustache = require('mustache');
//var multipleAjax = require('./oc');
var WebSocket = require('ws');
var ssl_root_ca = require('ssl-root-cas');
//window.nano = require('nano');
var cradle = require('cradle');
var request = require('request');
var Mustache = require('mustache');
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
var CONFIG;

function get(url, user, pass, then){
  var auth = {};
  if (user && pass){
    auth = {
      'user': user,
      'pass': pass,
      'sendImmediately': true
    };
  }else{
    auth = undefined;
  }
  url = "http://couchdb-cloud.sparkpad-dev.com/" + url;
  return request({
    method: 'get',
    uri: url,
    json: true,
    //body: JSON.stringify(data),
    headers:{
      'Content-Type':'application/vnd.api+json'
    },
    auth: auth,
    callback: function (err, response, body) {
      //console.log(err);
      //console.log(typeof(body));
      //console.log(body)
      if(err){
        console.log(err);
        console.log(body);
        then(body, err);
      }else{
        then(body, null);
      }
    }
  });
}

function put(url, user, pass, data, then){
  url = "http://couchdb-cloud.sparkpad-dev.com/" + url;
  var auth = {};
  if (user && pass){
    auth = {
      'user': user,
      'pass': pass,
      'sendImmediately': true
    };
  }else{
    auth = undefined;
  }
  return request({
    method: 'put',
    uri: url,
    //json: true,
    body: JSON.stringify(data),
    headers:{
      'Content-Type':'application/vnd.api+json'
    },
    auth: auth,
    callback: function (err, response, body) {
      console.log(err);
      console.log(typeof(body));
      console.log(body)
      if(err){
        then(body, err);
      }else{
        then(body, null);
      }
    }
  });
}
function getOCQueryURL(cfg, orderid){
    return cfg['oc-queryUrl'] + orderid;
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
/*
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
*/
function loadConfig(fun) {
    'use strict';
    console.log('loadConfig...');
    Mustache.clearCache();
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
            return Mustache.render(x, acc.env);
          } else {
            var buffer="", ii, a = Mustache.parse(x, acc.tags);
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
    //get("kc.config.json",);
    get("code/_design/kc/kc.config.json", null, null,function (result) {
        //console.log("loading get json +++++++++++");
        //console.log(result);
        result.baseurl = 'https' + '//' + 'couchdb-cloud.sparkpad-dev.com' +'/code/_design/kc';
        result.hostname = 'couchdb-cloud.sparkpad-dev.com';
        if (typeof (fun) === "function") {
            var variables = {};
            result = collect(result, variables);
            variables = obj2array(variables);
            console.log(variables);
            resolve(variables, 0, {}, function(rlt){
                result = render(result, rlt, ["{%", "%}"]);
                Mustache.clearCache();
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
function orders(db, dbcfg, query, fun){
    //return get('/' + dbcfg["bid"] + '/_design/kc/_view/' + query, dbcfg["udb"], dbcfg["pdb"], fun);
    
    return db.view('kc/timestamp', query, function(err, data) {
      fun(err, data);
    });
    
}
function deleteOrders(db, dbcfg, data, then){
    if(data){
        //data = JSON.parse(data);
        var tmp = [];
        for(var i in data.rows){
          for(var j in data.rows[i].value.rev){
            tmp.push({
              "_id": data.rows[i].id,
              "_rev": data.rows[i].value.rev[j],
              "data": {
                "field_de_store_id": data.rows[i].value.field_de_store_id
              },
              "_deleted": true
            });
          }
        }
        return db.save(tmp, function (err, res) {
            // Handle response
            then(data, err);
        });
        
    }
}
function ordersBefore(db, dbcfg, x, fun) {
  var now = new Date();
  now.setDate(now.getDate()- x);
  now = getTime(now);
  console.log("now:" + encodeURI(now));
  //return orders(db, dbcfg, 'timestamp?endkey=' + encodeURI(now), fun);
  return orders(db, dbcfg, {startkey:[0], endkey:[now]}, fun);
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

function submitOC(cfg) {
    'use strict';
    return function (user, password, order, fun) {
      return _submitOCN(cfg['oc-submitUrl'], user, password, order, fun);
    };
}
function modifyOC(cfg) {
    'use strict';
    return function (user, password, order, fun) {
      return _modifyOCN(cfg['oc-modifyUrl'], user, password, order, fun);
    };
}

function getStoreName(order){
  if(order){
      if(order.data){
          return order.data.field_de_store_id;
      }
  }
  console.log(order);
}


function syncOCChange(db, seqHandle, dbcfg, m, s, docs, index, then) {
    'use strict';
    console.log("docs length:" + docs.length);
    console.log("index:" + index);
    if (index < docs.length) {
        var od = docs[index],
            xthen = function (order, sd) {
              console.log("after sync to OC storename=" + getStoreName(order));
              syncOCChange(db, seqHandle, dbcfg, m, s, docs, index + 1, then);
              if(sd && sd.ok == true){
                console.log("syncOCChange +++");
                seqHandle.addRev(sd.rev);
              }
            };
        console.log("before sync to OC storename=" + getStoreName(od));
        sync1OrderChange(db, dbcfg, od, m, s, xthen);
    } else {
        then();
    }
}
var scanDBCounter = {
    success: 0,
    fail: 0
};
function getRawLocal(key, then){
    //console.log('getRawLocal('+key+', ...)');
    return get("/code/_local/"+ key,"sye", "sye123456", then);
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


function resolveConflicts(db, dbcfg, xthen) {
    'use strict';
    function separate(data) {
      var irrelevant = data.filter(function (doc) {
          return !((doc.data)
                  && (doc.data.order_items)
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
        __deleteDBChange(db, dbcfg, data[index], function(err, d){
          asyncUpdate(data, index + 1, result, then);
        });
      } else {
        then(result);
      }
    }
    function asyncMap(data, index, result, then) {
      if((data.length > 0) && (index < data[0].key.length)) {
        /*
        get( "/" + dbcfg["bid"] + "/"+data[0].id+"?include_docs=true&rev="+data[0].key[index], dbcfg["udb"], dbcfg["pdb"], function (dt, err){
            if(dt){
                result.push(dt);
            }
            asyncMap(data, index + 1, result, then);
        });
        */
        db.get(data[0].id, data[0].key[index], function (err, dt) {
          if(!err){
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
        setTimeout(function () {
          resolveConflicts(dbcfg, xthen);
        }, 10000);
      }
    }
    
    db.view('kc/conflicts', {limit:1} , function (err, data) {
      if(!err){
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

function retryFailed(db, seqHandle, m, s, dbcfg, retry_day, cfg, then) {
  'use strict';
  var today = new Date();
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-retry_day);
  var yYMD = yesterday.getFullYear() * 10000 + (yesterday.getMonth() * 100 + yesterday.getDate());
  var yHMS = yesterday.getHours() * 10000 +  yesterday.getMinutes() * 100 + yesterday.getSeconds();
  var tYMD = today.getFullYear() * 10000 + (today.getMonth() * 100 + today.getDate())
  var tHMS = today.getHours() * 10000 +  today.getMinutes() * 100 + today.getSeconds();
  //today = encodeURI(getTime(today));
  //yesterday = encodeURI(getTime(yesterday));

  //window.$.getJSON("/" + dbcfg["bid"] + "/_design/kc/_view/timestatus?startkey=[\""+yesterday+"\",2,3]&endkey=[\""+today+"\",9999,100]&include_docs=true&conflicts=true", function(result){
  var opts = {
    startkey: [2, 2, yYMD, yHMS],
    endkey: [9999, 100, tYMD ,tHMS],
    include_docs:true,
    conflicts:true,
    limit:100
  };
  db.view('kc/timestatus', opts , function (err, result) {
    //console.log("err++++++++++++++++++++++++++");
    //console.log(err);
    //console.log(result);
    if(!err){
      var tmp = result.rows.filter(function (o) {
          if (!o.doc.deleted) {
              if (o.doc.data) {
                  if (o.doc.data) {
                      if(o.doc.sync_status >= 2){
                          //if(o.doc.data.state >= 3){
                              //filter out 1002 "¸Ã¶©µ¥×´Ì¬»¹²»ÄÜÖ±½ÓÌø¼¶ÐÞ¸Ä"
                              return o.doc.oc_msg.status != 409;
                              //return true;
                          //}
                      }
                  }
              }
          }
          return false;
      });
      //m = modifyOC(cfg),
      //s = submitOC(cfg); 
      //console.log("retryFailed+++++++++++++++++++++++++++++++");
      syncOCChange(db, seqHandle, dbcfg, m, s, tmp.filter(function(item){
          return item.value.length === 1;
      }).map(function (o) {
          return o.doc;
      }), 0, function () {
          if(typeof(then) === "function") {
              then("success");
          }
      });
    }else {
      console.log("retryFailed get timestatus view failly!");
    }
  });
}

function _submitOCN(url, user, pass, order, then){
  console.log("submitOCN +++");
  var data = order.data;
  //console.log(data);
  //console.log(order);
  data.state = getNameByNum(data.state);
  request({
    method: 'post',
    uri: url,
    body: JSON.stringify(data),
    headers:{
      'Content-Type':'application/json'
    },
    auth: {
      'user': user,
      'pass': pass,
      'sendImmediately': true
    },
    callback: function (err, response, body) {
      console.log("_submitOCN +++++++++++++++++++++++++++++++++++++");
      //console.log(err);
      //console.log(response.statusCode);
      //console.log(body);
      //if(err){
        then(err, response, body);
      //}else{
      //  then(err, response, body);
      //}
    }
  });
}
function _modifyOCN(url, user, pass, data, then){
  console.log("+++++++++++++++++++++++++++++++++ modifyOCN +++++++++++++++++++++++++++++++++");
  var data = getUpdateObjNew(order.data);
  url = checkUrl(url) + data.data.id + "?_format=api_json";
  request({
    method: 'patch',
    uri: url,
    body: JSON.stringify(data),
    headers:{
      'Content-Type':'application/vnd.api+json'
    },
    auth: {
      'user': user,
      'pass': pass,
      'sendImmediately': true
    },
    callback: function (err, response, body) {
      then(err, response, body);
      //console.log(err);
      //console.log(response);
      //console.log(body)
      /*
      if(err){
        then(body, err);
      }else{
        then(body, null);
      }
      */
    }
  });
  
}

function __deleteDBChange(db, dbcfg, order, then){
  order._deleted = true;
  db.save(order._id, order._rev, order, function (err, res) {
    // Handle response
    then(order, res)
  });
}
function __getDoc(db, _id, _rev, then){
  if(typeof(_rev) == "string"){
    db.get(_id, _rev, function (err, doc) {
      //console.log(doc);
      then(err, doc);
    });
  }else{
    db.get(_id, function (err, doc) {
      //console.log(doc);
      then(err, doc)
    });
  }
}
function __updateSeqnums(db, seqnums, then){
  console.log("__updateSeqnums +++++++++")
  var id = seqnums._id;
  var rev = seqnums._rev;
  if(seqnums._rev == null){
    db.save(id, seqnums, function (err, res) {
      // Handle response
      then(err, res)
    });
  }else{
    db.save(id, rev, seqnums, function (err, res) {
      // Handle response
      then(err, res)
    });
  }
}
function __updateDBChange(db, dbcfg, order, then){
  order.modifier = 'kc2';
  order.timestamp = getOrderTimestamp(order);
  order.data.state = getNumByName(order.data.state);
  var id = order._id;
  var rev = order._rev;
  db.save(id, rev, order, function (err, res) {
    // Handle response
    then(order, res, err)
  });
}
function sync1OrderChange(db, dbcfg, od, m, s, xthen){
  console.log("sync1OrderChange+++");
    if(od.submited == true){
      m(dbcfg["uoc"], dbcfg["poc"], od, function (err, data) {
        if(err){
          console.log(err);
        }
        if(!err) {
            if (data.statusCode == 200) {
              od.sync_status = 1;  //success
              //od.oc_msg = data;
              //od.oc_msg.responseText = data1.responseText;
              od.oc_msg = {};
              od.oc_msg.status =  data.statusCode;
              od.oc_msg.statusText = data.statusMessage;
              od.AfterSubmittingTime = getTime();
              //window.updateOrders(dbcfg, od, xthen);
              __updateDBChange(db, dbcfg, od, xthen);
            } else if (data.statusCode == 404) {
                s(dbcfg["uoc"], dbcfg["poc"], od, function (err1, data1) {
                  console.log("++++++++++++++++++++++++++submit++++++++++++++++++++++++++++");
                  if(!err1){
                    if(data1.statusCode == 200) {
                      od.sync_status = 1;  //success
                      //data1.responseJSON = null;
                      //data1.responseText = null;
                      
                      //od.oc_msg.responseText = data1.responseText;
                      od.oc_msg = {};
                      od.oc_msg.status =  data1.statusCode;
                      od.oc_msg.statusText = data1.statusMessage;
                      //od.oc_msg = data1;
                      od.AfterSubmittingTime = getTime();
                      od.submited = true;
                      //window.updateOrdersSubmited(dbcfg, od, xthen);
                      __updateDBChange(db, dbcfg, od, xthen);                               
                    }else if(data1.statusCode == 409){
                      console.log("else 00000000000000000000000000000000000000");
                      console.log(od);
                      od.sync_status = -409;//1;
                      //data1.responseJSON = null;
                      //data1.responseText = null;
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.body;
                      od.oc_msg.status =  data1.statusCode;
                      od.oc_msg.statusText = data1.statusMessage;
                      od.AfterSubmittingTime = getTime();
                      //od.submited = true;
                      //window.updateOrdersSubmited(dbcfg, od, xthen);
                      __updateDBChange(db, dbcfg, od, xthen);
                    }else if(data1.statusCode == 500){
                      data1.responseText = null;
                      
                      od.sync_status = 500;//3;  //success
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.body;
                      od.oc_msg.status =  data1.statusCode;
                      od.oc_msg.statusText = data1.statusMessage;
                      od.AfterSubmittingTime = getTime();
                      //od.oc_msg = data1;
                      __updateDBChange(db, dbcfg, od, xthen);
                    }else if(data1.statusCode == 429){ //请求太多
                      od.sync_status = 429;  //success
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.body;
                      od.oc_msg.status =  data1.statusCode;
                      od.oc_msg.statusText = data1.statusMessage;
                      od.AfterSubmittingTime = getTime();
                      //od.oc_msg = data1;
                      //od.submited = true;
                      //window.updateOrdersSubmited(dbcfg, od, xthen);
                      __updateDBChange(db, dbcfg, od, xthen);
                    }else{
                      od.sync_status = (data1.statusCode !== undefined && data1.statusCode !== null) ? data1.statusCode : 2; //unknown error code has return data
                      //unknown error code has return data1
                      if(od.sync_status == 200){
                        od.sync_status = 30;
                      }
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.body;
                      od.oc_msg.status =  data1.statusCode;
                      od.oc_msg.statusText = data1.statusMessage;
                      od.AfterSubmittingTime = getTime();
                      //od.oc_msg = data1;
                      //window.updateOrders(dbcfg, od, xthen);
                      __updateDBChange(db, dbcfg, od, xthen);
                    }
                  }else{
                    od.sync_status = 3;  //unknown error code, no return data
                    od.oc_msg = err1;
                    //window.updateOrders(dbcfg, od, xthen);
                    __updateDBChange(db, dbcfg, od, xthen);
                  }
                });
            } else {
                od.sync_status = (data.status !== undefined && data.status !== null) ? data.status : 2;  //unknown error code has return data
                //unknown error code has return data
                if(od.sync_status == 200){
                  od.sync_status = 20;
                }
                od.oc_msg = {};
                od.oc_msg.responseText = data.body;
                od.oc_msg.status =  data.statusCode;
                od.oc_msg.statusText = data.statusMessage;       
                //od.oc_msg = data;
                //window.updateOrders(dbcfg, od, xthen);
                __updateDBChange(db, dbcfg, od, xthen);
            }
        } else {
            od.sync_status = 3;  //unknown error code, no return data
            od.oc_msg = err;
            //window.updateOrders(dbcfg, od, xthen);
            __updateDBChange(db, dbcfg, od, xthen);               
        }
      });
    }else{
      od.BeforSubmittingTime = getTime();
      s(dbcfg["uoc"], dbcfg["poc"], od, function (err1, data1) {
        console.log("+++++++++++submit+++++++++++");
        if(data1){
          if(data1.statusCode == 200) {
            od.sync_status = 1;  //success
            od.oc_msg = {};
            od.oc_msg.status =  data1.statusCode;
            od.oc_msg.statusText = data1.statusMessage;
            od.AfterSubmittingTime = getTime();
            od.submited = true;
            __updateDBChange(db, dbcfg, od, xthen);                               
          }else if(data1.statusCode == 409){
            console.log(od);
            od.sync_status = 1;
            od.oc_msg = {};
            od.oc_msg.status =  data1.statusCode;
            od.oc_msg.statusText = data1.statusMessage;
            //od.oc_msg = data1;
            od.AfterSubmittingTime = getTime();
            __updateDBChange(db, dbcfg, od, xthen);
          }else if(data1.statusCode == 500){
            od.sync_status = 500;//3;  //success
           
            od.oc_msg = {};
            od.oc_msg.responseText = data1.body;
            od.oc_msg.status =  data1.statusCode;
            od.oc_msg.statusText = data1.statusMessage;
            od.AfterSubmittingTime = getTime();
            //od.oc_msg = data1;
            __updateDBChange(db, dbcfg, od, xthen);
          }else if(data1.statusCode == 429){ //请求太多
            console.log(od);
            //data1.responseText = null;
            od.sync_status = 429;  //success
            od.oc_msg = {};
            od.oc_msg.status =  data1.statusCode;
            od.oc_msg.statusText = data1.statusMessage;
            od.AfterSubmittingTime = getTime();
            //od.submited = true;
            //window.updateOrdersSubmited(dbcfg, od, xthen);
            __updateDBChange(db, dbcfg, od, xthen);
          }else if(data1.statusCode == 0){
            od.oc_msg = {};
            od.sync_status = 100;
            od.oc_msg.responseText = data1.body;
            od.oc_msg.statusText = data1.statusCode;
            od.oc_msg.statusText = data1.statusMessage;
            od.AfterSubmittingTime = getTime();
            __updateDBChange(db, dbcfg, od, xthen);
          }else{
            od.sync_status = (data1.status !== undefined && data1.status !== null) ? data1.status : 2; //unknown error code has return data
            //unknown error code has return data1
            if(od.sync_status == 200){
              od.sync_status = 30;
            }
            od.oc_msg = {};
            od.oc_msg.responseText = data1.body;
            od.oc_msg.status =  data1.statusCode;
            od.oc_msg.statusText = data1.statusMessage;
            od.AfterSubmittingTime = getTime();
            __updateDBChange(db, dbcfg, od, xthen);
          }
        }else{
          od.sync_status = 3;  //unknown error code, no return data
          od.oc_msg = err1;
          __updateDBChange(db, dbcfg, od, xthen);
        }
      });
    }
}
function checkUrl(url) {
  if(!url){ return "";}
  if(url.substr(-1, 1) != "/"){
    url += "/";
  }
  return url;
}
function getNum(seqnum){
  if(seqnum){
    var nums = seqnum.split('-');
    return Number(nums[0]);
  }
  return null;
}
function compareSeq(a,b){
  return getNum(a.seq) - getNum(b.seq);
}

// 该closure 处理couchdb changes 的seq值
// 它会把最后的seq值保存起来，以确保KC重启后，
// 会从该changes 开始获取changes。
function seqManager(db, dbcfg){
  var ret = {};
  var seqsArr = [];
  var seqsSaveArr = [];
  var revs = [];
  var saveFlag = false;
  var firstGetSeqnums = true; //如果是第一次获取，_changes since 值是第一个，如果不是则_changes since值为最后一个
  var changeTime = (new Date()).getTime();
  var overtimes = 70 * 1000;
  function setChangeTime(){
    changeTime = (new Date()).getTime();
  }
  function overChangeTime(){
    var now = (new Date()).getTime();
    if(now - changeTime > overtimes){
      return true;
    }
    return false;
  }
  ret.addRev = function(rev){
    //revs.push(rev);
  };
  ret.checkRev = function(ch){
    /*
    for(var c in ch){
      for(var i in revs){
        if(revs[i] == ch[c].rev){
          revs.splice(i, 1);
          return true;
        }
      }
    }
    */
    return false;
  };
  function startSave(){
    saveFlag = true;
  }
  function afterSave(){
    saveFlag = false;
  }
  function getSaveState(){
    return saveFlag;
  }
  
  function addSeq(ch){
    var exsit = false;
    seqsArr.forEach(function(itm, idx){
      if(itm.id == ch.id){
        if(compareSeq(ch, itm)){
          seqsArr.splice(idx, 1, ch);
        }else{
          
        }
        exsit = true;
        return;
      }
    });
    if(!exsit){
      seqsArr.push(ch);
    }
  };
  function setSeqsSaveArrBeforSave(){
    seqsArr.forEach(function(itm, idx){
      seqsSaveArr.push(itm);
    });
    seqsSaveArr.sort(compareSeq);
    seqsArr = [];
  }
  function setSeqsSaveArrAfterSave(s){
    if(s == true){
      seqsSaveArr = [];
    }else{
      //seqsArr.concat(seqsSaveArr);
      var seqsArrTmp = [];
      seqsArr.forEach(function(itm){
        var exsit = false;
        seqsSaveArr.forEach(function(itme){
          if(itm.id == itme.id){
            if(compareSeq(itm, itme)){
              seqsArrTmp.push(itm);
            }else{

            }
            exsit = true;
            return;
          }
        });
        if(exsit == false){
          seqsArrTmp.push(itme);
        }
      });
      seqsArr = [];
      seqsArr = seqsArrTmp;
      seqsArr.sort(compareSeq);
    }
  }
  /*
  function clearDelDocFun(gd, idx, newArr){
    var seqnums = gd.seqnums;
    if(idx < seqnums.length){
      if(seqnums[idx].id == null){
        clearDelDocFun(gd, idx + 1, newArr);
        return;
      }
      
      //_getDoc(dbcfg, seqnums[idx].id, null, function(d,err){
      //  //console.log(d);
      //  //console.log(err);
      //  if(err && err.status == 404){
      //    seqnums[idx].state = true;
      //  }
      //  newArr.push(seqnums[idx]);
      //  clearDelDocFun(gd, idx + 1, newArr);
      //});
      
      console.log("seqnums[idx].id ++++++++++++");
      console.log(seqnums[idx].id);
      __getDoc(db, seqnums[idx].id, null, function(err,d){
        console.log("__getDoc +++++++++++++++++++++++++++");
        console.log(seqnums[idx].id);
        //console.log(d);
        if(err){
          console.log(err);
        }
        if(err && err.headers && err.headers.status == 404){
          seqnums[idx].state = true;
        }
        newArr.push(seqnums[idx]);
        clearDelDocFun(gd, idx + 1, newArr);
      });
    }else{
      console.log("clearDelDocFun start to save!!!");
      console.log(newArr);
      setSeqsSaveArrBeforSave();
      newArr.sort(compareSeq);
      var newArrTmp = [];
      for(var i in newArr){
        if(newArr[i].state == true){
          if(i < newArr.length - 1){
            //newArr.splice(i, 1);
          }else{
            newArrTmp.push(newArr[i]);
          }
        }else{
          //break;
          newArrTmp.push(newArr[i]);
        }
      }
      newArrTmp.forEach(function(itm, idx){
        if(itm.first  == true && idx > 0){
          newArrTmp.splice(0, idx);
          return;
        }
      });
      //console.log("clearDelDocFun save seqnums +++++");
      //console.log("seqnums:" + newArrTmp.length);
      //console.log("businessid:" + dbcfg["bid"]);
      //console.log(newArr);
      //console.log(newArrTmp);
      gd.seqnums = newArrTmp;
      __updateSeqnums(db, gd, function(err, dt){
        if(!err){
          setSeqsSaveArrAfterSave(true);
          afterSave();
          setTimeout(function(){
            clearDelDocSeq();
          }, 1000 * 60 * 10);
        }else{
          console.log("clearDelDocFun insert error!");
          console.log(err);
          console.log(err.status);
          console.log(err.statusCode);
          setSeqsSaveArrAfterSave(false);
        }
      });
    }
  }
  //删除已经被删除的doc的seq
  function clearDelDocSeq(){
    console.log("clearDelDocSeq +++++++++++++++++++++++++++++");
    if(getSaveState() == false){
      console.log("clearDelDocSeq startSave");
      startSave();
      __getDoc(db, "seqnums", null, function(err, dt){
        if(err){
          console.log("clearDelDocSeq get err!");
          console.log(err);
        }
        if(!err){
          //var gd = dt.responseJSON;//JSON.parse(dt.responseText);
          clearDelDocFun(dt, 0, []);
        }else{
          _saveSeqnums();
          setTimeout(function(){
            clearDelDocSeq();
          }, 30000);
        }
      });
    }else{
      setTimeout(function(){
        clearDelDocSeq();
      }, 1000 * 10);
    }
  }
  */
  function _saveSeqnums(){
    console.log("_saveSeqnums _getDoc!");
    __getDoc(db, "seqnums", null, function(err, dt){
      if(!err){
          //var gd = JSON.parse(dt.responseText);

          var gd  = dt;
          var seqnums = dt.seqnums;
          //console.log("seqnums get data: ++++++++++++++++++++++++++++++++");
          //console.log(seqnums);
          //var seqtmp = [];
          setSeqsSaveArrBeforSave();
          
          seqsSaveArr.forEach(function(ch){
            var exsit = false;
            //var _ch;
            seqnums.forEach(function(itm, idx){
              if(itm.id == ch.id){
                if(compareSeq(ch, itm)){
                  //seqtmp.push(ch);
                  seqnums.splice(idx, 1, ch);
                  //_ch = ch;
                }else{
                  //seqtmp.push(itm);
                  //_ch = itm;
                  //exsit = true;
                }
                exsit = true;
                return;
              }
            });
            if(!exsit){
              seqnums.push(ch);
            }
          });
          var seqtmp2 = [];
          console.log("seqtmp ++++++++++++++++++++++++++++++++++++++++");
          console.log(seqnums);
          seqnums.sort(compareSeq);
          console.log("seqtmp after sort +++++++++++++++++++++++++++++++++++");
          console.log(seqnums);
          if(seqnums.length > 0){
            seqtmp2.push(seqnums.pop());
          }
          /*
          for(var i in seqnums){
            if(seqnums[i].state == true){
              if(i < seqnums.length - 1){
                //seqtmp.splice(i, 1);
              }else{
                seqtmp2.push(seqnums[i]);
              }
            }else{
              //break;
              seqtmp2.push(seqnums[i]);
            }
          }
          seqtmp2.forEach(function(itm, idx){
            if(itm.first  == true && idx > 0){
              seqtmp2.splice(0, idx);
              return;
            }
          });
          */
          gd.seqnums = seqtmp2;
          //console.log("save seqnums ++++++++++++++++++++++");
          //console.log("seqnums:" + seqtmp2.length);
          //console.log("businessid:" + dbcfg["bid"]);
          //console.log(seqnums);
          //console.log(seqtmp2);
          __updateSeqnums(db, gd, function(err, dt){
            setChangeTime();
            if(!err){
              afterSave();
              setSeqsSaveArrAfterSave(true)
            }else{
              console.log("_saveSeqnums seqnums insert error!");
              setSeqsSaveArrAfterSave(false);
              setTimeout(function(){
                _saveSeqnums();
              },10000);
            }
          });
      }else{
        console.log("_saveSeqnums get seqnums failly!");
        console.log(err);
        if(err.headers.status == 404){
          __updateSeqnums(db, { _id: 'seqnums', seqnums: []}, function(err, dt){
            if(err){
              console.log("create seqnums failly!");
              console.log(err);
            }
            setTimeout(function(){
              _saveSeqnums();
            }, 10 * 1000);
          });
        }else{
          setTimeout(function(){
            _saveSeqnums();
          }, 10 * 1000);
        }
      }
    });
  }
  ret.getSaveState = function(){
    return saveFlag;
  };
  ret.saveSeqnums = function(ch){
    addSeq(ch);
    if(getSaveState() == false){
      startSave();
      setTimeout(function(){
        _saveSeqnums();
      }, 10 * 1000);
    }else{
      //console.log("prepareing to save seq!!!!!!!!!!!!!!!!");
    }
  };
  ret.overChangeTime = function(){
    return overChangeTime();
  };
  ret.setChangeTime = function(){
    setChangeTime();
  };
  ret.getLeastSeqnum = function(db, dbcfg, then){
    __getDoc(db, "seqnums", null, function(err, dt) {
      var since = 0;
      if(err){
        console.log("getLeastSeqnum get a error!");
        console.log(err);
        if(err.headers && err.headers.status == 404){
          __updateSeqnums(db, { _id: 'seqnums', seqnums: []}, function(err, dt){
            if(err){
              console.log("create seqnums failly!");
              console.log(err);
            }
            console.log(dt);
            firstGetSeqnums = false;
            then(since);
          });
        }else{
          since = 'now';
          firstGetSeqnums = false;
          then(since);
        }
        //since = 0;
      }else{
        //var gd = JSON.parse(dt.responseText);
        //var gd = dt.responseJSON;
        var seqnums = dt.seqnums
        seqnums.sort(compareSeq);
        if(firstGetSeqnums == true){
          firstGetSeqnums = false;
          var _seq = seqnums[0];
          if( _seq && _seq.seq){
            since = _seq.seq;
          }else{
            since = 'now';
          }
        }else{
          var _seq = seqnums.pop();
          if( _seq && _seq.seq){
            since = _seq.seq;
          }else{
            since = 'now';
          }
        }
        //since = 'now';
        then(since);
      }
    });
  };
  //clearDelDocSeq();
  return ret;
}

function addRevFun(sd, seqHandle){
  if(sd){
    //var d = sd.responseJSON;
    if(sd.ok == true){
      seqHandle.addRev(sd.rev);
    }
  }
}
function processChanges(db, countChanges, dbcfg, m, s, seqHandle, ch, then){
  var newD = ch.doc;
  sync1OrderChange(db, dbcfg, newD, m, s, function(od, sd, err){
    ch.changes = undefined;
    if(od.sync_status == 1){
      ch.state = true;
    }else{
      ch.state = false;
    }
    addRevFun(sd,seqHandle);
    ch.doc = undefined;
    seqHandle.saveSeqnums(ch);
    if(typeof(then) == 'function'){
      then();
    }
  });
}
function syncOrderOneByOne(db, orders, idx, dbcfg, m, s, seqHandle, then){
  if(orders.length != 0 && idx < orders.length){
    sync1OrderChange(db, dbcfg, orders[idx], m, s, function(od, sd){
      addRevFun(sd,seqHandle);
      syncOrderOneByOne(db, orders, idx + 1, dbcfg, m, s, seqHandle, then);
    });
  }else{
    if(typeof(then) === "function"){
      then();
    }
  }
}

function _scanOrders(db, seqHandle, dbcfg, m, s){
  'use strict';
  console.log("_scanOrders dbname:" + dbcfg["bid"]);
  try {
    if(seqHandle.overChangeTime()){
    console.log("_scanOrders overTime!!!");
    var opts = {
      startkey:[0,2],
      endkey:[0,100],
      include_docs:true,
      conflicts:true,
      limit:100
    };
    db.view('kc/status', opts , function (err, data) {
      if(!err){
        scanDBCounter.success++;
        var orders = data.rows.filter(function(item){
                          return item.value.length === 1;
                      }).map(function (o) {
                          return o.doc;
                      });
        syncOrderOneByOne(db, orders, 0, dbcfg, m, s, seqHandle, function(){
          seqHandle.setChangeTime();
          setTimeout(function(){
            _scanOrders(db, seqHandle, dbcfg, m, s);
          }, 10 * 1000);
        });
      }
    });
  }else{
    console.log("_scanOrders not overTime!!!");
    setTimeout(function(){
      _scanOrders(db, seqHandle, dbcfg, m, s);
    }, 10 * 1000);
  }
}catch(e){
    setTimeout(function(){
      _scanOrders(db, seqHandle, dbcfg, m, s);
    }, 10 * 1000);
}
  
}
function doComplex(db, seqHandle, m, s, dbcfg, cfg, retry_day){
  console.log("INFO: resolveConflicts");
  resolveConflicts(db, dbcfg, function (e){
      if(e){
        console.log("resolveConflicts: ", e);
      }
      cfg.historical_data_span = cfg.historical_data_span ? cfg.historical_data_span : 1;
      ordersBefore(db, dbcfg, cfg.historical_data_span, function(err, data){
          if(err) {
              console.log("ordersBefore: ", err);
          }
          data = data ? data : [];
          console.log("INFO: deleteOrders");
          deleteOrders(db, dbcfg, data, function(err, data){
              if(err) {
                console.log("deleteOrders: ", err)
              }
              //console.log("INFO: compact");
              //compact(dbcfg, function (d, e){
              //    if(e){
              //        console.log("compact: ", e);
              //    }
                  db.compact();
                  console.log("INFO: retryFailed");
                  retryFailed(db, seqHandle, m, s, dbcfg, retry_day, cfg, function(data, err){
                      if(err){
                          console.log("retryFailed: ", err);
                      }
                      setTimeout(function(){
                        doComplex(db, seqHandle, m, s, dbcfg, cfg, retry_day);
                      }, 30 * 1000);
                  });
              //});                        
          });
      });
  });
}
function changes(db, countChanges, dbcfg, cfg, seqHandle, m, s, ch, then){
  console.log("changes countChanges:" + countChanges);
  if(seqHandle.checkRev(ch.changes)){
    ch.changes = undefined;
    ch.state = true;
    ch.doc = undefined;
    seqHandle.saveSeqnums(ch);
    console.log("++++++++++++ It is KC modifier, ingnor! ++++++++++++");
    if(typeof(then) == "function"){
      then();
    }
    return;
  }
  processChanges(db, countChanges, dbcfg, m, s, seqHandle, ch, then);
}

function feedManager(db, seqHandle, dbcfg, cfg, m, s){
  //console.log("hello ++++++++++++++++++++++=")
  if(seqHandle.getSaveState()){
    //console.log("world ++++++++++++++++++++++=")
    setTimeout(function(){
      feedManager(db, seqHandle, dbcfg, cfg, m, s);
    },1000);
    return;
  }
  var firstCh = false;
  var feedPause = false;
  var countChanges = 0;
  var maxChangesNum = 20000;
  function addCount(){
    countChanges += 1;
    console.log("------countChanges:" + countChanges);
    if(countChanges >= maxChangesNum){
      setPaused(true);
      return true;
    }
    return false;
  }
  function reduceCount(){
    countChanges -= 1;
    console.log("+++++++++countChanges:" + countChanges);
    if(countChanges <= 0){
      countChanges = 0;
      //feedPause = false;
      return true;
    }
    return false;
  }
  function isPaused(){
    return feedPause;
  }
  function setPaused(s){
    feedPause = s;
  }
  seqHandle.getLeastSeqnum(db, dbcfg, function(since){
    console.log(dbcfg);
    console.log("since:" + since);
    var feed = null;
    //var dbh = nano({url:'https://couchdb-cloud.sparkpad-dev.com/' + dbcfg["bid"], strictSSL:true});
    //feed = dbh.follow({since: since, filter: "kc/data", include_docs: true});
    
    var feed = db.changes({ since: since, include_docs: true });
    /*
    feed.on('change', function (change) {
        console.log(change);
    });
    */
    feed.on('change', function (ch) {
      if(firstCh == false){
        ch.first = true;
        firstCh = true;

      }
      console.log("change:" + dbcfg["bid"]);
      console.log(getNum(ch.seq));
      if(addCount()){
        console.log("mutiple changes, feed should been paused!");
        feed.pause();
      }
      changes(db, countChanges, dbcfg, cfg, seqHandle, m, s, ch, function(d){
        if(reduceCount() && isPaused()){
          console.log("no changes any more, feed should been resumed!");
          setTimeout(function(){
            console.log("start feed again ++++");
            console.log("businesses ID:" + dbcfg["bid"]);
            setPaused(false);
            feed  = null;
            feedManager(db, seqHandle, dbcfg, cfg, m, s)
          }, 500);
        }
        console.log("feed resume:" + countChanges);
      });
    });
    feed.filter = function(doc, req) {
      // req.query is the parameters from the _changes request and also feed.query_params.
      //console.log('+++++++++++++++++++++++Filtering for query: ' + JSON.stringify(req.query));
      //console.log(doc);
      if(doc == null){
        console.log("doc is null ++++++++++++++++++++++++++++++++++++");
      }
      
      if(doc.sync_status == 0 && doc.data && doc._deleted != true){
        return true;
      }
      return false;
    }
    feed.follow();
  });
}
function businessRunner(dbcfg, cfg, retry_day){
  var m = modifyOC(cfg),
      s = submitOC(cfg);
  var connection = new(cradle.Connection)('https://couchdb-cloud.sparkpad-dev.com', {strictSSL:false, port: 443}, {
    auth: { username: dbcfg["udb"], password: dbcfg["pdb"] }
  });
  var db = connection.database(dbcfg['bid']);
  var seqHandle = seqManager(db, dbcfg);
  feedManager(db, seqHandle, dbcfg, cfg, m, s);
  doComplex(db, seqHandle, m, s, dbcfg, cfg, retry_day);
  _scanOrders(db,seqHandle, dbcfg, m, s)
}
function multipleAjax(retry_day, cfg){
  var ret = {};
  var maxAll = 400;
  var maxSingle = 100;
  var activingAll = 0;
  var activingSingle = 0;
  var businesses = [];
  function addBusiness(bs){
    bs.forEach(function(itm, idx){
      if(businesses[itm.bid] == null){
        businesses[itm.bid] = {
          dbcfg: itm,
          max: maxSingle,
          activings: 0,
          activing: false,
          scaning: false
        };
        //setRevs_limit(itm, function(){
          businessRunner(itm, cfg, retry_day);
        //});
      }
    });
  }
  function scanBusiness(){
    getLocal("dbcfg1", function(data, err){
      //console.log("++++++++++++++++++++++++++++++++++++++++");
      //console.log(err);
      //console.log(data);
      if(data){
        //console.log(data);
        addBusiness(data);
      }
      setTimeout(function(){
        scanBusiness();
      }, 10000);
    });
  }
  ret.run = function(){
    console.log("mutipleAjax run+++");
    scanBusiness();
  };
  return ret;
}

function getTimeCount(t){
  if(t == null || t == "") return null;
  return Math.floor((new Date(t)).getTime()/1000);
}

var OCStatesNum = {
  draft: 0,
  fulfillment: 1,
  wait_for_buyer_to_pay: 2,
  buyer_has_paid: 3,
  preparing: 4,
  ready: 5,
  delivering: 6,
  completed: 7,
  canceled: 8,
  returned: 9
};

function getNameByNum(s){
  if(typeof(s) === 'string'){
    for(var i in OCStatesNum){
      if(i == s){
        return i;
      }
    }
  }
  for(var i in OCStatesNum){
    if(OCStatesNum[i] == s){
      return i;
    }
  }
  return "draft";
}

function getNumByName(n){
  var partern = /^[0-9]+$/;
  if(partern.test(n)){
    return n
  }else{
    if(n < OCStatesNum.draft || n > OCStatesNum.returned){
      n = 0;
    }
    return OCStatesNum[n];
  }
}

//新的堂食，自助POS订单数据结构。
function getUpdateObjNew(order){
  var d = {},
      f = [
        "placed",
        "completed",
        "field_canceled",
        "field_delivering_time",
        "field_delivered",
        "field_payment_received",
        "field_returned",
        "state"
      ];
  for (var i in f) {
    var k = f[i];
    var v = order[k];
    if(v !== undefined && v !== null && v != "") {
      if(k == "state"){
        v = getNameByNum(v);
      }
      d[k] = v;
    }
  }
  var obj = {
    data: {
      id: order.uuid,
      attributes: d
    }
  }
  return obj;
}

module.exports=run;