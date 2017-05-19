'use strict';
function ajaxN(options, then){
  var verbose = options.verbose;
  delete options.verbose;
  $.ajax(options).done(function (data, textStatus, jqXHR) {
      if(verbose){
          console.log('--------success--------');
          console.log(data);
      }
      //console.log("submitOCN success ++++++++++++++++++");
      if(typeof(then) === 'function'){
          then(jqXHR, null);
      }
  }).fail(function (jqXHR, textStatus, errorThrown) {
      var err = ajaxError(jqXHR, textStatus, errorThrown, options);
      console.log("submitOCN failure ++++++++++++++++++");
      //console.log(jqXHR);
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
  //console.log("url:" + url);
  //console.log("user:" + user + " password:" + password);
  
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
  //console.log("url:" + url);
  //console.log("user:" + user + " password:" + password);
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
function deleteOCN(url, user, password, order, then){
  console.log("modifyOCN ++++++++++++++++++++++++++++++++++++");
  //console.log("url:" + url);
  //console.log("user:" + user + " password:" + password);
  var data = getUpdateObjNew(order.data);
  url = checkUrl(url) + data.data.id + "?_format=api_json";
  var options = {
    contentType : 'application/vnd.api+json',
    url:url,
    method: "delete",
    //data:JSON.stringify(data),
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
function _updateDBChange(dbcfg, dbh, order, then){
  order.modifier = 'kc2';
  order.timestamp = getOrderTimestamp(order);
  order.data.state = getNumByName(order.data.state);
  dbh.insert(order,function(err, d){
    console.log("ttttttttttttttttttttttttttttttttyyyyyyyyy");
    console.log(err);
    console.log(d);
    then(order, d)
  });
}
function sync1OrderChange(dbcfg, dbh, od, m, s, xthen){
  console.log("sync1OrderChange++++++++++++++++++++++++");
    if(od.submited == true){
      console.log("modify orders!");
      m(dbcfg["uoc"], dbcfg["poc"], od, function (data, err) {
        //console.log(data);
        if (data) {
            if (data.status == 200) {
                od.sync_status = 1;  //success
                //od.oc_msg = data;
                //od.oc_msg.responseText = data1.responseText;
                od.oc_msg = {};
                od.oc_msg.status =  data.status;
                od.oc_msg.statusText = data.statusText;
                //window.updateOrders(dbcfg, od, xthen);
                window._updateDBChange(dbcfg, dbh, od, xthen);
            } else if (data.status == 404) {
                s(dbcfg["uoc"], dbcfg["poc"], od, function (data1, err1) {
                  console.log("++++++++++++++++++++++++++submit++++++++++++++++++++++++++++");
                  if(data1){
                    if(data1.status == 200) {
                      od.sync_status = 1;  //success
                      //data1.responseJSON = null;
                      //data1.responseText = null;
                      
                      //od.oc_msg.responseText = data1.responseText;
                      od.oc_msg = {};
                      od.oc_msg.status =  data1.status;
                      od.oc_msg.statusText = data1.statusText;
                      //od.oc_msg = data1;
                      od.AfterSubmittingTime = getTime();
                      od.submited = true;
                      //window.updateOrdersSubmited(dbcfg, od, xthen);
                      window._updateDBChange(dbcfg, dbh, od, xthen);                               
                    }else if(data1.status == 409){
                      console.log("else 00000000000000000000000000000000000000");
                      console.log(od);
                      od.sync_status = -409;//1;
                      //data1.responseJSON = null;
                      //data1.responseText = null;
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.responseText;
                      od.oc_msg.status =  data1.status;
                      od.oc_msg.statusText = data1.statusText;
                      od.AfterSubmittingTime = getTime();
                      //od.submited = true;
                      //window.updateOrdersSubmited(dbcfg, od, xthen);
                      window._updateDBChange(dbcfg, dbh, od, xthen);
                    }else if(data1.status == 500){
                      data1.responseText = null;
                      
                      od.sync_status = 500;//3;  //success
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.responseText;
                      od.oc_msg.status =  data1.status;
                      od.oc_msg.statusText = data1.statusText;
                      //od.oc_msg = data1;
                      window._updateDBChange(dbcfg, dbh, od, xthen);
                    }else if(data1.status == 429){ //请求太多
                      od.sync_status = 429;  //success
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.responseText;
                      od.oc_msg.status =  data1.status;
                      od.oc_msg.statusText = data1.statusText;
                      //od.oc_msg = data1;
                      //od.submited = true;
                      //window.updateOrdersSubmited(dbcfg, od, xthen);
                      window._updateDBChange(dbcfg, dbh, od, xthen);
                    }else{
                      od.sync_status = (data1.status !== undefined && data1.status !== null) ? data1.status : 2; //unknown error code has return data
                      //unknown error code has return data1
                      if(od.sync_status == 200){
                        od.sync_status = 30;
                      }
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.responseText;
                      od.oc_msg.status =  data1.status;
                      od.oc_msg.statusText = data1.statusText;
                      //od.oc_msg = data1;
                      //window.updateOrders(dbcfg, od, xthen);
                      window._updateDBChange(dbcfg, dbh, od, xthen);
                    }
                  }else{
                    od.sync_status = 3;  //unknown error code, no return data
                    od.oc_msg = err1;
                    //window.updateOrders(dbcfg, od, xthen);
                    window._updateDBChange(dbcfg, dbh, od, xthen);
                  }
                });
            } else {
                od.sync_status = (data.status !== undefined && data.status !== null) ? data.status : 2;  //unknown error code has return data
                //unknown error code has return data
                if(od.sync_status == 200){
                  od.sync_status = 20;
                }
                od.oc_msg = {};
                od.oc_msg.responseText = data.responseText;
                od.oc_msg.status =  data.status;
                od.oc_msg.statusText = data.statusText;       
                //od.oc_msg = data;
                //window.updateOrders(dbcfg, od, xthen);
                window._updateDBChange(dbcfg, dbh, od, xthen);
            }
        } else {
            od.sync_status = 3;  //unknown error code, no return data
            od.oc_msg = err;
            //window.updateOrders(dbcfg, od, xthen);
            window._updateDBChange(dbcfg, dbh, od, xthen);               
        }
      });
    }else{
      od.BeforSubmittingTime = getTime();
      s(dbcfg["uoc"], dbcfg["poc"], od, function (data1, err1) {
        console.log("++++++++++++++++++++++++++submit++++++++++++++++++++++++++++");
        if(data1){
          if(data1.status == 200) {
            od.sync_status = 1;  //success
            od.oc_msg = {};
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            //od.oc_msg = data1;
            od.AfterSubmittingTime = getTime();
            od.submited = true;
            //window.updateOrdersSubmited(dbcfg, od, xthen);
            window._updateDBChange(dbcfg, dbh, od, xthen);                               
          }else if(data1.status == 409){
            console.log("else 00000000000000000000000000000000000000");
            console.log(od);
            od.sync_status = 409;//1;
            //data1.responseJSON = null;
            //data1.responseText = null;
            /*
            for(var i in data1){
              if(typeof(data1[i]) == 'function' ){
                data1[i] = undefined;
              }
            }
            */
            //od.oc_msg.responseText = data1.responseText;
            od.oc_msg = {};
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            //od.oc_msg = data1;
            od.AfterSubmittingTime = getTime();
            //od.submited = true;
            //window.updateOrdersSubmited(dbcfg, od, xthen);
            window._updateDBChange(dbcfg, dbh, od, xthen);
          }else if(data1.status == 500){
                //data1.responseText = null;
                od.sync_status = 500;//3;  //success
                /*
                for(var i in data1){
                  if(typeof(data1[i]) == 'function' ){
                    data1[i] = undefined;
                  }
                }
                */
                //od.oc_msg.responseText = data1.responseText;
                od.oc_msg = {};
                od.oc_msg.status =  data1.status;
                od.oc_msg.statusText = data1.statusText;
                //od.oc_msg = data1;
                window._updateDBChange(dbcfg, dbh, od, xthen);
          }else if(data1.status == 429){ //请求太多
            //data1.responseText = null;
            od.sync_status = 429;  //success
            /*
            for(var i in data1){
              if(typeof(data1[i]) == 'function' ){
                data1[i] = undefined;
              }
            }
            */
            //od.oc_msg.responseText = data1.responseText;
            od.oc_msg = {};
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            //od.submited = true;
            //window.updateOrdersSubmited(dbcfg, od, xthen);
            window._updateDBChange(dbcfg, dbh, od, xthen);
          }else{
            od.sync_status = (data1.status !== undefined && data1.status !== null) ? data1.status : 2; //unknown error code has return data
            //unknown error code has return data1
            if(od.sync_status == 200){
              od.sync_status = 30;
            }
            /*
            for(var i in data1){
              if(typeof(data1[i]) == 'function' ){
                data1[i] = undefined;
              }
            }
            */
            od.oc_msg = {};
            od.oc_msg.responseText = data1.responseText;
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            //od.oc_msg = data1;
            //window.updateOrders(dbcfg, od, xthen);
            window._updateDBChange(dbcfg, dbh, od, xthen);
          }
        }else{
          od.sync_status = 3;  //unknown error code, no return data
          od.oc_msg = err1;
          //window.updateOrders(dbcfg, od, xthen);
          window._updateDBChange(dbcfg, dbh, od, xthen);
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

function seqManager(dbh){
  var ret = {};
  var seqsArr = [];
  var seqsSaveArr = [];
  var revs = [];
  var saveFlag = false;
  ret.addRev = function(rev){
    revs.push(rev);
  };
  ret.checkRev = function(ch){
    for(var c in ch){
      for(var i in revs){
        if(revs[i] == ch[c].rev){
          revs.splice(i, 1);
          return true;
        }
      }
    }
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
    //seqsArr.push(seq);
    var exsit = false;
    seqsArr.forEach(function(itm, idx){
      if(itm.id == ch.id){
        if(compareSeq(ch,itm)){
          seqsArr.splice(idx, 1);
        }else{
          exsit = true;
        }
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
    seqsArr = [];
  }
  function setSeqsSaveArrAfterSave(s){
    if(s == true){
      seqsSaveArr = [];
    }else{
      seqsArr.concat(seqsSaveArr);
    }
  }
  function clearDelDocFun(seqnums, idx, newArr){
    if(idx < seqnums.length){
      if(seqnums[idx].id == null){
        clearDelDocFun(seqnums, idx + 1, newArr);
        return;
      }
      dbh.get(seqnums[idx].id, function(err,d){
        if(!err){
          newArr.push(seqnums[idx])
        }else if(err.status != 404){
          newArr.push(seqnums[idx]);
        }
        clearDelDocFun(seqnums, idx + 1, newArr);
      });
    }else{
      if(newArr.length == 0){
        seqnums.sort(compareSeq);
        newArr.push(seqnums[seqnums.length -1]);
      }
      dbh.insert(newArr, function(err, d){
          //afterSave();
          _saveSeqnums();
          setTimeout(function(){
            clearDelDocSeq();
          }, 1000 * 10);
      });
    }
  }
  function clearDelDocSeq(){
    if(getSaveState() == false){
      startSave();
      dbh.get("seqnums", function(err, gd) {
        if (!err){
          clearDelDocFun(gd.seqnums, 0, []);
        }else{
          //afterSave();
          _saveSeqnums();
          setTimeout(function(){
            clearDelDocSeq();
          }, 10000);
        }
      });
    }else{
      setTimeout(function(){
        clearDelDocSeq();
      }, 1000 * 10);
    }
  }
  function _saveSeqnums(){
    dbh.get("seqnums", function(err, gd) {
      if (!err){
        var seqnums = gd.seqnums;
        setSeqsSaveArrBeforSave();
        seqsSaveArr.forEach(function(ch){
          var exsit = false;
          seqnums.forEach(function(itm, idx){
            if(!itm.id || !itm.seq){
              seqnums.splice(idx, 1);
            }
            if(itm.id == ch.id){
              if(compareSeq(ch,itm)){
                seqnums.splice(idx, 1);
              }else{
                //seqnums[idx].state = s;
                exsit = true;
              }
            }
          });
          if(!exsit){
            seqnums.push(ch);
          }
        });
        seqnums.sort(compareSeq);
        //var count = 0;
        for(var i in seqnums){
          if(seqnums[i].state == true){
            //console.log("I:" + i);
            //console.log("length:" + seqnums.length);
            if(i < seqnums.length - 1){
              //count += 1;
              seqnums.splice(i, 1);
            }
          }else{
            break;
          }
        }
        //if(count > 0 && count >= seqnums.length){
        //  count = seqnums.length - 1;
        //}
        //seqnums.splice(0, count);
        gd.seqnums = seqnums;
        dbh.insert(gd,function(err, d){
          if(err){
            setSeqsSaveArrAfterSave(false);
            setTimeout(function(){
              _saveSeqnums();
            },10000);
          }else{
            afterSave();
            setSeqsSaveArrAfterSave(true)
          }
        });
      }else{
        setTimeout(function(){
          _saveSeqnums();
        }, 10000);
      }
    });
  };
  ret.saveSeqnums = function(ch){
    addSeq(ch);
    if(getSaveState() == false){
      startSave();
      _saveSeqnums();
    }else{
      console.log("prepareing to save seq!!!!!!!!!!!!!!!!");
    }
  }
  clearDelDocSeq();
  return ret;
}

function getLeastSeqnum(dbh, then){
  dbh.get("seqnums", function(err, gd) {
      var since = 0;
      if(err && err.status == 404){
        dbh.insert({ _id: 'seqnums', seqnums: [] },function(err, body){
          if(!err){
            console.log("create seqnums failly!");
          }
        })
        since = 0;
      }else{
        var seqnums = gd.seqnums
        seqnums.sort(compareSeq);
        if( seqnums.length > 0 && seqnums[0].seq){
          since = seqnums[0].seq;
        }else{
          since = 'now';
        }
      }
      then(since);
  });
}

function changes(dbcfg, cfg, seqHandle, dbh, ch, then){
  var m = modifyOC(cfg),
      s = submitOC(cfg);
  console.log("changes start +++");
  console.log(ch);
  if(seqHandle.checkRev(ch.changes)){
    console.log("+++ It is KC modifier, ingnor! ++++");
    return;
  }
  dbh.get(ch.id, { revs_info: true }, function(err, newD) {
    if (err){
      console.log("changes get revs error +++");
      console.log(err)
    }else{
      //if(!(newD.sync_status == 1 || newD.sync_status == 0 || newD.sync_status == null)){
        //return;
      //}
      var idx = newD._revs_info.length >= 2 ? 1: 0;
      var rev = newD._revs_info[idx].rev;
      console.log("get rev in changes function +++");
      //console.log(newD._revs_info)
      console.log("latest rev:" + ch.changes[0].rev)
      console.log("rev:" + rev);
      console.log("id:" + ch.id)
      if(idx == 0){
        sync1OrderChange(dbcfg, dbh, newD, m, s, function(od, sd){
          //reduceActivings(dbcfg);
          console.log("if(idx == 0) sync1OrderChange in changes +++");
          //console.log(od);
          ch.changes = undefined;
          if(od.sync_status !== 1){
            ch.state = false;
          }else{
            ch.state = true;
          }
          if(sd && sd.ok == true){
            seqHandle.addRev(sd.rev);
          }
          seqHandle.saveSeqnums(ch);
        });
      }else{
        dbh.get(ch.id, { rev: rev }, function(err, oldD) {
          console.log("get previouce data in changes function +++")
          console.log("rev:" + rev);
          console.log("id:" + ch.id);
          console.log(err);
          //oldD.oc_msg = null;
          //console.log(body);
          if (!err){
            oldD.oc_msg = null;
            if(JSON.stringify(newD.data) === JSON.stringify(oldD.data)){
              console.log("do nothing!");
              ch.changes = undefined;
              if(newD.data.sync_status == 1){
                ch.state = true;
              }else{
                ch.state = false;
              }
              seqHandle.saveSeqnums(ch);
            }else{
              sync1OrderChange(dbcfg, dbh, newD, m, s, function(od, sd){
                console.log("if(idx !== 0) sync1OrderChange in changes function +++");
                //console.log(od);
                ch.changes = undefined;
                if(od.sync_status !== 1){
                  ch.state = false;
                }else{
                  ch.state = true;
                }
                if(sd && sd.ok == true){
                  seqHandle.addRev(sd.rev);
                }
                seqHandle.saveSeqnums(ch);
              });
            }
          }else if(false){

          }
        });
      }
    }
  });
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
          max: maxSingle,
          activings: 0,
          activing: false,
          scaning: false
        };
      }
    });
  }
  function scanBusiness(){
    getLocal("dbcfg1", function(data, err){
      //console.log("INFO: scanBusiness ***************");
      //console.log(data);
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
          cfg.historical_data_span = cfg.historical_data_span ? cfg.historical_data_span : 1;
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
    //console.log("runScanOrders ++++++++++++++++++++++++++");
    //console.log(businesses);
    for (var Key in businesses){
      if(businesses[Key].activing == false || businesses[Key].activings <= 0){
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
  function syncOrder100MS(orders, idx, dbcfg, m, s){
    if(orders.length != 0 && idx < orders.length){
      window.setTimeout(function(){
        sync1Order(dbcfg, orders[idx], m, s, function(){
          reduceActivings(dbcfg);
        });
        syncOrder100MS(orders, idx + 1, dbcfg, m, s);
      }, 100);
    }
  }
  function syncOrderOneByOne(orders, idx, dbcfg, m, s){
    if(orders.length != 0 && idx < orders.length){
      sync1Order(dbcfg, orders[idx], m, s, function(){
        reduceActivings(dbcfg);
        window.setTimeout(function(){
          syncOrderOneByOne(orders, idx + 1, dbcfg, m, s);
        },100);
      });
    }
  }
  function _scanOrders(dbcfg){
    'use strict';
    setScanning(dbcfg, true);
    get("/" + dbcfg["bid"] + "/_design/kc/_view/status?startkey=[0,2]&endkey=[0,100]&include_docs=true&conflicts=true&limit=" + maxSingle, dbcfg["udb"], dbcfg["pdb"], function(data, err) {
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
          syncOrderOneByOne(orders, 0, dbcfg, m, s);
        } else {
          scanDBCounter.fail++;
        }
    });
  }
  
  ret.run = function(){
    console.log("mutipleAjax run+++");
    var dbcfg = {
      uoc: "restws.gtdx",
      poc: "restws.gtdx",
      udb: "b726",
      pdb: "restws.gtdx"
    };
    var feed = null;
    if(window.nano){
      var _nano = window.nano("http://couchdb-cloud.sparkpad-dev.com/");
      var myCookie = "";
      _nano.auth("b726", "restws.gtdx", function (err, body, headers) {
        if (err) {
          return console.log(err);
        }
        if (headers && headers['set-cookie']) {
          myCookie = cookie.parse(headers['set-cookie'][0]);
        }
        var b726 = nano({url:'http://couchdb-cloud.sparkpad-dev.com/b726',cookie: 'AuthSession=' + myCookie.AuthSession });
        getLeastSeqnum(b726, function(since){
          console.log("since:" + since);
          var seqHandle = seqManager(b726);
          feed = b726.follow({since: since,filter: "kc/data"});
          feed.on('change', function (ch) {
            changes(dbcfg, cfg, seqHandle, b726, ch, function(d){
              console.log(d);
            });
          });
          feed.headers = {"Authorization": "Basic " + btoa("b726" + ":" + "restws.gtdx")};
          feed.follow();
        });
      });
    }else{
      console.log("no nano +++");
    }
    
  };
  return ret;
}