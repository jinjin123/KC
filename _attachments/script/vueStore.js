
function addUser(_this, then){
  console.log("addUser ++++++++++++++++");
  addCouchdbUser(_this.bid, _this.pdb, [], function(dt1){
    console.log("addCouchdbUser ++++++++++++++++++++++++");
    console.log(dt1);
    if(dt1.status == 200 || dt1.status == 202 || dt1.status == 201 || dt1.status == 409){
      var names = [];
      names.push(_this.bid);
      addUserForDB(_this.bid, names, [], function(dt2){
        console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
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
    gridColumns: ['bid', 'uoc', 'poc', 'udb', 'pdb'],
    gridData: [
    /*
      { bid: 'Jackie Chan', uoc: 7000, poc:"ttt", udb: "testdb", pdb: "testdb" },
      { bid: 'Chuck Norris', uoc: Infinity, poc:"ttt", udb: "testdb", pdb: "testdb" },
      { bid: 'Bruce Lee', uoc: 9000, poc:"ttt", udb: "testdb", pdb: "testdb" },
      { bid: 'Jackie Chan', uoc: 7000, poc:"ttt", udb: "testdb", pdb: "testdb" },
      { bid: 'Jet Li', uoc: 8000, poc:"ttt", udb: "testdb", pdb: "testdb" }
      */
    ],
    bid:"",
    //uoc:"",
    //poc:"",
    udb:"",
    pdb:"",
    storeid: "",
    addDisabled: false,
    delDisabled: false,
    checkDisabled: false
  },
  created: function(){
    this.fetchDBCfg();
  },
  methods: {
    fetchDBCfg: function(){
      var _this = this;
      getLocal("storeCfg", function(d){
        console.log(d);
        var dd = JSON.parse(d.responseText);
        console.log("88888888888888888888888888888888888888888888");
        console.log(dd);
        console.log(dd.value);
        //_this.gridData = dd.value;
        var cfg = dd.value;
        if(cfg.bid){
          _this.bid = cfg.bid;
          _this.udb = cfg.udb;
          _this.pdb = cfg.pdb;
          _this.storeid = cfg.storeid;
        }
      });
    },
    add: function(){
      var _this = this;
      _this.addDisabled = true;
      var stCfg = {
        bid: _this.bid,
        udb: _this.bid,
        pdb: _this.pdb,
        storeid: _this.storeid
      };
      console.log("start + createStoreDB +++++++++++");
      console.log(stCfg);
      addStoreLCDB(function(){
        createStoreDB(stCfg,function(d){
          console.log("createStoreDB ++++++++++++++++++");
          console.log(d);
          addCouchdbUser( _this.bid, _this.pdb, [], function(_d){
            var names = [];
            names.push(_this.bid);
            addUserForDB(_this.bid, names, [], function(__d){
              console.log(__d);
              addReplication(stCfg, function(_d){
                _this.addDisabled = false;
                console.log("addReplication ++++++++++++++++++=");
                console.log(_d);
              });
            });
          });
        });
      });
      setLocal("storeCfg", stCfg, function(_d){
        if(_d.status == 200 || _d.status == 202){
          //then(true, stCfg);

        }else{
          //then(false);
        }
      });
    },
    del: function(){
      var _this = this;
      _this.delDisabled = true;
      deleteDB(_this.bid, function(d){
        console.log(d)
        if(d.status == 202 || d.status == 404 || d.status == 200 || d.status == 500){
          delCouchdbUser(_this.bid, function(dt){
            console.log(dt);
            if(dt == true){
              
            }else{

            }
            delReplication(_this, function(_dt){
              _this.delDisabled = false;
              console.log(_dt);
            });
          });
        }else{
          _this.delDisabled = false;
        }
      });
    },
    check: function(){
      checkStCfg(this);
    }
  }
})