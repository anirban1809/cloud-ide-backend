const app = require('express')();
var bodyParser = require('body-parser')
const cors = require('cors');
const mongodb = require('mongodb').MongoClient;
const { exec } = require("child_process");
app.use(cors());
app.use(bodyParser());


function getport(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const getDateTime = () =>{
    const date = new Date();
    return {
        date : date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear(),
        time: date.getHours()  + ':' + date.getMinutes()+ ':' + date.getSeconds(),
        millis: date.getTime() 
    }
}

const log = (event,message,logcollection) =>{
    const datetime = getDateTime();
    const logdata = {
        id: 'LOG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: datetime.date,
        time: datetime.time,
        millis: datetime.millis,
        event:event,
        message:message
    }
    insertdata(logdata,logcollection,(err,data)=>{
        if(!err){
            console.log('Event Logged!');
        }else{
            console.log(err);
        }
    });
}

const createvm = (name,base,callback) => {
    console.log('CREATING VM')
    
    let basepath = '';
    if (base == 'Ubuntu 18.04 LTS'){
        basepath = './baseimages/ubuntu18.04';
    }else if(base == 'Ubuntu 16.04 LTS'){
        basepath = './baseimages/ubuntu16.04';
    } else if (base == 'Alpine') {
        basepath = './baseimages/alpine3.7';
    }
    
    cmd = 'docker build -t ' + name.toLowerCase()+':latest'+' '+basepath;
    exec(cmd, (error, stdout, stderr)=>{
        if (error) {
            console.log(error);
            callback(0);
        }
        if (stderr) {
            console.log(stderr);
            callback(0);
        }
        console.log(stdout);
        callback(1);
    });
}

const startvm = (name,port,callback) => {
    cmd = 'docker run --rm -idp '+port+':22 --name '+name.toLowerCase()+' '+ name.toLowerCase()+':latest';
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(error);
            callback(0);
        }
        if (stderr) {
            console.log(stderr);
            callback(0);
        }
        console.log(stdout);
        callback(1);        
    });
}



const insertdata = (data,collection,callback) =>{
    mongodb.connect('mongodb://127.0.0.1:27017/', (err, client) => {
        if (!err) {
            const db = client.db('cloud');
            db.collection(collection).insertOne(data, (err) => {
                console.log(data);
                callback(err,data);
            })
        } else {
            console.log("Error!!" + err);
        }
    })
}

app.post('/createbucket',(req,res)=>{
    req.body.bucketid = req.body.instanceid = 'B-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    insertdata(req.body,'resources.buckets',(err)=>{
        if(!err){
            exec('mkdir ./Storage/Buckets/'+req.body.bucketid);
            console.log("Bucket Created Successfully!");
            res.sendStatus(200);
        }else{
            res.sendStatus(500);
        }
    });
});

app.post('/deletebucket',(req,res)=>{
    
    req.body.buckets.forEach((bucket)=>{
        exec('rm -r ./Storage/Buckets/'+bucket);
        deletebucket(bucket, (status) => {
            if (status) {
                console.log('Deleting Bucket ' + bucket);
            }
        });
    });
    res.send('Deleteing Buckets');
})

app.post('/createfolder',(req,res)=>{
    exec('mkdir ./Storage/Buckets/'+req.body.path);
    res.send('Folder Created!')
});

app.post('/deleteitems',(req,res)=>{
    req.body.items.forEach((item)=>{
        exec('rm -r ./Storage/Buckets/'+req.body.path+'/\''+item+'\'',(stdout,stderr)=>{
            if(stderr){
                console.log(stderr);
            }else{
                console.log(stdout);
            }
        });
    });
    res.send('Selected Items are being deleted!');
});

const deletebucket = (query,callback) =>{
    mongodb.connect('mongodb://127.0.0.1:27017/', (err, client) => {
        if (!err) {
            const db = client.db('cloud');
            db.collection('resources.buckets').deleteOne({ "bucketid": query }).then(() => callback(1));
        }
    });
}

const deletedata = (query,collection,callback) => {
    mongodb.connect('mongodb://127.0.0.1:27017/',(err,client)=>{
        if(!err){
            const db = client.db('cloud');
            db.collection(collection).deleteOne({"instanceid" : query.instanceid}).then(()=>callback(1));
        }
    });
}

