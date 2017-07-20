'use strict';

//======引入依赖包======
var oc = require('./oc');
var db = require('./db');
var kc = {};
global.sync_ing = {};
global.kc_status = true;

//======同步订单函数=========
// 负责判断订单是否需要同步
// 同步之后将同步版本更新
kc.syncOrder = function (dbname, order) {

    // 判断是否满足同步条件
    if (!order.sync_status || order.sync_status !== 1) {
        if (order.data) {
            var last_state =  order.data.state;
            var sync_auth = global.config.sync_auth[dbname];
            var auth = {
                'user': sync_auth.oc_user,
                'pass': sync_auth.oc_pwd,
                'sendImmediately': true
            };
            oc.getOrder(auth, order.data.uuid, function (state) {
                if (state === false) {
                    // 如果不存在就创建订单
                    oc.postOrder(auth, order.data, function (state) {
                        var cdb = db.re_init(dbname);
                        if (state) {
                            cdb.merge(order._id, {sync_status:1,last_state:last_state,sync_failed_num:0}, function (err, res) {
                                if (err) {
                                    console.log(err);
                                    console.log('new_order_merge_failed:'+order.data.uuid);
                                } else {
                                    console.log('new_order_merge_ok:'+order.data.uuid);
                                }
                                return true;
                            })
                        } else {
                            // 不成功就等下次
                            var sync_failed_num = order.sync_failed_num ? order.sync_failed_num : 0;
                            ++sync_failed_num;
                            cdb.merge(order._id, {sync_failed_num:sync_failed_num}, function (err, res) {
                                if (err) {
                                    console.log(err);
                                    console.log('sync_failed_num_add_failed:'+order.data.uuid);
                                } else {
                                    console.log('sync_failed_num_add_ok:'+order.data.uuid);
                                }
                            });
                            console.log('create order failed :' + order.data.uuid);
                            return true;
                        }
                    });
                } else {

                    // 如果存在就修改订单
                    oc.patchOrder(auth, order.data.uuid, order.data, function (state) {
                        var cdb = db.re_init(dbname);
                        if (state) {
                            console.log('update order ok :' + order.data.uuid);
                            cdb.merge(order._id, {sync_status:1,last_state:last_state,sync_failed_num:0}, function (err, res) {
                                if (err) {
                                    console.log(err);
                                    console.log('update_order_merge_failed:'+order.data.uuid);
                                } else {
                                    console.log('update_order_merge_ok:', order.data.uuid);
                                }
                                return true;
                            })
                        } else {
                            // 不成功就等下次
                            var sync_failed_num = order.sync_failed_num ? order.sync_failed_num : 0;
                            ++sync_failed_num;
                            cdb.merge(order._id, {sync_failed_num:sync_failed_num}, function (err, res) {
                                if (err) {
                                    console.log(err);
                                    console.log('sync_failed_num_add_failed:'+order.data.uuid);
                                } else {
                                    console.log('sync_failed_num_add_ok:'+order.data.uuid);
                                }
                            });
                            console.log('update order failed :'+order.data.uuid);
                            return true;
                        }
                    });
                }
            });
        } else {
            console.log('sync order failed');
            return true;
        }

    }

};

// 循环写入OC 等待500ms 再写入下一条
kc.writeOc = function (cdb, dbname, i, data) {

    if (global.kc_status === true) {

        // 同步oc结束 1s后再次检查
        if (i >= data.length) {
            global.sync_ing[dbname] = 0;
            setTimeout(function(){
                var date = new Date();
                console.log(date+ ' kc heartbeat to '+dbname);
                kc.chackOrder(cdb, dbname);
            }, 1000);
            // 同步未结束 等待
        } else {
            global.sync_ing[dbname] = 1;
            kc.syncOrder(dbname, data[i]);
            setTimeout(function(){
                kc.writeOc(cdb, dbname, ++i, data);
            }, 300);
        }
    }


    return true;
};

// 订单同步检测程序
kc.chackOrder = function (cdb, dbname) {

    if (global.kc_status === true) {

        // 过滤取出未同步的数据
        cdb.view('kc2/sync_status', function (err, res) {
            if (err) {
                console.log('sync view err');
                console.log(err);
                setTimeout(function(){
                    var date = new Date();
                    console.log(date+ ' kc restart to '+dbname);
                    var cdb = db.re_init(dbname);
                    kc.chackOrder(cdb, dbname);
                }, 10000);
            } else {

                // 第一步拦截 等待同步中的订单完成
                if (!global.sync_ing[dbname]) {
                    var data = [], len;
                    if (res.length > 100) {
                        len = 1000;
                    } else {
                        len = res.length;
                    }
                    for (var i = 0;i < len;i++) {
                        if (res[i]) {
                            data.push(res[i].value);
                        }
                    }
                    kc.writeOc(cdb, dbname, 0, data)
                }
            }
        });
    }

    return true;

};

//======主程序======
// 监听数据变化
// 有变化立即将状态改为未同步
kc.feed = function (cdb, dbname) {

    var feed = cdb.changes({ since: global.config.database.since, include_docs: true });

    feed.filter = function(doc) {
        // req.query is the parameters from the _changes request and also feed.query_params.

        if (doc.sync_status === 1 && doc.data && doc._deleted !== true && doc.last_state !== doc.data.state) {
            return true;
        } else {
            return false;
        }

    };

    feed.on('change', function(change) {

        var order = change.doc;

        // 重新初始化DB
        var cdb = db.re_init(dbname);
        if (order.last_state !== order.data.state) {
            cdb.merge(order._id, {sync_status:0,last_state:order.data.state,sync_failed_num:0}, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    kc.chackOrder(cdb, dbname)
                }
            });
        }


    });

    feed.on('error', function(er) {
        console.error('Since Follow always retries on errors, this must be serious');
    });

    feed.follow();
};

kc.start = function () {

    // 初始化DB
    db.get('/kc/config', function (err, response, body) {
        if (err) {
            console.log('kc start error');
            console.log(err);
        } else {
            if (body.error) {
                var doc = {
                    data:[]
                };
                db.put('/kc/config', doc, function (err) {
                    if (err) {
                        console.log('kc start error');
                        console.log(err);
                    } else {
                        kc.start();
                    }
                });
            } else {
                body.data.forEach(function (f) {
                    // 获取数据库名
                    var dbname = f.mc_id;
                    global.config.sync_auth[dbname] = f;
                    var cdb = db.init(dbname);

                    // 启动监听
                    kc.feed(cdb, dbname);

                    // 启动订单同步程序
                    kc.chackOrder(cdb, dbname);

                    console.log('listen: '+dbname);

                    console.log('kc start');
                });
            }
        }
    });

};

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