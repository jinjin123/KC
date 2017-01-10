/**
 * since we store config data into _local/store-configuration
 * loop back address is no longer appropriate as the substituded
 * configuration will be used by other program from other machine
 * so we need to get the real IP of CouchDB, when kc is started 
 * as 127.0.0.1 or localhost then use node to find out the real IP
 * of local host and use that address to access CouchDB so that to 
 * get the correct hostname setting in configuration
 * 
 * also there shoudl be an option to disable configuration updating
 * 
 * also it should be always possible to specify the correct hostname from command line 
 */
function getIP() {
    var pattern = /([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/,
        result = {},
        interfaces = require('os').networkInterfaces();
    for(var name in interfaces){
        var bindings = interfaces[name];
        for (var i in bindings) {
            var addr = bindings[i],
                m = addr.address.match(pattern);
            if(m){
                if(addr.address !== '127.0.0.1'){
                    if(result[name]) {
                        result[name].push(addr.address);
                    } else {
                        result[name] = [addr.address];
                    }
                }
            }
        }
    }
    console.log(result);
    return result;
}

function parseURL(url){
    function value(x, defv) {
        return x === undefined ? defv : (x === "" ? defv : x);
    }
    var reg = /^((http:\/\/)|(https:\/\/))([^\/:]+)(:[0-9]+)?(.*)/;
    var m = url.match(reg);
    if(m){
        return {
            protocol:value(m[1], "http://"),
            host:value(m[4], "127.0.0.1"),
            port:value(m[5], ":5984")
        }
    } else {
        return {
            protocol:"http://",
            host:"127.0.0.1",
            port:":5984"
        }        
    }
}
var urlComponents;
function getURL(url, path){
    if(!urlComponents) {
        urlComponents = parseURL(url);
        if (urlComponents.host === '127.0.0.1' || urlComponents.host === 'localhost') {
            var realIP = getIP();
            for(var intf in realIP) {
                urlComponents.host = realIP[intf][0];
                break;
            } 
        }        
    }
    return urlComponents.protocol + urlComponents.host + urlComponents.port + path;
}
function getKCURL(url, file){
    return getURL(url, "/orders/_design/kc/" + file);
}
function getRootURL(url, file){
    return getURL(url, "/" + file);
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

jsdom.env({
    url: getKCURL(baseurl, "index.html"),
    scripts: [],
    virtualConsole: jsdom.createVirtualConsole().sendTo(console),
    done: function (err, window) {
        function rewriteGet(oldp, newp) {
            console.log(oldp + ' ==>> ' + newp);
            app.get(newp, function (req, res) {
                var newurl = getKCURL(baseurl, oldp);
                request(newurl).pipe(res);
            });
        }
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
                    window.run(function(cfg, then){
                        configMQ(window.getMQConfig(cfg),function(err, httpResponse, body) {
                            if (err) {
                                console.error('upload failed:', err);
                            } else {
                                console.log('Config RabbitMQ successful!  Server responded with:', body);
                            }
                        });
                        if(typeof(then) === 'function') {
                            then();
                        }
                    });
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