const setprivateip = (id) =>{
    getdata('resources.instances',id,(data)=>{
        let cmd = 'docker inspect --format \'{{.NetworkSettings.Networks.net1.IPAddress}}\' '+data.instancename.toLowerCase();
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log(error);
            }
            if (stderr) {
                console.log(stderr);

            }
            console.log(stdout);
            updateprivateip({instanceid:id},stdout);

        });
    });
}

const updateprivateip = (id, value) => {
    mongodb.connect('mongodb://127.0.0.1:27017', (err, client) => {
        if (!err) {
            const db = client.db('cloud');
            db.collection('resources.instances').updateOne(id, { $set: {'privateip':value} }, (err, doc) => {
                if (err) {
                    console.log('Failed to update!');
                }
            });
        }
    });
}

const getdata = (collection,id,callback) =>{
    let data = [];
    let singledata;
    if(id==undefined){
        mongodb.connect('mongodb://127.0.0.1:27017/', (err, client) => {
            if (!err) {
                const db = client.db('cloud');
                const cursor = db.collection(collection).find();
                cursor.forEach((doc, err) => {
                    data.push(doc);
                }).then(() => callback(data));
            }
        });
    }else{
        mongodb.connect('mongodb://127.0.0.1:27017/', (err, client) => {
            if (!err) {
                const db = client.db('cloud');
                const cursor = db.collection(collection).find({"instanceid":id});
                cursor.forEach((doc, err) => {
                    singledata = doc;
                }).then(() => callback(singledata));
            }
        });
    }
    
}

app.post('/createvm',(req,res)=>{
    const collection = 'resources.instances';
    req.body.instanceid = 'I-' + Math.random().toString(36).substr(2, 9);
    req.body.port = getport(10000,20000);
    insertdata(req.body,collection,(err,data)=>{
        if(!err){
            createvm(req.body.instancename,req.body.baseimage,(status)=>{
                if(status==1){
                    console.log('VM CREATED! STARTING!')
                    updatevmstate({instanceid : req.body.instanceid},1);
                    startvm(req.body.instancename,req.body.port,(status)=>{
                        if(status==1){
                            console.log('VM RUNNING!')
                            updatevmstate({ instanceid : req.body.instanceid }, 2);
                            setprivateip(data.instanceid);

                        }
                    })
                }
            });
            res.sendStatus(200);
        }else{
            console.log("Error:"+err);
        }
    });
});

const updatevmstate = (id,statevalue) =>{
    mongodb.connect('mongodb://127.0.0.1:27017',(err,client)=>{
        if(!err){
            const db = client.db('cloud');
            db.collection('resources.instances').updateOne(id, { $set: { "state": statevalue}},(err,doc)=>{
                if(err){
                    console.log('Failed to update!');
                }
            });
        }
    });
}



const stopvm = (id,callback) => {
    getdata('resources.instances',id,(data)=>{
        let cmd1 = 'docker commit ' + data.instancename.toLowerCase() + ' '+data.instancename.toLowerCase()+':latest';
        let cmd2 = 'docker stop '+data.instancename.toLowerCase();
        if(data.state == 2){
            updatevmstate({ instanceid: id }, 3);
            log('EVT_VM_STOPPING', 'VM instance ' + data.instancename + ' is being stopped', 'resources.instances.logs');
            exec(cmd1, (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    callback(0);
                }
                if (stderr) {
                    console.log(stderr);
                    callback(0);
                }
                console.log(stdout);
                exec(cmd2, (error, stdout, stderr) => {
                    if (error) {
                        console.log(error);
                        callback(0);
                    }
                    if (stderr) {
                        console.log(stderr);
                        callback(0);
                    }
                    console.log(stdout);
                    updatevmstate({ instanceid: id }, 4);
                    log('EVT_VM_STOPPED', 'VM instance ' + data.instancename + ' is has been stopped', 'resources.instances.logs');
                    callback(1);
                });
            });
        }else{
            callback(1);
        }
    });
}

app.get('/stopvm',(req,res)=>{
    stopvm(req.query.id,(status)=>{
        if(status==1){
            res.sendStatus(200);
            res.end();
        }else if(status==0){
            res.sendStatus(400);
            res.end();
        }
    });
});

