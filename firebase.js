// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./theamzresearch-3dbf0-firebase-adminsdk-fbsvc-b1f315d4fb.json'); // secure file

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
module.exports = { admin, db };
