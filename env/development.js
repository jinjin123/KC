'use strict';

var devConfig = {
    port:3001,
    couchDb: {
        host:'http://localhost',
        port:5984,
        dbname:['order'],
        dbuser:'admin',
        dbpwd:'admin',
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