app.get('/startvm',(req,res)=>{
    getdata('resources.instances',req.query.id,(data)=>{
        console.log(data);
        updatevmstate({instanceid:req.query.id},1);       
        startvm(data.instancename,data.port,(status)=>{
            if (status == 1) {
                updatevmstate({ instanceid: req.query.id }, 2);
                
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        });
    });
});

app.post('/startvmmultiple',(req,res)=>{
    console.log(req.body);
    let failed = false;

    if(req.body.instances == []){
        console.log('Empty');
        res.sendStatus(200);
    }else{
        req.body.instances.forEach((instance) => {
            getdata('resources.instances', instance, (data) => {
                if (data.state == 4) {
                    updatevmstate({ instanceid: data.instanceid }, 1);
                    
                    console.log(data.instanceid + " starting");
                    log('EVT_VM_STARTING', 'VM instance ' + data.instancename + ' is being started','resources.instances.logs');
                    startvm(data.instancename, data.port, (status) => {
                        if (status = 1) {
                            updatevmstate({ instanceid: data.instanceid }, 2);
                            setprivateip(data.instanceid);
                            log('EVT_VM_STARTED', 'VM instance ' + data.instancename + ' is Running', 'resources.instances.logs');
                            console.log(data.instanceid+" started");
                        }else{
                            failed = true;
                        }
                    });
                } else {
                    console.log('Ignored')
                }
            })
        });
        
    }
    res.sendStatus(200);
});

const deletevm = (id,callback) =>{
    getdata('resources.instances',id,(data)=>{
        let cmd = 'docker rmi '+data.instancename.toLowerCase();
        stopvm(data.instanceid,(status)=>{
            if(status==1){
                updatevmstate({ instanceid: data.instanceid }, 5);
                log('EVT_VM_DELETING','VM instance '+data.instancename+' is being deleted','resources.instances.logs');
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.log(error);
                        callback(0);
                    }
                    if (stderr) {
                        console.log(stderr);
                        callback(0);
                    }
                    console.log(stdout);
                    deletedata(data, 'resources.instances', (status) => {
                        if (status == 1) {
                            console.log('');
                            log('EVT_VM_DELETED', 'VM instance ' + data.instancename + ' has been deleted', 'resources.instances.logs');
                        }
                    });
                    callback(1);

                });
            }
        });

    });
}

app.get('/deletevm',(req,res)=>{
    deletevm(req.query.id,(status)=>{
        if(status==1){
            console.log('Deleted');
        }
    })
    res.send('Deleted!');
})

app.post('/deletevmmultiple',(req,res)=>{
    req.body.instances.forEach((instance)=>{
        deletevm(instance, (status) => {
            if (status == 1) {
                console.log('Deleted '+instance);
            }
        })
    });

    res.send('Deleting Instances!');

})

app.post('/stopvmmultiple',(req,res)=>{
    console.log(req.body)
    req.body.instances.forEach((instance)=>{
        stopvm(instance,(status)=>{
            if(status==1){
                updateprivateip({ instanceid: instance }, '<inactive>');
                console.log('Stopped '+instance);
            }
        });
    });

    res.send('Stopped');
});

const getlogs = (logcollection,callback) =>{
    let data = [];
    mongodb.connect('mongodb://127.0.0.1:27017/', (err, client) => {
        if (!err) {
            const db = client.db('cloud');
            const cursor = db.collection(logcollection).find().sort({millis:-1});
            cursor.forEach((doc, err) => {
                data.push(doc);
            }).then(() => callback(data));
        }
    });

}

app.get('/getlogs',(req,res)=>{
    getlogs(req.query.collection,(data)=>{
        res.json(data);
    });
});

app.get('/getData',(req,res)=>{
    getdata(req.query.collection,req.query.id,(data)=>{
        res.json(data);
    });
});
/*
Build new vm:
1. Base Image
2. CPU and Memory
2. Networking
3. Attach Volumes
*/ 

/*
Instance DB:
collction => db.resource.instance

object => {
    user_resourceid, => provided by request
    instanceid, => autogenerated
    instancename, => provided by request
    baseimage, => ''
    vcpucount, => ''
    memory, => ''
    vpc, => ''
    firewall, => ''
    privateip, => generated by server
    publicport, => autogenerated
    state : [0:provisioning, 1:starting,2:running,3:stopping,4:stopped]
    creationdate, => generated
    lastlaunch => generated
}

*/

/*
Run VM:
1. VM id
2. Attach Specified Volumes
3. Attach Specified Network Configurations
*/

/*
Stop VM:
1. VM id
*/

app.listen(8888,()=>console.log('Server Running!'));