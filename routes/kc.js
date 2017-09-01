/**
 * kc config page
 * author:zfm
 * date 2017-07-11
 */

'use strict';

var express = require('express');
var kc      = express.Router();
var couchDB = require('../db');
var async   = require('async');
var service = require('../services');

/**
 * 门店配置同步关系
 */
kc.get('/store/config', function (req, res) {
    var data = {};
    data.title   = '门店配置';
    data.content = 'store-config';
    res.render('index-config', data);
});

/**
 * 数据库配置页面
 */
kc.get('/config', function(req, res) {
    var event = {
        /**
         * 获取数据库中的配置
         */
        getConf: function (next) {
            couchDB.getConf(function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        },

        /**
         * 获取couchDB中全部以b开头的数据库名
         */
        getCouchDBName: function (next) {
            couchDB.getAllDB(function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        },

        /**
         * b开头的是订单的库，将配置里面多余的去掉
         */
        saveConf: ['getConf', 'getCouchDBName', function (results, next) {
            var doc    = results['getConf'];
            var dbName = results['getCouchDBName'];

            for (var i in doc.data) {
                if (!dbName[doc.data[i].mc_id]) {
                    doc.data.splice(i, 1)
                }
            }

            couchDB.saveConf(doc, function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, doc.data);
                }
            });
        }],

        /**
         * 重启kc服务
         */
        restartKCService: ['saveConf', function (results, next) {
            var conf = results['saveConf'];
            var dbs = [];
            for (var i in conf) {
                dbs.push(conf[i].mc_id);
            }

            if (!global.kc_status) {
                setTimeout(function(){
                    service.kc.restart(dbs);
                }, 3000);
            }
            next(null, conf);
        }]

    };

    /**
     * 执行事件
     */
    async.auto(event, function (err, results) {
        if (err) {
            console.log(err);
        } else {
            var data = {};
            data.mc_list = results['saveConf'];
            data.title   = '服务配置';
            data.content = 'kc-config';
            res.render('index-config', data);
        }
    });

});

/**
 * 增加数据库事件提交
 */
