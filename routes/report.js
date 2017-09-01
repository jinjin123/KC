/**
 * kc config page
 * author:zfm
 * date 2017-07-11
 */

'use strict';

var express = require('express');
var report  = express.Router();
var couchDB = require('../db');
var async   = require('async');

/**
 * 数据库配置页面
 */
report.get('/config', function(req, res) {
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
            data.content = 'report-config';
            res.render('index-config', data);
        }
    });

});


/**
 * 修改数据库事件提交
 */
report.post('/config/edit', function(req, res) {

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

module.exports = report;