'use strict';

//======引入依赖包======
var oc = require('./oc');
var db = require('./db');
var couchDB = require('../../db');
var async   = require('async');
var kc = {};
global.sync_ing = {};
global.kc_status = true;

/**
 * 同步订单
 * @param dbName
 * @param doc
 */
kc.syncOrder = function (dbName, doc) {
    var event = {

        /**
         * 检查订单是否满足同步要求
         */
        ckOrderIsCanSync: function (next) {
            if ((!doc.sync_status || doc.sync_status !== 1) && doc.data) {
                next(null);
            } else {
                next('sync order failed');
            }
        },

        /**
         * 获取oc授权账户信息
         */
        getOcAuth: function (next) {
            var sync_auth = global.config.sync_auth[dbName];
            var auth = {
                'user': sync_auth.oc_user,
                'pass': sync_auth.oc_pwd,
                'sendImmediately': true
            };
            next(null, auth)
        },

        /**
         * 重oc服务获取订单
         */
        getOrderInfoInOc: ['ckOrderIsCanSync', 'getOcAuth', function (results, next) {
            var auth = results['getOcAuth'];
            oc.getOrder(auth, doc._id, function (state) {
                next(null, state);
            });
        }],

        /**
         * 向oc同步订单
         */
        syncOrderInOc: ['getOrderInfoInOc', function (results, next) {
            var auth = results['getOcAuth'];
            var OrderState = results['getOrderInfoInOc'];
            if (OrderState) {
                oc.patchOrder(auth, doc._id, doc.data, function (state) {
                    console.log('');
                    next(null, state);
                });
            } else {
                oc.postOrder(auth, doc.data, function (state) {
                    next(null, state);
                })
            }
        }],

        /**
         * 获取本地couchDB订单最新版本
         */
        getCouchDBRev: ['syncOrderInOc', function (results, next) {
            var cdb = db.re_init(dbName);
            cdb.get(doc._id, function (err, doc) {
                next(err, doc)
            });
        }],

        /**
         * 修改本地couchDB的状态
         */
        changeCouchDBState: ['getCouchDBRev', function (results, next) {
            var syncState = results['syncOrderInOc'];
            var orderRev = results['getCouchDBRev'];
            var last_state =  doc.data.state;
            var cdb = db.re_init(dbName);
            if (syncState) {
                orderRev.sync_status = 1;
                orderRev.last_state = last_state;
                orderRev.sync_failed_num = 0;
                console.log('sync order to oc ok:' + doc._id);
                cdb.save(orderRev._id, orderRev._rev, orderRev, function (err, res) {
                    next(err, res);
                })
            } else {
                console.log('sync order to oc failed:' + doc._id);
                var sync_failed_num = doc.sync_failed_num ? doc.sync_failed_num : 0;
                ++sync_failed_num;
                orderRev.sync_failed_num = sync_failed_num;
                cdb.save(orderRev._id, orderRev._rev, orderRev, function (err, res) {
                    next(err, res);
                })
            }
        }]
    };

    /**
     * 执行事件
     */
    async.auto(event, function (err) {
        if (err) {
            console.log('couchDB merge order failed:'+doc._id);
            console.log(err);
        } else {
            console.log('couchDB merge order ok:'+doc._id);
        }
    });
};

/**
 * 循环调用同步函数 等待300ms
 * @param cdb
 * @param dbName
 * @param i
 * @param data
 * @returns {boolean}
 */
kc.writeOc = function (cdb, dbName, i, data) {

    if (global.kc_status === true) {

        /**
         * 同步oc结束 1s后再次检查
         */
        if (i >= data.length) {
            global.sync_ing[dbName] = 0;
            setTimeout(function(){
                kc.chackOrder(cdb, dbName);
            }, 1000);

            /**
             * 同步未结束 等待
             */
        } else {
            global.sync_ing[dbName] = 1;
            kc.syncOrder(dbName, data[i]);
            setTimeout(function(){
                kc.writeOc(cdb, dbName, ++i, data);
            }, 300);
        }
    }
};

