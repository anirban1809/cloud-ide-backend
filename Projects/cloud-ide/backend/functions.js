const app = require('express')();
const fileupload = require('express-fileupload');
app.use(fileupload());
const test = require('./tester');
const cors = require('cors');
app.use(cors());

const {exec} = require('child_process');

app.get('/runcode',(req,res)=>{
    let cmd = 'python3 ./Storage/Functions/'+req.query.filename;
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
        res.status(200).send(stdout);
    });
})

app.post('/uploadcode',(req,res)=>{
    const file = req.files.code;
    file.mv('./Storage/Functions/'+file.name,(err,result)=>{
        if(!err){
            res.send('File Uploaded');
        }else{
            console.log(err);
            res.send({error:err})
        }
    })
});

app.post('/uploadfiles', (req, res) => {
    const files = req.files.file;
    console.log(files[0]);
    if(files.length==undefined){
        files.mv('./Storage/Buckets/' + req.query.path + '/' + files.name, (err, result) => {
            if (!err) {
                console.log(' fileuploaded!')
            } else {
                console.err(err);
            }
        })
    }else{
        for (var i = 0; i < files.length; i++) {
            files[i].mv('./Storage/Buckets/' + req.query.path + '/' + files[i].name, (err, result) => {
                if (!err) {
                    console.log(' fileuploaded!')
                } else {
                    console.err(err);
                }
            })
        }
    }

    console.log(req.files.file);

    res.sendStatus(200);
});

app.get('/numbertest',(req,res)=>{
    res.send(`the number is ${test.data(req.query.number)}`);
});

app.listen(8889,()=>console.log('Function Server Running'));