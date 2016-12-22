## Sample data from orders
    {
        "_id":"CN75702320161202gg760",  //id of the doc in CouchDB
        "_rev":"2-2268b743209ac608a2bd13de4fdedc8a", //
        "order": {
            "discountList":[],
            "orderInfo": {
                "addresslat":"0",
                "orderstatus":4,
                "orderthirdno":"",
                "freight":0,
                "orderpostno":"",
                "storename":"沃尔玛",
                "addorderoperator":"002",
                "storeid":"CN757023",
                "userid":"CN757023",
                "payamount":650,
                "mealstime":"2016-12-02 11:30:49",
                "companyid":"0",
                "needdelivery":0,
                "istakeout":0,
                "identifyingcode":"g760",
                "orderplatformsource":"stpos",
                "nums":1,
                "receivetime":"2016-12-02 11:30:49",
                "addresslng":"0",
                "ext":"",
                "ordertradeno":"",
                "orderid":"CN75702320161202gg760",
                "userphone":"02038771727",
                "paytime":"2016-12-02 11:30:49",
                "dicountamount":0,
                "ordersource":"stpos",
                "invoicetitle":"",
                "totalamount":650,
                "deliverytime":"2016-12-02 11:30:49",
                "addtime":"2016-12-02 11:30:47",
                "companyname":"",
                "paystatus":1,
                "isneedinvoice":0,
                "deliveryway":0,
                "booktime":"2016-12-02 11:30:47",
                "paytype":"cash",
                "username":"沃尔玛"
            },
            "productList": [ {
                "ismeat":0,
                "productid":75770000,
                "salesarea":"",
                "totalprice":650,
                "productimg":"",
                "productname":"看气质肠粉",
                "productnum":1,
                "productprice":650
            } ]
        },
        "sync_status":null,
        "oc_msg":null,
        "timestamp":"2016/12/09 13:16:10"
    }

    git clone git://github.com/couchapp/example.git
    cd example

Install with 
    
    couchapp push . http://localhost:5984/example

or (if you have security turned on)

    couchapp push . http://adminname:adminpass@localhost:5984/example
  
You can also create this app by running

    couchapp generate example && cd example
    couchapp push . http://localhost:5984/example

Deprecated: *couchapp generate proto && cd proto*


## Todo

* factor CouchApp Commonjs to jquery.couch.require.js
* use $.couch.app in app.js

## License

Apache 2.0
