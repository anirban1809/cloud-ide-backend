const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const admin = require("firebase-admin");
const serviceAccount = require("./test-1-c4091-firebase-adminsdk-3tk88-134efa2e0a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const port = 5050;

app.post('/newinstance', (req, res) => {
    console.log(req.body);
    db.collection('instances').doc('instance').set(req.body).then(()=>console.log('Data Written!'));
    res.sendStatus(200);
    res.end('');
});

app.get('/health',(req,res)=>{
    res.sendStatus(200);
});

app.listen(port, () => console.log("Server Running!"));
