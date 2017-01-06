function getURL(url, deft){
    function value(x, defv) {
        return x === undefined ? defv : (x === "" ? defv : x);
    }
    var reg = /^((http:\/\/)|(https:\/\/))([^\/:]+)(:[0-9]+)?(.*)/;
    var m = url.match(reg);
    if(m){
        var server = value(m[1], deft.protocol)
                    +value(m[4], deft.host)
                    +value(m[5], deft.port)
                    +value(m[6], deft.path);
        return server;
    } else {
        return deft.protocol + deft.host + deft.port + deft.path;
    }
}
function getKCURL(url, file){
    return getURL(url, {
        protocol:"http://",
        host:"127.0.0.1",
        port:":5984",
        path:"/orders/_design/kc/" + file
    });
}
function getRootURL(url, file){
    return getURL(url, {
        protocol:"http://",
        host:"127.0.0.1",
        port:":5984",
        path:"/" + file
    });
}



var URL = require('url');
var request = require('request');
var express = require("express");
var jsdom = require("jsdom");
var args = process.argv.splice(2);  
var baseurl = (args && (args.length > 0)) ? args[0] : "";
var win;
console.log(getKCURL(baseurl, "index.html"));
console.log('--------------------------------');
jsdom.env({
    url: getKCURL(baseurl, "index.html"),
    scripts: [],
    virtualConsole: jsdom.createVirtualConsole().sendTo(console),
    done: function (err, window) {
        win = window;
        window.WebSocket = require('ws');
        window.setTimeout(function(){
            rewriteGet("kc.config.json", "/config");
            var tmp = win.getAllURLs(), i;
            for(i in tmp) {
                var x = tmp[i];
                rewriteGet(x.href, '/' + x.name);
            }
            tmp = win.getMQConfig(win.CONFIG);
            request.post({
                url:tmp.url, 
                body: JSON.stringify(tmp.data), 
                headers:{
                    "Content-Type":"application/json"
                }
            }, function(err, httpResponse, body) {
                if (err) {
                    console.error('upload failed:', err);
                } else {
                    console.log('Config RabbitMQ successful!  Server responded with:', body);
                }
            });
            app.get("/retry", function(req, res) {
                win.retryFailed(win.CONFIG, function (err) {
                    if (err) {
                        res.write("" + err);
                    } else {
                        res.write("ok");
                    }
                    res.end();
                });
                res.write("Please wait ...");
            });
            app.get("/order", function(req, res) {
                var newurl = win.getOCQueryURL(win.CONFIG, URL.parse(req.url, true).orderid);
                request(newurl).pipe(res);
            });

            app.listen(3000, function(){
                console.log("running on port 3000") 
            });            
        }, 1000);
    },
    features: {
        FetchExternalResources: ["script", "frame", "iframe", "link", "img"],
        ProcessExternalResources: ["script"],
        SkipExternalResources: false
    }
});


var app = module.exports = express();
function rewriteGet(oldp, newp) {
    console.log(oldp + ' ==>> ' + newp);
    app.get(newp, function (req, res) {
        var newurl = getKCURL(baseurl, oldp);
        request(newurl).pipe(res);
    });
}

//rewriteGet("_view/status?startkey=[1,0]&endkey=[1,100]&include_docs=true", "/success");
//rewriteGet("_view/status?startkey=[2,4]&endkey=[99999,100]&include_docs=true", "/failed");
//rewriteGet("_view/status?startkey=[0,4]&endkey=[0,100]&include_docs=true", "/waiting");


