const express = require('express');
const app = express();
const dir = require('directory-structure-json');
const fs = require('fs');
var bodyParser = require('body-parser')
const cors = require('cors');
const mongodb = require('mongodb').MongoClient;
const { exec } = require("child_process");
app.use(cors());
app.use(bodyParser());


app.get('/structure',(req,res)=>{
    dir.getStructure(fs,req.query.path,(err,struc)=>{
        if(!err){
            res.send(struc);
        }else{
            res.send('Invalid');
        }
    })
});






app.listen(8890, () => console.log(`listening on http://localhost:8889`));
