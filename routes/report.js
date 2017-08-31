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

module.exports = report;