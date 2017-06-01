// register the grid component
Vue.component('demo-grid', {
  template: '#grid-template',
  props: {
    data: Array,
    columns: Array,
    filterKey: String
  },
  data: function () {
    var sortOrders = {}
    this.columns.forEach(function (key) {
      sortOrders[key] = 1
    })
    return {
      sortKey: '',
      sortOrders: sortOrders,
      titleList: {
        bid: "商家编号",
        uoc: "OC账号",
        poc: "OC密码",
        udb: "DB账号",
        pdb:"DB密码"
      },
      checkedNames:[],
      disabled: {
        bid: true,
        uoc: true, 
        poc: true,
        udb: true,
        pdb: true
      },
      saveDisabled: true
    }
  },
  created : function () {
    ///this.fetchDBCfg();
  },
  computed: {
    filteredData: function () {
      var sortKey = this.sortKey
      var filterKey = this.filterKey && this.filterKey.toLowerCase()
      var order = this.sortOrders[sortKey] || 1
      var data = this.data
      if (filterKey) {
        data = data.filter(function (row) {
          return Object.keys(row).some(function (key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      if (sortKey) {
        data = data.slice().sort(function (a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1) * order
        })
      }
      return data
    }
  },
  filters: {
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }
  },
  methods: {
    fetchDBCfg: function(){
      var _this = this;
      getLocal("dbcfg1", function(d){
        console.log(d);
        var dd = JSON.parse(d.responseText);
      });
    },
    sortBy: function (key) {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    },
    edit: function(idx){
      var _this = this;
      if(this.disabled.uoc == true){
        this.saveDisabled = false;
        demo.setQuery(_this.filteredData[idx].bid);
      }else{
        this.saveDisabled = true;
        demo.setQueryBack();
      }
      this.disabled = {
        bid: true,
        uoc: !_this.disabled.uoc, 
        poc: !_this.disabled.poc,
        udb: true,
        pdb: !_this.disabled.pdb
      };
    },
    save: function(idx){
      this.saveDisabled = true;
      demo.setQueryBack();
      this.disabled = {
        bid: true,
        uoc: true, 
        poc: true,
        udb: true,
        pdb: true
      };
      var _this = this;
      getLocal("dbcfg1", function(d){
        var dbcfg = [];
        //var isExsit = false;
        if(d.status == 404){
          dbcfg = [];
        }else if(d.status == 200){
          var dd = JSON.parse(d.responseText);
          dbcfg = dd.value;
        }
        var uoc_ref;
        var poc_ref;
        var udb_ref;
        var pdb_ref;
        dbcfg.forEach(function(itm, idxof){
          if(itm.bid == _this.filteredData[idx].bid){
            //isExsit = true;
            console.log("config is Exsit!");
            uoc_ref = _this.$refs["uoc" + idx][0].value;
            poc_ref = _this.$refs["poc" + idx][0].value;
            pdb_ref = _this.$refs["pdb" + idx][0].value;
            udb_ref = itm.bid;
            dbcfg[idxof].uoc = uoc_ref;
            dbcfg[idxof].poc = poc_ref;
            dbcfg[idxof].pdb = pdb_ref;
            return;
          }
        });
        console.log("INFO: start add user!");
        _this.filteredData[idx].pdb = pdb_ref;
        var _dbcfg = _this.filteredData[idx];
        addUser(_dbcfg, function(){
          setLocal("dbcfg1", dbcfg, function(_d){
            if(_d.status == 200 || _d.status == 202){

            }
          });
        });
      });
    },
    check: function (idx) {
      var _this  = this;
      checkDBCfg(this.filteredData[idx]);
      console.log($("#couchdbUser").val());
      //alert(idx);
      /*
        this.message = "You click me!";
        this.onClick = function () {
           this.message = "Hello,i changed!";
        }
        */
    },
    delAllOrders: function(idx) {
      Deploy_deleteOrders(this.filteredData[idx]);
    },
    del: function(idx){
      var _this = this;
      console.log(this.filteredData[idx].bid);
      deleteDB(_this.filteredData[idx].bid, function(d){
        if(d.status == 202 || d.status == 404 || d.status == 200 || d.status == 201 || d.status == 500){
          delCouchdbUser(_this.filteredData[idx].bid, function(dt){
            console.log(dt);
            if(dt == true){
              
            }else{

            }
            delDBcfgUser(_this.filteredData[idx], function(_dt){
              if(_dt == true){
                alert("删除配置文件成功！");
                window.location.reload();
              }else{
                 alert("删除配置文件失败！");
              }
            });
          });
        }
      });
      //alert(this.filteredData[idx].bid);
        //this.disabled = (!this.disabled);
     },
     selectAll: function(event){
      var _this = this;
        if (!event.currentTarget.checked) {
            this.checkedNames = [];
        } else { //实现全选
            _this.checkedNames = [];
            _this.filteredData.forEach(function(item, i) {
                _this.checkedNames.push(i);
            });
        }
     }
  }
})
function addUser(_this, then){
  console.log("LogInfo: addUser");
  addCouchdbUser(_this.bid, _this.pdb, [], function(dt1){
    console.log("LogInfo: addCouchdbUser");
    console.log(dt1);
    if(dt1.status == 200 || dt1.status == 202 || dt1.status == 201 || dt1.status == 409){
      var names = [];
      names.push(_this.bid);
      addUserForDB(_this.bid, names, [], function(dt2){
        console.log("log info: addUserForDB");
        console.log(dt2);
        if(dt2.status == 200 || dt2.status == 202 || dt2.status == 201 || dt2.status == 500){
          then(true);
        }else{
          then(false);
        }
      });
    }else{
      then(false)
    }
  });
}
// bootstrap the demo
var demo = new Vue({
  el: '#demo',
  data: {
    searchQuery: '',
    historyQuery: '',
    gridColumns: ['bid', 'uoc', 'poc', 'udb', 'pdb'],
    gridData: [
    ],
    bid:"",
    uoc:"",
    poc:"",
    udb:"",
    pdb:"",
    addDisabled: false
  },
  created: function(){
    this.fetchDBCfg();
  },
  methods: {
    fetchDBCfg: function(){
      var _this = this;
      getLocal("dbcfg1", function(d){
        var dd = JSON.parse(d.responseText);
        _this.gridData = dd.value;
      });
    },
    add: function(){
      //Deploy_deleteOrders11();
      
      var _this = this;
      _this.pdb = _this.poc;
      _this.addDisabled = true;
      add_usersSVRDB(function(dd){
        isExsitDB(_this.bid, function(s){
          if(s == true){
            alert("database " + _this.bid + " is exsit!");
          }else{
            createDB(_this.bid, function(dt){
              if(dt.status == 200 || dt.status == 201 || dt.status == 202){
                console.log("INFO: start add user!");
                setRevs_limit(_this, function(){
                  addUser(_this, function(d){
                    console.log(d);
                    if(d == true){
                      addDBcfgUser(_this, function(dt, dbcfg){
                        console.log(dt);
                        _this.addDisabled = false;
                        if(dt == true){
                          _this.gridData = dbcfg;
                        }
                      });
                    }else{
                      _this.addDisabled = false;
                    }
                  });
                });
              }else{
                _this.addDisabled = false;
              }
            });
          }
        });
      });
      
      //addcodeAdmin();
    },
    setQuery: function(str){
      this.historyQuery = this.searchQuery;
      this.searchQuery = str;
    },
    setQueryBack: function(){
      this.searchQuery = this.historyQuery;
      this.historyQuery = "";
    },
    flushUI: function(){
      this.fetchDBCfg();
    }
  }
})