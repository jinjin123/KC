/**
 * development config file
 * author:zfm
 * date:2017-07-11
 */

'use strict';

var devConfig = {
    port:3000,
    admin_user:'admin',
    admin_pwd:'123456',
    oc_host:'http://newoc.sparkpad-dev.com:5000',
    database: {
        driver:'couchDB',
        host:'http://localhost',
        port:5984,
        since:'now',
        name:'kc',
        user:'admin',
        pwd:'admin'
    },
    sync_auth:{},
    log_path:'./logs/'
};

module.exports = devConfig;