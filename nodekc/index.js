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

function configMQ(settings, then) {
    request.post({
        url:settings.url, 
        body: JSON.stringify(settings.data), 
        headers:{
            "Content-Type":"application/json"
        }
    }, then);
}


var URL = require('url');
var request = require('request');
var express = require("express");
var jsdom = require("jsdom");
var args = process.argv.splice(2);  
var baseurl = (args && (args.length > 0)) ? args[0] : "";

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
            var tmp = window.getAllURLs(), i;
            for(i in tmp) {
                var x = tmp[i];
                if(x.type === 'anchor') {
                    rewriteGet(x.href, '/' + x.name);
                } else if (x.type === 'function'){
                    app.get('/' + x.name, function(req, res){
                        if(typeof(x.function) === 'function'){
                            x.function.call(app, req, res, tmp);
                        }
                    });
                }
            }
            app.get("/config-store-mq", function(req, res){
                configMQ(window.getMQConfig(win.CONFIG),function(err, httpResponse, body) {
                    if (err) {
                        res.write('upload failed:', err);
                        console.error('upload failed:', err);
                    } else {
                        res.write('Config RabbitMQ successful!  Server responded with:', body);
                        console.log('Config RabbitMQ successful!  Server responded with:', body);
                    }
                });
            });
            app.get("/config-data-center-mq", function(req, res){
                configMQ(window.getDCMQConfig(win.CONFIG), function(err, httpResponse, body) {
                    if (err) {
                        res.write('upload failed:', err);
                        console.error('upload failed:', err);
                    } else {
                        res.write('Config RabbitMQ successful!  Server responded with:', body);
                        console.log('Config RabbitMQ successful!  Server responded with:', body);
                    }
                });
            });
            app.listen(3000, function(){
                setTimeout(function(){
                    window.run();
                }, 5000);
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



