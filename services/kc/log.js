'use strict';

var fs = require('fs');

var log = {};

log.write = function (type, massge) {
    var txt = type + JSON.stringify(massge);
    var log = txt + '\r\n';
    var log_file = global.config.log_path + 'logs.log';
    fs.appendFile(log_file, log, function () {
        fs.stat(log_file, function (err, stats) {
            if(stats.size > 1024*1024*10) {
                var new_path = global.config.log_path + Date.parse(new Date()) + '.log';
                fs.rename(log_file, new_path);
            }
        })
    });
};

module.exports = log;