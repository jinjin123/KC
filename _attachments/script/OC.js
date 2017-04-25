'use strict';
function ajaxN(options, then){
  var verbose = options.verbose;
  delete options.verbose;
  $.ajax(options).done(function (data, textStatus, jqXHR) {
      if(verbose){
          console.log('--------success--------');
          console.log(data);
      }
      console.log("submitOCN success ++++++++++++++++++");
      if(typeof(then) === 'function'){
          then(jqXHR, null);
      }
  }).fail(function (jqXHR, textStatus, errorThrown) {
      var err = ajaxError(jqXHR, textStatus, errorThrown, options);
      console.log("submitOCN failure ++++++++++++++++++");
      console.log(jqXHR);
      console.log(textStatus);
      console.log(errorThrown);
      if(verbose) {
          console.log('---------error---------');
          console.log(err);
      }
      if(typeof(then) === 'function') {
        if(jqXHR.status == 404){
          then(jqXHR,err);
        }else{
          then(jqXHR,err);
        }
      }
  });
}

function submitOCN(url, user, password, order, then){
  console.log("submitOCN ++++++++++++++++++++++++++++++++++++");
  console.log("url:" + url);
  console.log("user:" + user + " password:" + password);
  
  var data = order.data;
  data.state = getNameByNum(data.state);
  var options = {
    contentType : 'application/json',
    url:url,
    method: "post",
    data:JSON.stringify(data),
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    beforeSend: function (xhr) {
       xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + password));
    }
  };
  ajaxN(options, then);
}

function modifyOCN(url, user, password, order, then){
  console.log("modifyOCN ++++++++++++++++++++++++++++++++++++");
  console.log("url:" + url);
  console.log("user:" + user + " password:" + password);
  var data = getUpdateObjNew(order.data);
  url = checkUrl(url) + data.data.id + "?_format=api_json";
  var options = {
    contentType : 'application/vnd.api+json',
    url:url,
    method: "patch",
    data:JSON.stringify(data),
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    beforeSend: function (xhr) {
       xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + password));
    }
  };
  ajaxN(options, then);
}
function _updateDB(dbcfg, order, then){
  console.log("_updateDB+++++++++++++++++++++++++++++");
  //console.log(order);
  var url = '/' + dbcfg['bid'] + '/' + order._id + '/';
  order.modifier = 'kc2';
  order.timestamp = getOrderTimestamp(order);
  order.data.state = getNumByName(order.data.state);
  var options = {
    contentType : 'application/json',
    url: url,
    method: "put",
    data:JSON.stringify(order),
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    beforeSend: function (xhr) {
       xhr.setRequestHeader ("Authorization", "Basic " + btoa(dbcfg["udb"] + ":" + dbcfg["pdb"]));
    }
  };
  ajaxN(options, function(dt){
    then(order);
  });
}
function _deleteDB(dbcfg, order, then){
  var url = '/' + dbcfg['bid'] + '/' + order._id + '?rev=' + order._rev;
  var options = {
    contentType : 'application/json',
    url: url,
    method: "delete",
    //data:JSON.stringify(order),
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    beforeSend: function (xhr) {
       xhr.setRequestHeader ("Authorization", "Basic " + btoa(dbcfg["udb"] + ":" + dbcfg["pdb"]));
    }
  };
  ajaxN(options, function(dt){
    console.log("_deleteDB+++++++++++++++++++++++++++++");
    then();
  });
}
function checkUrl(url) {
  if(!url){ return "";}
  if(url.substr(-1, 1) != "/"){
    url += "/";
  }
  return url;
}

