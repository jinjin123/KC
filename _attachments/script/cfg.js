'use strict';
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
function ajaxCfg(url, method, user, password, d, then){
  var data = ""
  if(d && (typeof(d) == 'object' || typeof(d) == 'array')){
    data = JSON.stringify(d);
  }
  var options = {
    contentType : 'application/json',
    url:url,
    method: method,
    data: data,
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    /*
    beforeSend: function (xhr) {
       xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + password));
    }
    */
  };
  if(user && password) {
    options.headers = {
        "Authorization": "Basic " + btoa(user + ":" + password)
    };                
  }
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
function CouchdbUser(){
  return $("#couchdbUser").val();
}
function CouchdbPassWD(){
  return $("#couchdbPassWD").val();
}
function getCouchdbUsers(){
  //http://localhost:5984/_users/_all_docs?limit=20&include_docs=true
  //http://localhost:5984/_users/org.couchdb.user:b615?limit=20&include_docs=true
}
function getCouchdbUser(username, then){
  ajaxCfg("/_users/org.couchdb.user:" + username, "GET", CouchdbUser(), CouchdbPassWD(), null, then);
}

function addCouchdbUser(username, password, roles, then){
  ajaxCfg("/_users/org.couchdb.user:" + username, "GET", CouchdbUser(), CouchdbPassWD(), null, function(dt){
    if(dt.status == 200){
      dt = JSON.parse(dt.responseText);
      dt.name = username;
      dt.password = password;
    }else if(dt.status == 404){
      dt = {
        "name": username,
        "password": password,
        "roles": roles,
        "type": "user"
      };
    }
    ajaxCfg("/_users/org.couchdb.user:" + username, "PUT", CouchdbUser(), CouchdbPassWD(), dt, then);
  });
}
function isExsitCouchdbUser(username, then){
  ajaxCfg("/_users/org.couchdb.user:" + username, "GET", CouchdbUser(), CouchdbPassWD(), null, function(dt){
    if(dt.status == 200){
      then(true)
    }else if(dt.status == 404){
      then(false);
    }else{
      then(false);
    }
  });
}
function delCouchdbUser(username, then){
  ajaxCfg("/_users/org.couchdb.user:" + username, "GET", CouchdbUser(), CouchdbPassWD(), null, function(dt){
    if(dt.status == 200){
      dt = JSON.parse(dt.responseText);
      //dt.name = username;
      //dt.password = password;
      ajaxCfg("/_users/" + dt._id + "?rev=" + dt._rev, "DELETE", CouchdbUser(), CouchdbPassWD(), null, function(_dt){
        if(_dt.status == 202 || _dt.status == 404 || _dt.status == 200){
          then(true);
        }else{
          then(false);
        }
      });
    }else if(dt.status == 404){
      then(true);
    }else{
      then(false);
    }
    
  });
}

function addUserForDB(dbname, users, roles, then){
	var d = {
		"members": {
        "names": users,
        "roles": roles
    }
	};
  ajaxCfg("/" + dbname + "/_security", "PUT", CouchdbUser(), CouchdbPassWD(), d, then);
}
function delUserForDB(dbname, then){
  var d = {
    "members": {
        "names": [],
        "roles": []
    }
  };
  ajaxCfg("/" + dbname + "/_security", "PUT", CouchdbUser(), CouchdbPassWD(), d, then);
}
function isExsitDBuser(dbname, username, then){
  http://localhost:5984/b726/_security
  ajaxCfg("/" + dbname + "/_security", "GET", CouchdbUser(), CouchdbPassWD(), null, function(dt){
    if(dt.status == 200){
      dt = JSON.parse(dt.responseText);

      var names = [];
      if(dt.members){
        names = dt.members.names;
      }
      var exsit = false;
      names.forEach(function(itm){
        if(itm == username){
          exsit = true;
          return
        }
      });
      if(exsit == false){
        if(dt.admins){
          names = dt.admins.names;
          names.forEach(function(itm){
            if(itm == username){
              exsit = true;
              return
            }
          });
        }
      }
      if(exsit){
          then(true);
      }else{
        then(false);
      }
    }else if(dt.status == 404){
      then(false);
    }else{
      then(false);
    }
  });
}
function createDB(dbname, then){
  var d = {
    "create_target" : true,
    "source" : "kc-view-filter",
    "target" : dbname,
  };
  ajaxCfg("/_replicate", "POST", CouchdbUser(), CouchdbPassWD(), d, then);
}
function deleteDB(dbname, then){
  ajaxCfg("/" + dbname, "DELETE", CouchdbUser(), CouchdbPassWD(), null, then);
}
function isExsitDB(dbname, then){
  ajaxCfg("/_all_dbs", "GET", CouchdbUser(), CouchdbPassWD(), null, function(d){
    var exsit = false;
    if(d.status == 200){
      d = JSON.parse(d.responseText);
      d.forEach(function(itm){
        if(itm == dbname){
          exsit = true;
          return;
        }
      });
      if(exsit){
        then(true);
      }else{
        then(false);
      }
    }else if(d.status == 404){
      then(false);
    }else{
      then(false);
    }
  });
}
function setLocal(id, v, then){
  ajaxCfg("/code/_local/" + id, "GET", CouchdbUser(), CouchdbPassWD(), null, function(data, err){
    if(data.status == 200){
      data = JSON.parse(data.responseText);
      data.value = v;
    }else{
      data = {_id:id, value:v};
    }
    ajaxCfg("/code/_local/" + id, "PUT", CouchdbUser(), CouchdbPassWD(), data, then);
  });
}
function getLocal(id, then){
  ajaxCfg("/code/_local/" + id, "GET", CouchdbUser(), CouchdbPassWD(), null, function(data, err){
    then(data, err)
  });
}
function addDBcfgUser(db, then){
  getLocal("dbcfg1", function(d){
    var dbcfg = [];
    var isExsit = false;
    if(d.status == 404){
      dbcfg = [];
    }else if(d.status == 200){
      var dd = JSON.parse(d.responseText);
      dbcfg = dd.value;
    }
    dbcfg.forEach(function(itm){
      if(itm.bid == db.bid){
        isExsit = true;
        console.log("config is Exsit!");
        return;
      }
    });
    if(!isExsit){
      dbcfg.push(
        { bid: db.bid, uoc: db.uoc, poc: db.poc, udb: db.bid, pdb: db.pdb }
      );
      setLocal("dbcfg1", dbcfg, function(_d){
        console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
        console.log(_d);
        if(_d.status == 200 || _d.status == 202 || _d.status == 201){
          then(true, dbcfg);
        }else{
          then(false);
        }
      });
    }else{
      then(true, dbcfg);
    }
  });
}

function delDBcfgUser(db, then){
  getLocal("dbcfg1", function(d){
    var dbcfg = [];
    var isExsit = false;
    if(d.status == 404){
      dbcfg = [];
    }else if(d.status == 200){
      var dd = JSON.parse(d.responseText);
      dbcfg = dd.value;
    }
    dbcfg.forEach(function(itm, idx){
      if(itm.bid == db.bid){
        isExsit = true;
        dbcfg.splice(idx, 1);
        console.log("config is Exsit!");
        return;
      }
    });
    if(isExsit){
      setLocal("dbcfg1", dbcfg, function(_d){
        if(_d.status == 200 || _d.status == 202 || _d.status == 201){
          then(true);
        }else{
          then(false);
        }
      });
    }else{
      then(true);
    }
  });
}
function _addReplication(stcfg, flag, then){
  var id = "serverto" + stcfg["bid"];
  console.log("_addReplication id:" + id);
  var source = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@couchdb-cloud.sparkpad-dev.com/" + stcfg["bid"];
  var target = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@localhost:5984/" + stcfg["bid"];
  if(flag == true){
    id = stcfg["bid"] + "toserver";
    source = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@localhost:5984/" + stcfg["bid"];
    target = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@couchdb-cloud.sparkpad-dev.com/" + stcfg["bid"];
  }
  ajaxCfg("/_replicator/" + id, "GET", CouchdbUser(), CouchdbPassWD(), null, function(data, err){
    if(data.status == 200){
      data = JSON.parse(data.responseText);
      ajaxCfg("/_replicator/" + data._id + "?rev=" + data._rev, "DELETE", CouchdbUser(), CouchdbPassWD(), null, function(d, err){
        ajaxCfg("/_replicator", "POST", CouchdbUser(), CouchdbPassWD(), data, function(dt, err){
          then(dt, err);
        });
      });
    }else if(data.status == 404){
      data = {};
      data._id = id;
      data.source = source;
      data.target = target;
      data.continuous = true;
      data.filter = "kc/store";
      data.query_params = {"field_de_store_id":stcfg["storeid"]};
      ajaxCfg("/_replicator", "POST", CouchdbUser(), CouchdbPassWD(), data, function(dt, err){
        then(dt, err);
      });
    }
  });
}
//门店couchdb创建数据库
function createStoreDB(stcfg, then){
  var d = {
    "create_target" : true,
    "source" : "http://couchdb-cloud.sparkpad-dev.com/" + "kc-view-filter",
    "target" : "http://" + CouchdbUser() + ":" + CouchdbPassWD() + "@localhost:5984/" + stcfg["bid"],
  };
  ajaxCfg("/_replicate", "POST", CouchdbUser(), CouchdbPassWD(), d, then);
}
//添加门店couchdb 与服务器couchdb数据同步！
function addReplication(stcfg, then){
  _addReplication(stcfg, false, function(d){
    if(d.status == 200 || d.status == 202 || d.status == 201){
      _addReplication(stcfg, true, function(_d){
        then();
        if(_d.status == 200 || _d.status == 202 || d.status == 201){

        }
      });
    }else{
      then();
    }
  });
}
//判断同步是否存在！
function isExistReplication(id, then){
  ajaxCfg("/_replicator/" + id, "GET", CouchdbUser(), CouchdbPassWD(), null, function(data, err){
    if(data.status == 200){
      
      data = JSON.parse(data.responseText);
      console.log(data);
      console.log(data._replication_state)
      if(data._replication_state == "triggered"){
        then(0);
      }else{
        then(1);
      }
    }else if(data.status == 404){
      then(-1);
    }else{
      then(-1);
    }
  });
}

function _delReplication(stcfg, flag, then){
  var id = "serverto" + stcfg["bid"];
  console.log("_addReplication id:" + id);
  var source = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@couchdb-cloud.sparkpad-dev.com/" + stcfg["bid"];
  var target = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@localhost:5984/" + stcfg["bid"];
  if(flag == true){
    id = stcfg["bid"] + "toserver";
    source = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@localhost:5984/" + stcfg["bid"];
    target = "http://" + stcfg["bid"] + ":" + stcfg["pdb"] + "@couchdb-cloud.sparkpad-dev.com/" + stcfg["bid"];
  }
  ajaxCfg("/_replicator/" + id, "GET", CouchdbUser(), CouchdbPassWD(), null, function(data, err){
    if(data.status == 200){
      data = JSON.parse(data.responseText);
      ajaxCfg("/_replicator/" + data._id + "?rev=" + data._rev, "DELETE", CouchdbUser(), CouchdbPassWD(), null, function(data, err){
        //console.log("_addReplication delReplication +++++++++++++++++");
        //console.log(_dt);
        ajaxCfg("/_replicator", "POST", CouchdbUser(), CouchdbPassWD(), data, function(dt, err){
          then(true);
        });
      });
    }else if(data.status == 404){
      then(true);
    }else{
      then(false);
    }
  });
}

function delReplication(stcfg, then){
  _delReplication(stcfg, false, function(d){
      _delReplication(stcfg, true, function(_d){
        then();
        if(_d.status == 200 || _d.status == 202 || _d.status == 201 || _d.status == 404){

        }
      });
    
  });
}
function checkDBCfg(dbcfg, then){
  var msg = "";
  isExsitDB(dbcfg["bid"], function(d){
    if(d == true){
      msg += dbcfg["bid"] + " 数据库已经创建！\n";
    }else{
      msg += dbcfg["bid"] + " 数据库不存在！\n";
    }
    isExsitCouchdbUser(dbcfg["bid"], function(d){
      if(d == true){
        msg += dbcfg["bid"] + " couchdb 用户已经创建！\n";
      }else{
        msg += dbcfg["bid"] + " couchdb 用户不存在！\n";
      }
      isExsitDBuser(dbcfg["bid"], dbcfg["bid"], function(d){
        if(d == true){
          msg += dbcfg["bid"] + " 数据库用户已经创建！\n";
        }else{
          msg += dbcfg["bid"] + " 数据库用户不存在！\n";
        }
        alert(msg);
      });
    });
  });
}
// 检查经理机couchdb配置是否成功！
function checkStCfg(stcfg, then){
  var msg = "";
  isExsitDB(stcfg["bid"], function(d){
    if(d == true){
      msg += stcfg["bid"] + " 数据库已经创建！\n";
    }else{
      msg += stcfg["bid"] + " 数据库不存在！\n";
    }
    isExsitCouchdbUser(stcfg["bid"], function(d){
      if(d == true){
        msg += stcfg["bid"] + " couchdb 用户已经创建！\n";
      }else{
        msg += stcfg["bid"] + " couchdb 用户不存在！\n";
      }
      isExsitDBuser(stcfg["bid"], stcfg["bid"], function(d){
        if(d == true){
          msg += stcfg["bid"] + " 数据库用户已经创建！\n";
        }else{
          msg += stcfg["bid"] + " 数据库用户不存在！\n";
        }
        isExistReplication("serverto" + stcfg["bid"], function(d){
          if(d == 0){
            msg += "serverto" + stcfg["bid"] + " 已经创建, 并且同步正常！\n";
          }else if(d == 1){
            msg += "serverto" + stcfg["bid"] + " 已经创建, 但同步出错！\n";
          }else if(d == -1){
            msg += "serverto" + stcfg["bid"] + " 不存在！\n";
          }
          isExistReplication(stcfg["bid"] + "toserver", function(d){
            if(d == 0){
              msg += stcfg["bid"] + "toserver" + " 已经创建, 并且同步正常！\n";
            }else if(d == 1){
              msg += stcfg["bid"] + "toserver" + " 已经创建, 但同步出错！\n";
            }else{
              msg += stcfg["bid"] + "toserver" + " 不存在！\n";
            }
            //alert("helo!!");
            alert(msg);
          });
        });
      });
    });
  });
}
function addAdminForDB(dbname, names, then){
  var d = {
    "admins": {
        "names": names,
        "roles": [
            "admins"
        ]
    }
  };
  ajaxCfg("/" + dbname + "/_security", "PUT", CouchdbUser(), CouchdbPassWD(), d, then);
}
function  createDBLC(dbname, then){
  ajaxCfg("/" + dbname, "PUT", CouchdbUser(), CouchdbPassWD(), null, function(d){
    if(d.status == 202 || d.status == 201 || d.status == 500){
      then(true);
    }else{
      then(false);
    }
  });
}

function add_usersSVRDB(then){
  isExsitDB("_users", function(d){
    if(d == true){
      isExsitDBuser("_users", CouchdbUser(),function(d){
        if(d == true){
          then(true);
        }else{
          var names = [CouchdbUser()];
          addAdminForDB("_users", names, function(d){
            if(d.status == 202 || d.status == 201 || d.status == 500){
              then(true);
            }else{
              alert("_users 添加用户失败");
            }
          });
        }
      });
    }else{
      createDBLC("_users", function(d){
        if(d == true){
          var names = [CouchdbUser()];
          addAdminForDB("_users", names, function(d){
            if(d.status == 202 || d.status == 201 || d.status == 500){
              then(true);
            }else{
              alert("_users 添加用户失败");
            }
          });
        }else{
          alert("添加 _users 数据库失败！");
        }
      })
    }
  });
}

function addStoreLCDB(then){
  isExsitDB("_users", function(d){
    if(d == false){
      createDBLC("_users", function(d){
        if(d == true){
          isExsitDB("_replicator", function(d){
            if(d == false){
              createDBLC("_replicator", function(d){
                if(d == true){
                  then(true);
                }else{
                  alert("添加 _replicator 失败！");
                }
              });
            }else{
              then(true);
            }
          });
        }else{
          alert("添加 _users 数据库失败！");
        }
      });
    }else{
      isExsitDB("_replicator", function(d){
        if(d == false){
          createDBLC("_replicator", function(d){
            if(d == true){
              then(true);
            }else{
              alert("添加 _replicator 失败！");
            }
          });
        }else{
          then(true);
        }
      });
    }
  });
}