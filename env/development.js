'use strict';

var devConfig = {
    port:3000,
    couchDb: {
        host:'http://couchdb-cloud.sparkpad-dev.com',
        port:80,
        dbname:['b726','b734'],
        dbuser:'sye',
        dbpwd:'sye123456',
        since:'now',
        heartbeat:30 * 1000,
        inactivity_ms:86400 * 1000
    },
    oc:{
        host:'http://newoc.sparkpad-dev.com:5000',
        auth: {
            'user': 'admin',
            'pass': 'admin',
            'sendImmediately': true
        }
    },
    log_path:'./logs/'
};

module.exports = devConfig;