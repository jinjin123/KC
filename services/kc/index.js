'use strict';

//======引入依赖包======
var oc = require('./oc');
var log = require('./log');
var db = require('./db');
var kc = {};

//======同步订单函数=========
// 负责判断订单是否需要同步
// 同步之后将同步版本更新
kc.syncOrder = function (cdb, order) {

    // 判断是否满足同步条件
    if (!order.sync_status || order.sync_status !== 1) {
        if (order.data) {
            oc.getOrder(order.data.uuid, function (state) {
                if (state === false) {

                    // 如果不存在就创建订单
                    oc.postOrder(order.data, function (state) {
                        if (state) {
                            console.log('new order ok :' + order.data.uuid);
                            log.write('create order success', order.data.uuid);
                            cdb.merge(order._id, {sync_status:1,last_state:order.data.state}, function (err, res) {
                                if (err) {
                                    log.write('new_order_failed', err);
                                } else {
                                    log.write('new_order_ok', order._id);
                                }
                                return true;
                            })
                        } else {
                            // 不成功就等下次
                            console.log('create order failed :' + order.data.uuid);
                            log.write('create order failed', order.data.uuid);
                            return true;
                        }
                    });
                } else {

                    // 如果存在就修改订单
                    oc.patchOrder(order.data.uuid, order.data, function (state) {
                        if (state) {
                            console.log('update order ok :' + order.data.uuid);
                            log.write('update order success : ', order.data.uuid);
                            cdb.merge(order._id, {sync_status:1,last_state:order.data.state}, function (err, res) {
                                if (err) {
                                    log.write('update_order_failed', err);
                                } else {
                                    log.write('update_order_ok', order._id);
                                }
                                return true;
                            })
                        } else {
                            // 不成功就等下次
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
kc.writeOc = function (cdb, i, data) {
    global.sync_ing = 1;

    // 同步oc结束 1s后再次检查
    if (i >= data.length) {
        global.sync_ing = 0;
        setTimeout(function(){
            kc.chackOrder(cdb);
        }, 1000);

    // 同步未结束 等待
    } else {
        kc.syncOrder(cdb, data[i]);
        setTimeout(function(){
            kc.writeOc(cdb, ++i, data);
        }, 300);
    }

    return true;
};

// 订单同步检测程序
kc.chackOrder = function (cdb) {

    // 过滤取出未同步的数据
    cdb.view('kc2/sync_status', function (err, res) {
        if (err) {
            log.write('not sync err', err);
        } else {

            // 第一步拦截 等待同步中的订单完成
            if (!global.sync_ing) {
                var data = [];
                res.forEach(function (res) {
                    data.push(res);
                });
                kc.writeOc(cdb, 0, data)
            }
        }
    });

    return true;

};

//======主程序======
// 监听数据变化
// 有变化立即将状态改为未同步
kc.feed = function (cdb, dbname) {

    var feed = cdb.changes({ since: config.couchDb.since, include_docs: true });

    feed.filter = function(doc) {
        // req.query is the parameters from the _changes request and also feed.query_params.

        if (doc.sync_status === 1 && doc.data && doc._deleted !== true && doc.last_state != doc.data.state) {
            return true;
        } else {
            return false;
        }

    };

    feed.on('change', function(change) {

        var order = change.doc;

        // 重新初始化DB
        var cdb = db.re_init(dbname);
        cdb.merge(order._id, {sync_status:0,last_state:order.data.state}, function (err) {
            if (err) {
                console.log(err);
            }
        });

    });

    feed.on('error', function(er) {
        console.error('Since Follow always retries on errors, this must be serious');
        throw er;
    });

    feed.follow();
};

kc.start = function () {

    // 初始化DB
    config.couchDb.dbname.forEach(function (dbname) {
        var cdb = db.init(dbname);

        // 启动监听
        kc.feed(cdb, dbname);

        // 启动订单同步程序
        kc.chackOrder(cdb);

        console.log('listen: '+dbname);
    });

    console.log('kc service start');

};

module.exports = kc;