'use strict';

var request = require('request');

var oc = {};

var ocStatus = [
    'draft',
    'fulfillment',
    'wait_for_buyer_to_pay',
    'buyer_has_paid',
    'preparing',
    'ready',
    'delivering',
    'completed',
    'canceled',
    'returned'
];

oc.getUpdate = function (order) {

    var data = {};
    var feild = [
        'placed',
        'completed',
        'field_canceled',
        'field_delivering_time',
        'field_delivered',
        'field_payment_received',
        'field_returned',
        'state'
    ];
    feild.forEach(function (f) {
        var v = order[f];
        if (v !== undefined && v !== null && v !== '') {
            if (f === 'state') {
                v = oc.getState(v);
            }
            data[f] = v;
        }
    });

    return {data: {
        id: order.uuid,
        attributes: data
    }};

};

oc.getState = function (state_n) {
    if (ocStatus[state_n]) {
        return ocStatus[state_n];
    } else {
        return 'draft';
    }
};

//==========获取订单=============
oc.getOrder = function (auth, uuid, callback) {
    var reData = {state:false, errCode:500, message:"error", data:{}};
    var url = global.config.oc_host + '/jsonapi/commerce_order/default/' + uuid;
    var opts = {
        method: 'get',
        uri: url,
        json: true,
        headers:{'Content-Type':'application/json'},
        auth: auth
    };
    request(opts,function (err, response, body) {
        console.log('getOrder:'+response.statusCode);
        if (err) {
            reData.message = err;
        } else if(response.statusCode === 200) {
            if (!body.data) {
                reData.errCode = response.statusCode;
                reData.message = response.statusMessage;
            } else {
                reData.state   = true;
                reData.errCode = response.statusCode;
                reData.message = response.statusMessage;
                reData.data    = body;
            }
        } else {
            reData.errCode = response.statusCode;
            reData.message = response.statusMessage;
        }
        callback(reData.state, reData);
    })
};

//===========新建订单============
oc.postOrder = function (auth, order, callback) {
    var reData = {state:false, errCode:500, message:"error", data:{}};
    var url = global.config.oc_host + '/custom/entity/commerce_order';
    order.state = oc.getState(order.state);
    var opts = {
        method: 'post',
        uri: url,
        body: JSON.stringify(order),
        headers:{'Content-Type':'application/json'},
        auth: auth
    };
    console.log(opts.body);
    request(opts, function (err, response, body) {
        console.log('postOrder:'+response.statusCode);
        console.log(body);
        if (err) {
            reData.message = err;
        } else if (response.statusCode === 200) {
            body = JSON.parse(body);
            if (!body.data) {
                reData.errCode = response.statusCode;
                reData.message = response.statusMessage;
            } else {
                reData.state   = true;
                reData.errCode = response.statusCode;
                reData.message = response.statusMessage;
                reData.data    = body;
            }
        } else {
            reData.errCode = response.statusCode;
            reData.message = response.statusMessage;
        }
        callback(reData.state, reData);
    });
};

//===========更新订单=============
oc.patchOrder = function (auth, uuid, order, callback) {
    var reData = {state:false, errCode:500, message:"error", data:{}};
    var url = global.config.oc_host + '/jsonapi/commerce_order/default/' + uuid + '?_format=api_json';
    var data = oc.getUpdate(order);
    var opts = {
        method: 'patch',
        uri: url,
        body: JSON.stringify(data),
        headers:{'Content-Type':'application/vnd.api+json'},
        auth: auth
    };
    request(opts, function (err, response, body) {
        console.log('patchOrder:'+response.statusCode);
        console.log(body);
        if (err) {
            reData.message = err;
        } else if (response.statusCode === 200) {
            body = JSON.parse(body);
            if (!body.data) {
                reData.errCode = response.statusCode;
                reData.message = response.statusMessage;
            } else {
                reData.state   = true;
                reData.errCode = response.statusCode;
                reData.message = response.statusMessage;
                reData.data    = body;
            }
        } else {
            reData.errCode = response.statusCode;
            reData.message = response.statusMessage;
        }
        callback(reData.state, reData);
    });
};

module.exports = oc;