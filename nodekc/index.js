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
            port:value(m[5], "")
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
    if(file.match(/^\/code\/_design\/kc\//)){
        return getURL(url, file);
    }
    return getURL(url, "/code/_design/kc/" + file);
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
var run = require("./app");
//var jsdom = require("jsdom");
var baseurl;
if(!baseurl) {
    var args = process.argv.splice(2);  
    baseurl = (args && (args.length > 0)) ? args[0] : "http://127.0.0.1:5984ƒ";    
}

var cluster = require('cluster');
cluster.on('exit', function(w){
    console.log('KC %d died :(', w.id);
    if (w.process.exitCode === 100){
        //console.log('on exit then fork');
        cluster.fork();
    } else {
        //console.log('on exit then exit')
        process.exit(w.process.exitCode);
    }
});
if(cluster.isMaster) {
    //console.log('in master');
    cluster.setupMaster({
        args: [baseurl]
    });      
    cluster.fork();
} else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    process.on('uncaughtException', function(err) {
        console.log(err);
        process.exit(100);
    })
    //jsdom.env({
    //   url: getKCURL(baseurl, "index.html"),
    //    scripts: [],
    //    strictSSL:false,
    //    virtualConsole: jsdom.createVirtualConsole().sendTo(console),
    //    done: function (err, window) {
    //        if (!window){
    //            console.log('Can not load KC from ' + getKCURL(baseurl, "index.html"));
    //            process.exit(100);
    //        }
    //        win = window;
    //        window.WebSocket = require('ws');
    //        window.ssl_root_ca = require('ssl-root-cas');
            //window.nano = require('nano');
    //        window.cradle = require('cradle');
    //        window.request = require('request');
     //       window.Mustache = require('mustache');
            //window.cookie = require('cookie');
            setTimeout(function(){
                /*
                var tmp = window.getAllURLs(), i;
                for(i in tmp) {
                    var x = tmp[i];
                    if(x.type === 'anchor') {
                        console.log(">>> pipe " + x.name + " ==>> " + x.href);

                        app.get('/' + x.name, (function(href){
                            return function(req, res) {
                                console.log("href: " + href);
                                request(href).pipe(res);
                            }
                        })(x.href));                        
                    } else if (x.type === 'function'){
                        console.log(">>> resource " + x.name);
                        app.get('/' + x.name, function(req, res){
                            if(typeof(x.function) === 'function'){
                                x.function.call(app, req, res, tmp);
                            }
                        });
                    }
                }
                */
                app.get("/refresh", function(req, res){
                    console.log("refresh");
                    res.status(200).end();
                    process.exit(100);
                });                
                app.get("/exit", function(req, res){
                    console.log("exit");
                    res.status(200).end();
                    process.exit(0);
                });
                /*
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
                */
                app.listen(3000, function(){
                    run(1, function(cfg, then){
                        /*
                        configMQ(window.getMQConfig(cfg),function(err, httpResponse, body) {
                            if (err) {
                                console.error('upload failed:', err);
                            } else {
                                console.log('Config RabbitMQ successful!  Server responded with:', body);
                            }
                        });
                        */
                        if(typeof(then) === 'function') {
                            then();
                        }
                    });
                    console.log("running on port 3000") 
                });            
            }, 1000);
        //},
        //features: {
        //    FetchExternalResources: ["script", "frame", "iframe", "link", "img"],
        //    ProcessExternalResources: ["script"],
        //    SkipExternalResources: false
        //}
    //});

    var app = module.exports = express();

}