function multipleAjax(retry_day, cfg){
  var ret = {};
  var maxAll = 400;
  var maxSingle = 100;
  var activingAll = 0;
  var activingSingle = 0;
  //var scaning = false;
  var businesses = {};
  function addBusiness(bs){
    bs.forEach(function(itm, idx){
      if(businesses[itm.bid] == null){
        businesses[itm.bid] = {
          dbcfg: itm,
          max: 100,
          activings: 0,
          activing: false,
          scaning: false
        };
      }
    });
  }
  function scanBusiness(){
    getLocal("dbcfg1", function(data, err){
      console.log("INFO: scanBusiness ***************");
      console.log(data);
      if(data){
        addBusiness(data);
      }
      window.setTimeout(function(){
        scanBusiness();
      }, 10000);
    });
  }
  function setActivings(dbcfg, num){
    businesses[dbcfg.bid].activings = num;
    activingAll += num;
  }
  function reduceActivings(dbcfg){
    if(businesses[dbcfg.bid].activings > 0){
      businesses[dbcfg.bid].activings -= 1;
      activingAll -= 1;
      if(activingAll < 0){
        activingAll = 0;
      }
    }else{
       businesses[dbcfg.bid].activings = 0;
    }
  }
  function setScanning(dbcfg, f){
    businesses[dbcfg.bid].scaning = f;
  }
  function getScanning(dbcfg){
    return businesses[dbcfg.bid].scaning;
  }
  function doComplex(dbcfgs, idx, cfg, retry_day, then){
    if(idx < dbcfgs.length){
      var dbcfg = dbcfgs[idx];
      console.log("INFO: resolveConflicts");
      resolveConflicts(dbcfg, function (e){
          if(e){
              console.log("resolveConflicts: ", e);
          }
          cfg.historical_data_span = cfg.historical_data_span ? cfg.historical_data_span : 30;
          ordersBefore(dbcfg, cfg.historical_data_span, function(data, err){
              if(err) {
                  console.log("ordersBefore: ", err);
              }
              data = data ? data : [];
              console.log("INFO: deleteOrders");
              deleteOrders(dbcfg, data, function(data,error){
                  if(error) {
                      console.log("deleteOrders: ", error)
                  }
                  console.log("INFO: compact");
                  compact(dbcfg, function (d, e){
                      if(e){
                          console.log("compact: ", e);
                      }
                      console.log("INFO: retryFailed");
                      retryFailed(dbcfg, retry_day, cfg, function(data, err){
                          if(err){
                              console.log("retryFailed: ", err);
                          }
                          doComplex(dbcfgs, idx + 1, cfg, retry_day, then);
                      });
                  });                        
              });
          });
      });
    }else{
      then();
    }
  }
  function runDoComplex(){
    getLocal("dbcfg1", function(data, err){
      if(data){
        //addBusiness(data);
        doComplex(data, 0, cfg, retry_day, function(){
          window.setTimeout(function(){
            runDoComplex();
          }, 10000);
        });
      }else{
        window.setTimeout(function(){
          runDoComplex();
        }, 10000);
      }
    });
  }
  function runScanOrders(){
    console.log("runScanOrders ++++++++++++++++++++++++++");
    console.log(businesses);
    for (var Key in businesses){
      if(businesses[Key].activing == false || businesses[Key].activings <= 0){
        console.log("key:" + Key);
        console.log("activingAll:" + activingAll);
        businesses[Key].activing = true;
        if(activingAll < maxAll){
          if(!getScanning(businesses[Key].dbcfg)){
            _scanOrders(businesses[Key].dbcfg);
          }
        }
      }
    }
    window.setTimeout(function(){ 
      runScanOrders(); 
    }, 2000);
  }
  function _scanOrders(dbcfg){
    'use strict';
    console.log("**************************************");
    console.log("dbname:" + dbcfg["bid"]);
    console.log("**************************************");
    console.log("scanOrders ++++++++++++++++++");
    setScanning(dbcfg, true);
    get("/" + dbcfg["bid"] + "/_design/kc/_view/status?startkey=[0,2]&endkey=[0,100]&include_docs=true&conflicts=true&limit=100", dbcfg["udb"], dbcfg["pdb"], function(data, err) {
       setScanning(dbcfg, false);
        if(data){
          var m = modifyOC(cfg),
              s = submitOC(cfg);
          scanDBCounter.success++;
          var orders = data.rows.filter(function(item){
                            return item.value.length === 1;
                        }).map(function (o) {
                            return o.doc;
                        });
          setActivings(dbcfg, orders.length);
          //window.$('#scan_db_success').html(scanDBCounter.success);
          orders.forEach(function(od, idx){
            sync1Order(dbcfg, od, m, s, function(){
              reduceActivings(dbcfg);
            });
          });
        } else {
          scanDBCounter.fail++;
          //window.$('#scan_db_fail').html(scanDBCounter.fail);
          //next();
        }
    });
  }
  ret.run = function(){
    console.log("mutipleAjax run++++++++++++++++++");
    scanBusiness();
    runDoComplex();
    runScanOrders();
  };
  return ret;
}