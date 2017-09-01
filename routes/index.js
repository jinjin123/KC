/**
 * routers config file
 * author:zfm
 * date:2017-07-11
 */

'use strict';

var routers = {
    '/'      : require('./home'),
    '/users' : require('./users'),
    '/kc'    : require('./kc')
};

module.exports = routers;
