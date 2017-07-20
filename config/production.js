/**
 * production config file
 * author:zfm
 * date:2017-07-11
 */

'use strict';

var proConfig = {
    port:3000,
    admin_user:'admin',
    admin_pwd:'123456',
    oc_host:'http://newoc.sparkpad-dev.com:5000',
    database: {
        driver:'couchDB',
        host:'https://couchdb-cloud.sparkpad-dev.com',
        port:443,
        since:'now',
        name:'kc',
        user:'sye',
        pwd:'sye123456'
    },
    sync_auth:{},
    log_path:'./logs/'
};

module.exports = proConfig;