const spawn = require('child_process').spawn;

function run(){
    console.log('restart kc ...');
    const kc = spawn(process.argv.splice(0,1)[0], ['./worker.js'].concat(process.argv.splice(2)));
    kc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    kc.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
    kc.on('error', (err)=>{
        console.log(err);
    });
    kc.on('exit', (code) => {
        console.log('exit ' + code);
    });
    kc.on('close', (code) => {
        console.log('close ' + code);
        setTimeout(function(){
            run();  
        }, 5000);
    });
}

run();
