
// use event hooks to provide a callback to execute when data are available: 
var app = require('express')();


app.get('/',(req,res)=>{
    var spawn = require('child_process').spawn,
    ls = spawn('apt-get',['update']);
    ls.stdout.on('data',(data)=>{
        console.log(data.toString());
    });
});

app.listen(8000,()=>console.log('Server Running!'));