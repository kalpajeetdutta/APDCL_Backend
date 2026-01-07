const admin = require('firebase-admin');

// 1. Check if we have the JSON file (for local development)
let serviceAccount;

if (process.env.FIREBASE_PRIVATE_KEY) {
  // ✅ PROD: We are on Render, use Environment Variables
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Fix the newline characters in the private key
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
} else {
  // 💻 LOCAL: We are on localhost, use the file
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.error("❌ Error: serviceAccountKey.json not found and Env Vars not set.");
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;