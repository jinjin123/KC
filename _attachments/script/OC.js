'use strict';
function ajaxN(options, then){
  var verbose = options.verbose;
  delete options.verbose;
  $.ajax(options).done(function (data, textStatus, jqXHR) {
      if(verbose){
          console.log('--------success--------');
      }
      if(typeof(then) === 'function'){
          then(jqXHR, null);
      }
  }).fail(function (jqXHR, textStatus, errorThrown) {
      var err = ajaxError(jqXHR, textStatus, errorThrown, options);
      if(verbose) {
          console.log('---------fail---------');
          console.log(err);
      }
      if(typeof(then) === 'function') {
        then(jqXHR,err);
      }
  });
}

function submitOCN(url, user, password, order, then){
  console.log("submitOCN +++");
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
    verbose: true,
    beforeSend: function (xhr) {
      xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + password));
    }
  };
  ajaxN(options, then);
}

function modifyOCN(url, user, password, order, then){
  console.log("+++++++++++++++++++++++++++++++++ modifyOCN +++++++++++++++++++++++++++++++++");
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
    verbose: true,
    beforeSend: function (xhr) {
      xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + password));
    }
  };
  ajaxN(options, then);
}
function deleteOCN(url, user, password, order, then){
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
  var url = '/' + dbcfg['bid'] + '/' + order._id;
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
function _deleteDBChange(dbcfg, order, then){
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
    then(order, dt);
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
    then();
  });
}
function _getDoc(dbcfg, _id, qs, then){
  var url = '/' + dbcfg['bid'] + '/' + _id;
  if(qs && typeof(qs) == "string"){
    url += "?" + qs;
  }
  var options = {
    contentType : 'application/json',
    url: url,
    method: "get",
    //data:JSON.stringify(order),
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    beforeSend: function (xhr) {
      xhr.setRequestHeader ("Authorization", "Basic " + btoa(dbcfg["udb"] + ":" + dbcfg["pdb"]));
    }
  };
  ajaxN(options, function(dt, err){
    then(dt, err);
  });
}
function _updateSeqnums(dbcfg, seqnums, then){
  var url = '/' + dbcfg['bid'] + '/' + seqnums._id;
  var options = {
    contentType : 'application/json',
    url: url,
    method: "put",
    data:JSON.stringify(seqnums),
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    beforeSend: function (xhr) {
       xhr.setRequestHeader ("Authorization", "Basic " + btoa(dbcfg["udb"] + ":" + dbcfg["pdb"]));
    }
  };
  ajaxN(options, function(dt, err){
    then(dt, err);
  });
}
function _updateDBChange(dbcfg, order, then){
  var url = '/' + dbcfg['bid'] + '/' + order._id;
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
  ajaxN(options, function(dt, err){
    then(order, dt, err);
  });
}
function sync1OrderChange(dbcfg, od, m, s, xthen){
  console.log("sync1OrderChange+++");
    if(od.submited == true){
      m(dbcfg["uoc"], dbcfg["poc"], od, function (data, err) {
        if(err){
          console.log(err);
        }
        if(data) {
            if (data.status == 200) {
              od.sync_status = 1;  //success
              //od.oc_msg = data;
              //od.oc_msg.responseText = data1.responseText;
              od.oc_msg = {};
              od.oc_msg.status =  data.status;
              od.oc_msg.statusText = data.statusText;
              od.AfterSubmittingTime = getTime();
              //window.updateOrders(dbcfg, od, xthen);
              window._updateDBChange(dbcfg, od, xthen);
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
                      window._updateDBChange(dbcfg, od, xthen);                               
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
                      window._updateDBChange(dbcfg, od, xthen);
                    }else if(data1.status == 500){
                      data1.responseText = null;
                      
                      od.sync_status = 500;//3;  //success
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.responseText;
                      od.oc_msg.status =  data1.status;
                      od.oc_msg.statusText = data1.statusText;
                      od.AfterSubmittingTime = getTime();
                      //od.oc_msg = data1;
                      window._updateDBChange(dbcfg, od, xthen);
                    }else if(data1.status == 429){ //请求太多
                      od.sync_status = 429;  //success
                      od.oc_msg = {};
                      od.oc_msg.responseText = data1.responseText;
                      od.oc_msg.status =  data1.status;
                      od.oc_msg.statusText = data1.statusText;
                      od.AfterSubmittingTime = getTime();
                      //od.oc_msg = data1;
                      //od.submited = true;
                      //window.updateOrdersSubmited(dbcfg, od, xthen);
                      window._updateDBChange(dbcfg, od, xthen);
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
                      od.AfterSubmittingTime = getTime();
                      //od.oc_msg = data1;
                      //window.updateOrders(dbcfg, od, xthen);
                      window._updateDBChange(dbcfg, od, xthen);
                    }
                  }else{
                    od.sync_status = 3;  //unknown error code, no return data
                    od.oc_msg = err1;
                    //window.updateOrders(dbcfg, od, xthen);
                    window._updateDBChange(dbcfg, od, xthen);
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
                window._updateDBChange(dbcfg, od, xthen);
            }
        } else {
            od.sync_status = 3;  //unknown error code, no return data
            od.oc_msg = err;
            //window.updateOrders(dbcfg, od, xthen);
            window._updateDBChange(dbcfg, od, xthen);               
        }
      });
    }else{
      od.BeforSubmittingTime = getTime();
      s(dbcfg["uoc"], dbcfg["poc"], od, function (data1, err1) {
        console.log("+++++++++++submit+++++++++++");
        if(data1){
          if(data1.status == 200) {
            od.sync_status = 1;  //success
            od.oc_msg = {};
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            od.AfterSubmittingTime = getTime();
            od.submited = true;
            window._updateDBChange(dbcfg, od, xthen);                               
          }else if(data1.status == 409){
            console.log(od);
            od.sync_status = 1;
            od.oc_msg = {};
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            //od.oc_msg = data1;
            od.AfterSubmittingTime = getTime();
            window._updateDBChange(dbcfg, od, xthen);
          }else if(data1.status == 500){
            od.sync_status = 500;//3;  //success
           
            od.oc_msg = {};
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            od.AfterSubmittingTime = getTime();
            //od.oc_msg = data1;
            window._updateDBChange(dbcfg, od, xthen);
          }else if(data1.status == 429){ //请求太多
            console.log(od);
            //data1.responseText = null;
            od.sync_status = 429;  //success
            od.oc_msg = {};
            od.oc_msg.status =  data1.status;
            od.oc_msg.statusText = data1.statusText;
            od.AfterSubmittingTime = getTime();
            //od.submited = true;
            //window.updateOrdersSubmited(dbcfg, od, xthen);
            window._updateDBChange(dbcfg, od, xthen);
          }else if(data1.status == 0){
            od.oc_msg = {};
            od.sync_status = 100;
            od.oc_msg.responseText = data1.responseText;
            od.oc_msg.statusText = data1.statusText;
            od.AfterSubmittingTime = getTime();
            window._updateDBChange(dbcfg, od, xthen);
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
            od.AfterSubmittingTime = getTime();
            window._updateDBChange(dbcfg, od, xthen);
          }
        }else{
          od.sync_status = 3;  //unknown error code, no return data
          od.oc_msg = err1;
          window._updateDBChange(dbcfg, od, xthen);
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

function seqManager(dbcfg){
  var ret = {};
  var seqsArr = [];
  var seqsSaveArr = [];
  var revs = [];
  var saveFlag = false;
  var firstGetSeqnums = true; //如果是第一次获取，_changes since 值是第一个，如果不是则_changes since值为最后一个
  var changeTime = (new Date()).getTime();
  var overtimes = 90 * 1000;
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
          if(itm.id == ch.id){
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
  function clearDelDocFun(gd, idx, newArr){
    var seqnums = gd.seqnums;
    if(idx < seqnums.length){
      if(seqnums[idx].id == null){
        clearDelDocFun(gd, idx + 1, newArr);
        return;
      }
      _getDoc(dbcfg, seqnums[idx].id, null, function(d,err){
        //console.log(d);
        //console.log(err);
        if(err && err.status == 404){
          seqnums[idx].state = true;
        }
        newArr.push(seqnums[idx]);
        clearDelDocFun(gd, idx + 1, newArr);
      });
    }else{
      //console.log("clearDelDocFun start to save!!!");
      //console.log(newArr);
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
      _updateSeqnums(dbcfg, gd, function(dt, err){
        if(!err){
          setSeqsSaveArrAfterSave(true);
          afterSave();
          setTimeout(function(){
            clearDelDocSeq();
          }, 1000 * 60 * 10);
        }else{
          console.log("clearDelDocFun insert error!");
          console.log(err.status);
          console.log(err.statusCode);
          setSeqsSaveArrAfterSave(false);
        }
      });
    }
  }
  //删除已经被删除的doc的seq
  function clearDelDocSeq(){
    //console.log("clearDelDocSeq +++++++++++++++++++++++++++++");
    if(getSaveState() == false){
      console.log("clearDelDocSeq startSave");
      startSave();
      _getDoc(dbcfg, "seqnums", null, function(dt, err){
        if(err){
          console.log("clearDelDocSeq get err!");
          console.log(err);
        }
        if(!err){
          var gd = dt.responseJSON;//JSON.parse(dt.responseText);
          clearDelDocFun(gd, 0, []);
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
  function _saveSeqnums(){
    console.log("_saveSeqnums _getDoc!");
    _getDoc(dbcfg, "seqnums", null, function(dt, err){
      if(!err){
          //var gd = JSON.parse(dt.responseText);

          var gd  = dt.responseJSON;
          var seqnums = gd.seqnums;
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
          //console.log("seqtmp ++++++++++++++++++++++++++++++++++++++++");
          //console.log(seqnums);
          seqnums.sort(compareSeq);
          //console.log("seqtmp after sort +++++++++++++++++++++++++++++++++++");
          //console.log(seqnums);
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
          gd.seqnums = seqtmp2;
          //console.log("save seqnums ++++++++++++++++++++++");
          //console.log("seqnums:" + seqtmp2.length);
          //console.log("businessid:" + dbcfg["bid"]);
          //console.log(seqnums);
          //console.log(seqtmp2);
          _updateSeqnums(dbcfg, gd, function(dt, err){
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
        if(err.status == 404){
          _updateSeqnums(dbcfg, { _id: 'seqnums', seqnums: []}, function(dt, err){
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
  ret.getLeastSeqnum = function(dbcfg, then){
      _getDoc(dbcfg, "seqnums", null, function(dt, err) {
      var since = 0;
      if(err){
        console.log("getLeastSeqnum get a error!");
        console.log(err);
        if(err.status == 404){
          _updateSeqnums(dbcfg, { _id: 'seqnums', seqnums: []}, function(dt, err){
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
        var gd = dt.responseJSON;
        var seqnums = gd.seqnums
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
        since = 'now';
        then(since);
      }
    });
  };
  clearDelDocSeq();
  return ret;
}

function getLeastSeqnum(dbcfg, then){
    _getDoc(dbcfg, "seqnums", null, function(dt, err) {
      var since = 0;
      if(err){
        console.log("getLeastSeqnum get a error!");
        console.log(err);
        if(err.status == 404){
          _updateSeqnums(dbcfg, { _id: 'seqnums', seqnums: []}, function(dt, err){
            if(err){
              console.log("create seqnums failly!");
              console.log(err);
            }
            console.log(dt);
            then(since);
          });
        }
        //since = 0;
      }else{
        //var gd = JSON.parse(dt.responseText);
        var gd = dt.responseJSON;
        var seqnums = gd.seqnums
        seqnums.sort(compareSeq);
        if( seqnums.length > 0 && seqnums[0].seq){
          since = seqnums[0].seq;
        }else{
          since = 0;
        }
        then(since);
      }
     
    });
  //});
}
function addRevFun(sd, seqHandle){
  if(sd && sd.responseJSON){
    var d = sd.responseJSON;
    if(d.ok == true){
      seqHandle.addRev(d.rev);
    }
  }
}
function processChanges(countChanges, dbcfg, m, s, seqHandle, ch, then){
  //console.log("processChanges countChanges:" + countChanges);
  _getDoc(dbcfg, ch.id, 'revs_info=true', function(dt, err){
    //console.log("processChanges _getDoc version countChanges:" + countChanges);
    if (err){
      console.log("changes get revs error +++");
      console.log(err)
      if(typeof(then) == 'function'){
        then();
      }
    }else{
      var newD = dt.responseJSON;//JSON.parse(dt.resposeText);
      var idx = newD._revs_info.length >= 2 ? 1: 0;
      var rev = newD._revs_info[idx];
      
      //console.log("get rev in changes function +++");
      //console.log(newD._revs_info)
      //console.log("latest rev:" + ch.changes[0].rev)
      //console.log("rev:" + rev.rev);
      //console.log("id:" + ch.id)
      
      if(idx == 0 || newD.submited == null){
        sync1OrderChange(dbcfg, newD, m, s, function(od, sd, err){
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
      }else{
        if(rev.status == "missing"){
          sync1OrderChange(dbcfg, newD, m, s, function(od, sd){
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
          return;
        }
        console.log("_getDoc rev+++");
        _getDoc(dbcfg, ch.id, "rev=" + rev.rev, function(dt, err){  
          //console.log("get previouce data in changes function +++")
          //console.log("rev:" + rev);
          //console.log("id:" + ch.id);
          if (err){
            console.log("get previouce data failly!")
            if(err.status == 404){
              sync1OrderChange(dbcfg, newD, m, s, function(od, sd){
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
            }else{
              if(typeof(then) == 'function'){
                then();
              }
            }
          }else{
            var oldD = dt.responseJSON;
            var sync = false;
            oldD.oc_msg = null;
            if(JSON.stringify(newD.data) === JSON.stringify(oldD.data)){
              ch.changes = undefined;
              if(newD.sync_status == 1){
                ch.state = true;
              }else{
                sync = true;
                ch.state = false;
              }
              ch.doc = null;
              seqHandle.saveSeqnums(ch);
            }else{
              sync = true;
            }
            if(sync){
              sync1OrderChange(dbcfg, newD, m, s, function(od, sd){
                //console.log(od);
                ch.changes = undefined;
                if(od.sync_status == 1){
                  ch.state = true;
                }else{
                  ch.state = false;
                }
                addRevFun(sd,seqHandle);
                ch.doc = null;
                seqHandle.saveSeqnums(ch);
                if(typeof(then) == 'function'){
                  console.log("sync1OrderChange then +++");
                  then();
                }
              });
            }else{
              if(typeof(then) == 'function'){
                then();
              }
            }
          }
        });
      }
    }
  });
}
function syncOrderOneByOne(orders, idx, dbcfg, m, s, seqHandle, then){
  if(orders.length != 0 && idx < orders.length){
    sync1OrderChange(dbcfg, orders[idx], m, s, function(od, sd){
      addRevFun(sd,seqHandle);
      syncOrderOneByOne(orders, idx + 1, dbcfg, m, s, seqHandle, then);
    });
  }else{
    if(typeof(then) === "function"){
      then();
    }
  }
}

function _scanOrders(seqHandle, dbcfg, m, s){
  'use strict';
  console.log("_scanOrders dbname:" + dbcfg["bid"]);
  try {
    if(seqHandle.overChangeTime()){
    console.log("_scanOrders overTime!!!");
    get("/" + dbcfg["bid"] + "/_design/kc/_view/status?startkey=[0,2]&endkey=[0,100]&include_docs=true&conflicts=true&limit=100", dbcfg["udb"], dbcfg["pdb"], function(data, err) {
        console.log("_scanOrders data ++++++++++++++++");
        console.log(data);
        if(data){
          scanDBCounter.success++;
          var orders = data.rows.filter(function(item){
                            return item.value.length === 1;
                        }).map(function (o) {
                            return o.doc;
                        });
          syncOrderOneByOne(orders, 0, dbcfg, m, s, seqHandle, function(){
            seqHandle.setChangeTime();
            setTimeout(function(){
              _scanOrders(seqHandle, dbcfg, m, s);
            }, 10 * 1000);
          });
        }
    });
  }else{
    console.log("_scanOrders not overTime!!!");
    setTimeout(function(){
      _scanOrders(seqHandle, dbcfg, m, s);
    }, 10 * 1000);
  }
}catch(e){
    setTimeout(function(){
      _scanOrders(seqHandle, dbcfg, m, s);
    }, 10 * 1000);
}
  
}
function doComplex(seqHandle, dbcfg, cfg, retry_day){
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
              //console.log("INFO: compact");
              //compact(dbcfg, function (d, e){
              //    if(e){
              //        console.log("compact: ", e);
              //    }
                  console.log("INFO: retryFailed");
                  retryFailed(seqHandle, dbcfg, retry_day, cfg, function(data, err){
                      if(err){
                          console.log("retryFailed: ", err);
                      }
                      setTimeout(function(){
                        doComplex(seqHandle, dbcfg, cfg, retry_day);
                      }, 10 * 1000);
                  });
              //});                        
          });
      });
  });
}
function changes(countChanges, dbcfg, cfg, seqHandle, m, s, ch, then){
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
  processChanges(countChanges, dbcfg, m, s, seqHandle, ch, then);
}

function feedManager(seqHandle, dbcfg, cfg, m, s){
  if(seqHandle.getSaveState()){
    setTimeout(function(){
      feedManager(seqHandle, dbcfg, cfg, m, s);
    },1000);
    return;
  }
  var firstCh = false;
  var feedPause = false;
  var countChanges = 0;
  var maxChangesNum = 20;
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
  seqHandle.getLeastSeqnum(dbcfg, function(since){
    console.log(dbcfg);
    console.log("since:" + since);
    var feed = null;
    //var dbh = nano({url:'https://couchdb-cloud.sparkpad-dev.com/' + dbcfg["bid"], strictSSL:true});
    //feed = dbh.follow({since: since, filter: "kc/data", include_docs: true});
    var connection = new(cradle.Connection)('https://couchdb-cloud.sparkpad-dev.com', {strictSSL:false, port: 443}, {
      auth: { username: 'sye', password: 'sye123456' }
    });
    var db = connection.database(dbcfg['bid']);
    var feed = db.changes({ since: since, filter: "kc/data", include_docs: true });
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
      if(dbcfg["bid"] == "b726"){
        //feed.pause();
        //return;
      }
      console.log("change:" + dbcfg["bid"]);
      console.log(getNum(ch.seq));
      if(addCount()){
        console.log("mutiple changes, feed should been paused!");
        feed.pause();
      }
      changes(countChanges, dbcfg, cfg, seqHandle, m, s, ch, function(d){
        if(reduceCount() && isPaused()){
          console.log("no changes any more, feed should been resumed!");
          setTimeout(function(){
            console.log("start feed again ++++");
            console.log("businesses ID:" + dbcfg["bid"]);
            setPaused(false);
            feed  = null;
            feedManager(seqHandle, dbcfg, cfg, m, s)
          }, 500);
        }
        console.log("feed resume:" + countChanges);
      });
    });
    feed.headers = {"Authorization": "Basic " + btoa(dbcfg["udb"] + ":" + dbcfg["pdb"])};
    feed.follow();
  });
}
function businessRunner(dbcfg, cfg, retry_day){
  var m = modifyOC(cfg),
      s = submitOC(cfg);
  var seqHandle = seqManager(dbcfg);
  feedManager(seqHandle, dbcfg, cfg, m, s);
  doComplex(seqHandle, dbcfg, cfg, retry_day);
  _scanOrders(seqHandle, dbcfg, m, s)
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
      if(data){
        addBusiness(data);
      }
      window.setTimeout(function(){
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