/**
 * 订单同步检测程序
 * @param cdb
 * @param dbName
 * @returns {boolean}
 */
kc.chackOrder = function (cdb, dbName) {

    var event = {

        /**
         * 检查目前服务是否可用
         */
        serviceStatusCk: function (next) {
            next(null, global.kc_status)
        },

        /**
         * 读取当前未同步的订单数据
         */
        getNotSyncOrderData: ['serviceStatusCk', function (results, next) {
            var serviceStatus = results['serviceStatusCk'];
            if (serviceStatus) {
                cdb.view('kc/sync_status', {limit:1000}, function (err, res) {
                    next(err, res);
                })
            } else {
                next('service status failed');
            }

        }],

        /**
         * 调用函数写入订单（异步，不等待数据写入完成）
         */
        writeOrderForOc: ['getNotSyncOrderData', function (results, next) {
            var orderList = results['getNotSyncOrderData'];
            if (!global.sync_ing[dbName]) {
                var data = [];
                for (var i = 0;i < orderList.length;i++) {
                    if (orderList[i]) {
                        data.push(orderList[i].value);
                    }
                }
                kc.writeOc(cdb, dbName, 0, data)
            }
            next(null)
        }]
    };

    /**
     * 执行事件
     */
    async.auto(event, function (err) {
        if (err) {
            setTimeout(function(){
                var date = new Date();
                console.log(date+ ' kc restart to '+dbName);
                var cdb = db.re_init(dbName);
                kc.chackOrder(cdb, dbName);
            }, 10000);
        } else {
            var date = new Date();
            console.log(date+ ' kc heartbeat to '+dbName);
        }
    });

    return true;

};

/**
 * 监听数据变化
 * 有变化立即将状态改为未同步
 * @param cdb
 * @param dbName
 */
kc.feed = function (cdb, dbName) {

    var feed = cdb.changes({ since: global.config.database.since, include_docs: true });

    feed.filter = function(doc) {

        return doc.sync_status === 1 && doc.data && doc._deleted !== true && doc.last_state !== doc.data.state;

    };

    feed.on('change', function(change) {

        var order = change.doc;

        /**
         * 重新初始化DB
         */
        var cdb = db.re_init(dbName);
        if (order.last_state !== order.data.state) {
            cdb.merge(order._id, {sync_status:0,last_state:order.data.state,sync_failed_num:0}, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    kc.chackOrder(cdb, dbName)
                }
            });
        }


    });

    feed.on('error', function(er) {
        console.error('Since Follow always retries on errors, this must be serious');
        console.error(er);
    });

    feed.follow();
};

/**
 * 获取互相冲突的数据
 * @param cdb
 * @param data
 * @param index
 * @param result
 * @param then
 */
kc.mapConflictsRes = function (cdb, data, index, result, then) {

    if((data.length > 0) && (index < data[0].key.length)) {

        cdb.get(data[0].id, data[0].key[index], function (err, dt) {
            if(!err){
                result.push(dt);
            }
            kc.mapConflictsRes(cdb, data, index + 1, result, then);
        });
    } else {
        then(result);
    }
};

/**
 * 冲突处理函数
 */
