'use strict';

//======引入依赖包======
var oc = require('./oc');
var log = require('./log');
var db = require('./db');
var kc = {};
global.sync_ing = {};

//======同步订单函数=========
// 负责判断订单是否需要同步
// 同步之后将同步版本更新
kc.syncOrder = function (dbname, order) {

    // 判断是否满足同步条件
    if (!order.sync_status || order.sync_status !== 1) {
        if (order.data) {
            oc.getOrder(order.data.uuid, function (state) {
                if (state === false) {
                    // 如果不存在就创建订单
                    oc.postOrder(order.data, function (state) {
                        var cdb = db.re_init(dbname);
                        if (state) {
                            cdb.merge(order._id, {sync_status:1,last_state:order.data.state,sync_failed_num:0}, function (err, res) {
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
                            log.write('create order failed', order.data.uuid);
                            return true;
                        }
                    });
                } else {

                    // 如果存在就修改订单
                    oc.patchOrder(order.data.uuid, order.data, function (state) {
                        var cdb = db.re_init(dbname);
                        if (state) {
                            console.log('update order ok :' + order.data.uuid);
                            log.write('update order success : ', order.data.uuid);
                            cdb.merge(order._id, {sync_status:1,last_state:order.data.state,sync_failed_num:0}, function (err, res) {
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
                            log.write('update order failed :', order.data.uuid);
                            return true;
                        }
                    });
                }
            });
        } else {
            console.log('sync order failed');
            log.write('sync order failed', ' not have uuid');
            return true;
        }

    }

};

// 循环写入OC 等待500ms 再写入下一条
kc.writeOc = function (cdb, dbname, i, data) {

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

    return true;
};

// 订单同步检测程序
kc.chackOrder = function (cdb, dbname) {

    // 过滤取出未同步的数据
    cdb.view('kc2/sync_status', function (err, res) {
        if (err) {
            console.log('sync view err');
        } else {

            // 第一步拦截 等待同步中的订单完成
            if (!global.sync_ing[dbname]) {
                var data = [];
                res.forEach(function (res) {
                    data.push(res);
                });
                kc.writeOc(cdb, dbname, 0, data)
            }
        }
    });

    return true;

};

//======主程序======
// 监听数据变化
// 有变化立即将状态改为未同步
kc.feed = function (cdb, dbname) {

    var feed = cdb.changes({ since: global.config.couchDb.since, include_docs: true });

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
        throw er;
    });

    feed.follow();
};

kc.start = function () {

    // 初始化DB
    global.config.couchDb.dbname.forEach(function (dbname) {
        var cdb = db.init(dbname);

        // 启动监听
        kc.feed(cdb, dbname);

        // 启动订单同步程序
        kc.chackOrder(cdb, dbname);

        console.log('listen: '+dbname);
    });

    console.log('kc service start');

};

module.exports = kc;