const admin = require("firebase-admin");
const serviceAccount = require("./test-1-c4091-firebase-adminsdk-3tk88-134efa2e0a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