kc.post('/config/add', function(req, res) {

    /**
     * 构建需要顺序完成的事件
     */
    var event = {
        /**
         * 1、获取数据库中已有的配置
         */
        getOldConf: function (next) {
            couchDB.getConf(function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        },

        /**
         * 2、获取最新传入的数据
         */
        getNewConf: function (next) {
            if (req.body) {
                next(null, req.body);
            } else {
                next('new conf get error');
            }
        },

        /**
         * 3、比较最新传过来的配置是否已经存在
         * 注：等待前两步的事件完成
         */
        ckConfData: ['getOldConf', 'getNewConf', function (results, next) {
            var oldConf  = results['getOldConf'].data;
            var newConf  = results['getNewConf'];
            var is_exist = false;
            for (var i in oldConf) {
                if (newConf.mc_id === oldConf[i].mc_id) {
                    is_exist = true;
                }
            }

            var rule = new RegExp("^b");
            if (!rule.test(newConf.mc_id) || is_exist) {
                next('db_exist');
            } else {
                next(null, newConf);
            }

        }],

        /**
         * 停止kc服务
         */
        stopKCService: ['ckConfData', function (results, next) {
            var oldConf  = results['getOldConf'].data;
            var dbs = [];

            for (var i in oldConf) {
                dbs.push(oldConf[i].mc_id);
            }
            service.kc.stop(dbs);
            next(null);
        }],

        /**
         * 创建数据库
         */
        createDatabase: ['stopKCService', function (results, next) {
            var oldConf = results['getOldConf'];
            var newConf = results['getNewConf'];
            var dbName  = newConf.mc_id;

            couchDB.dbAdd(dbName, function (err) {
                if (err) {
                    next(err);
                } else {
                    oldConf.data.push(newConf);
                    next(null, oldConf);
                }
            });

        }],

        /**
         * 创建数据库views
         */
        saveDatabaseView: ['createDatabase', function (results, next) {
            var newConf = results['getNewConf'];
            var dbName  = newConf.mc_id;

            couchDB.dbSaveViews(dbName, function (err) {
                if (err) {
                    next(err);
                } else {
                    next(null, newConf);
                }
            });

        }],

        /**
         * 创建用户
         */
        createUser: ['createDatabase', function (results, next) {
            var newConf = results['ckConfData'];
            var dbUser  = newConf.db_user;
            var dbPwd   = newConf.db_pwd;
            couchDB.userEdit(dbUser, dbPwd, [], function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });

        }],

        /**
         * 数据库授权
         */
        authUserToDB: ['createUser', function (results, next) {
            var newConf = results['ckConfData'];
            var dbName  = newConf.mc_id;
            var dbUser  = newConf.db_user;
            couchDB.dbAuthUser(dbUser, dbName, [], function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        }],

        /**
         * 4、保存配置数据
         */
        saveConfData: ['authUserToDB', 'saveDatabaseView', function (results, next) {
            var confData = results['createDatabase'];
            couchDB.saveConf(confData, function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        }]

    };


    /**
     * 执行事件
     */
    async.auto(event, function (err, results) {
        if (!err || err === 'db_exist') {
            res.redirect('/kc/config');
        } else {
            console.log()
        }
    });

});


/**
 * 修改数据库事件提交
 */
kc.post('/config/edit', function(req, res) {

    /**
     * 构建需要顺序完成的事件
     */
    var event = {

        /**
         * 1、获取最新传入的数据
         */
        getReqConf: function (next) {
            if (req.body) {
                next(null, req.body);
            } else {
                next('new conf get error');
            }
        },

        /**
         * 2、获取数据库配置
         */
        getDBData: function (next) {
            couchDB.getConf(function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        },

        /**
         * 停止kc服务
         */
        stopKCService: ['getDBData', function (results, next) {
            var oldConf  = results['getDBData'].data;
            var dbs = [];

            for (var i in oldConf) {
                dbs.push(oldConf[i].mc_id);
            }
            service.kc.stop(dbs);
            next(null);
        }],

        /**
         * 修改密码
         */
        changeUserPwd: ['getReqConf', 'getDBData', 'stopKCService', function (results, next) {
            var reqConf = results['getReqConf'];
            var dbUser  = reqConf.db_user;
            var dbPwd   = reqConf.db_pwd;
            couchDB.userEdit(dbUser, dbPwd, [], function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        }],

        /**
         * 3、保存配置数据
         */
        saveConfData: ['changeUserPwd', function (results, next) {
            var reqConf = results['getReqConf'];
            var doc     = results['getDBData'];

            for (var i in doc.data) {
                if (doc.data[i].mc_id === reqConf.mc_id ) {
                    doc.data[i].oc_user = reqConf.oc_user;
                    doc.data[i].oc_pwd  = reqConf.oc_pwd;
                    doc.data[i].db_user = reqConf.db_user;
                    doc.data[i].db_pwd  = reqConf.db_pwd;
                }
            }

            couchDB.saveConf(doc, function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        }]

    };


    /**
     * 执行事件
     */
    async.auto(event, function (err, results) {
        if (!err || err === 'db_exist') {
            res.redirect('/kc/config');
        } else {
            console.log()
        }
    });

});

/**
 * 清空数据
 * 等于删除新建
 */
kc.post('/config/data/delete', function (req, res) {
    /**
     * 构建需要顺序完成的事件
     */
    var event = {
        /**
         * 获取最新传入的数据
         */
        getReqConf: function (next) {
            if (req.body) {
                next(null, req.body);
            } else {
                next('new conf get error');
            }
        },

        /**
         * 获取数据库配置
         */
        getDBData: function (next) {
            couchDB.getConf(function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        },

        /**
         * 停止kc服务
         */
        stopKCService: ['getDBData', function (results, next) {
            var oldConf = results['getDBData'].data;
            var dbs = [];

            for (var i in oldConf) {
                dbs.push(oldConf[i].mc_id);
            }
            service.kc.stop(dbs);
            next(null);
        }],

        getAllData:['stopKCService', function (results, next) {
            var reqConf = results['getReqConf'];
            var dbName  = reqConf.mc_id;
            couchDB.get('/'+dbName+'/_design/kc/_view/timestamp', function (err, response, body) {
                if (err) {
                    next(err);
                } else {
                    next(null, body.rows);
                }
            });
        }],

        /**
         * 删除数据
         */
        deleteData: ['getAllData', function (results, next) {
            var allData = results['getAllData'];
            var reqConf = results['getReqConf'];
            var dbName  = reqConf.mc_id;
            var tmp = [];
            for (var i in allData) {
                var d = {
                    '_id': allData[i].id,
                    '_rev': allData[i].value.rev[0],
                    'data': {
                        'field_de_store_id': allData[i].value.field_de_store_id
                    },
                    '_deleted': true
                };
                tmp.push(d);
            }

            var cdb = couchDB.initDB(dbName);
            cdb.save(tmp, function (err, res) {
                next(err, res);
            });
        }]
    };

    /**
     * 执行事件
     */
    async.auto(event, function (err, results) {
        if (!err || err === 'db_exist') {
            res.redirect('/kc/config');
        } else {
            console.log(err)
        }
    });
});

/**
 * 删除数据库事件提交
 */
kc.post('/config/delete', function(req, res) {

    /**
     * 构建需要顺序完成的事件
     */
    var event = {
        /**
         * 1、获取最新传入的数据
         */
        getReqConf: function (next) {
            if (req.body) {
                next(null, req.body);
            } else {
                next('new conf get error');
            }
        },

        /**
         * 2、获取数据库配置
         */
        getDBData: function (next) {
            couchDB.getConf(function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        },

        /**
         * 停止kc服务
         */
        stopKCService: ['getDBData', function (results, next) {
            var oldConf  = results['getDBData'].data;
            var dbs = [];

            for (var i in oldConf) {
                dbs.push(oldConf[i].mc_id);
            }
            service.kc.stop(dbs);
            next(null);
        }],

        /**
         * 删除数据库
         */
        deleteDatabase: ['getReqConf', 'getDBData', 'stopKCService', function (results, next) {
            var reqConf = results['getReqConf'];
            var dbName  = reqConf.mc_id;
            couchDB.dbDelete(dbName, function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        }],

        /**
         * 删除用户
         */
        deleteUser: ['deleteDatabase', function (results, next) {
            var reqConf = results['getReqConf'];
            var dbUser  = reqConf.db_user;
            couchDB.userDelete(dbUser, function (err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null, response);
                }
            });
        }]

    };


    /**
     * 执行事件
     */
    async.auto(event, function (err, results) {
        if (!err || err === 'db_exist') {
            res.redirect('/kc/config');
        } else {
            console.log()
        }
    });

});


module.exports = kc;