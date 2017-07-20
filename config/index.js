/**
 * config index file
 * author:zfm
 * date:2017-07-11
 */

'use strict';

var config = {};

var environment = process.env.NODE_ENV || 'development';
if (environment === 'production') {
    config =  require('./production');
} else {
    config = require('./development');
}

module.exports = config;