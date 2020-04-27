const express = require("express");
const app = express();
const cors = require('cors');


const port = 8001;

app.use(cors());

app.get("/startvm", (req, res) => {
  
  exec("docker run -id ubuntu:latest ", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`${stdout}`);
    res.json(stdout);
  });
  
});

app.get("/stopvm", (req, res) => {

  exec("docker stop $(docker ps -q) ", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      res.json(error.message);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      res.json(stderr);
      return;
    }
    console.log(`${stdout}`);
    res.json(stdout);
  });

});

const { exec } = require("child_process");

const instancelist = [{
  id: "vm-5E91D89B",
  name:"TensorFlow_Server",
  state:"Running"

},

  {
    id: "vm-5E01D89B",
    name: "New_Ubuntu",
    state: "Running"

  }

]

app.get('/getinstancelist',(req,res)=>{
  res.send(instancelist);
});

app.get('/random', (req, res) => {
  exec(req.query.command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      res.json(stdout);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      res.json(stderr);
      return;
    }
    res.json(stdout)
  });
});

app.post('/createinstance',(req,res)=>{
  console.log(req.body);
  res.json(req.body);
});

app.listen(port, () => {
  console.log("Server running!");
});