kc.conflicts = function (cdb, dbName) {

    var event = {

        /**
         * 获取含有冲突数据版本
         */
        getConflictsRev: function (next) {
            cdb.view('kc/conflicts', {limit:1} , function (err, data) {
                next(err, data.rows)
            })
        },

        /**
         * 获取互相冲突的文档内容
         */
        getMapConflictsRes: ['getConflictsRev', function (results, next) {
            var conflictsRev = results['getConflictsRev'];
            kc.mapConflictsRes(cdb, conflictsRev, 0, [], function (res) {
                next(null, res);
            } )
        }],

        /**
         * 通过选举得出保留者和删除者
         */
        separateConflictsRes: ['getMapConflictsRes', function (results, next) {
            var data = results['getMapConflictsRes'];
            var irrelevant = data.filter(function (doc) {
                return !((doc.data) && (doc.data.order_items) && (typeof(doc.data) === 'object'));
            });

            //We are interested in order data only
            data = data.filter(function(doc) {
                return ((doc.data) && (doc.data.order_items) && (typeof(doc.data) === 'object'));
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
            var res =  {
                'keep': data.slice(0,1),
                'remove': data.slice(1),
                'irrelevant': irrelevant
            };

            next(null, res);
        }],

        /**
         * 将优胜者保留
         */
        saveKeepDoc: ['separateConflictsRes', function (results, next) {
            var data = results['separateConflictsRes'];
            var keep = data.keep.concat(data.irrelevant);
            var cdb = db.re_init(dbName);
            if (keep[0]) {
                cdb.save(keep[0]._id, keep[0]._rev, keep[0], function (err, res) {
                    next(err, res);
                });
            } else {
                next('keep doc null');
            }
        }],

        /**
         * 将淘汰者删除
         */
        deleteRemoveDoc: ['saveKeepDoc', function (results, next) {
            var data = results['separateConflictsRes'];
            var remove = data.remove.concat(data.irrelevant);
            var cdb = db.re_init(dbName);
            var test = {};
            if (remove[0]) {
                test._deleted = true;
                test._id = remove[0]._id;
                test._rev = remove[0]._rev;
                cdb.save(remove._id, remove._rev, test, function (err, res) {
                    next(err, res);
                });
            } else {
                next('remove doc null');
            }

        }]

    };

    /**
     * 执行事件
     */
    async.auto(event, function (err, results) {
        if (err) {
            console.log(err);
            setTimeout(function(){
                kc.conflicts(cdb,dbName);
            }, 1000);
        } else {
            console.log(results);
            console.log('order conflicts ok:');
            setTimeout(function(){
                kc.conflicts(cdb,dbName);
            }, 1000);
        }
    });
};

/**
 * kc启动程序
 */
kc.start = function () {
    var event = {

        /**
         * 获取配置信息
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
         * 第一次保存默认配置
         */
        saveConf: ['getConf', function (results, next) {
            var conf = results['getConf'];
            if (conf.error) {
                var doc = {
                    data:[]
                };
                couchDB.saveConf(doc, function (err) {
                    if (err) {
                        next(err);
                    } else {
                        next(null, doc);
                    }
                });
            } else {
                next(null, conf);
            }
        }],

        /**
         * 启动KC服务
         */
        startKcService: ['saveConf', function (results, next) {
            var conf = results['saveConf'];
            for (var i=0; i<=conf.data.length; i++) {
                if (i>=conf.data.length) {
                    next(null);
                } else {
                    var dbName = conf.data[i].mc_id;
                    global.config.sync_auth[dbName] = conf.data[i];
                    var cdb = db.init(dbName);
                    // 启动监听
                    kc.feed(cdb, dbName);

                    // 启动订单同步程序
                    kc.chackOrder(cdb, dbName);

                    // 启动冲突处理
                    kc.conflicts(cdb, dbName);

                    console.log('listen: '+dbName);
                }
            }
        }]
    };

    /**
     * 执行事件
     */
    async.auto(event, function (err) {
        if (err) {
            console.log('kc service start failed');
            console.log(err);
            setTimeout(function(){
                kc.start();
            }, 10000);
        } else {
            console.log('kc start');
        }
    });
};

/**
 * 停止服务
 * @param dbs
 */
kc.stop = function (dbs) {
    global.kc_status = false;

    dbs.forEach(function (dbname) {
        var cdb = db.init(dbname);
        var feed = cdb.changes({ since: global.config.database.since, include_docs: true });
        console.log(dbname);
        feed.stop()
    });

    console.log('kc stop');

};

/**
 * 重启服务
 * @param dbs
 */
kc.restart = function (dbs) {

    global.kc_status = true;
    dbs.forEach(function (dbname) {

        // 获取数据库名
        var cdb = db.init(dbname);

        // 启动监听
        kc.feed(cdb, dbname);

        // 启动订单同步程序
        kc.chackOrder(cdb, dbname);

        console.log('listen: '+dbname);
    });

    console.log('kc restart');
};

module.exports = kc;