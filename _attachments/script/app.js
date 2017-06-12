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
var multipleAjax = require('./oc');
var request = require('request');
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
        var tmp = {
            "docs":[]
        };
        for(var i in data.rows){
          for(var j in data.rows[i].value.rev){
            tmp.docs.push({
              "_id": data.rows[i].id,
              "_rev": data.rows[i].value.rev[j],
              "data": {
                "field_de_store_id": data.rows[i].value.field_de_store_id
              },
              "_deleted": true
            });
          }
        }
        //console.log("INFO: Delete ", tmp);
        //return post("/" + dbcfg["bid"] + "/_bulk_docs", dbcfg["udb"], dbcfg["pdb"], tmp, then);
        /*
        return db.bulk(tmp, {method: "post"}, function(err, data){
          then(data, err);
        })
        */
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
        window.sync1OrderChange(db, dbcfg, od, m, s, xthen);
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
        window.__deleteDBChange(db, dbcfg, data[index], function(err, d){
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
        window.setTimeout(function () {
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

function retryFailed(db, seqHandle, dbcfg, retry_day, cfg, then) {
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
    limit:1
  }
  db.view('kc/timestatus', opts , function (err, result) {
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
      }),
      m = window.modifyOC(cfg),
      s = window.submitOC(cfg); 
      //console.log("retryFailed+++++++++++++++++++++++++++++++");
      window.syncOCChange(db, seqHandle, dbcfg, m, s, tmp.filter(function(item){
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
module.exports=run;