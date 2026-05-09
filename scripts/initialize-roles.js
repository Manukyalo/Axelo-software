/**
 * RBAC Initialization Script
 * 
 * This script assigns the 'admin' role to the primary administrator account.
 * Run this ONCE to bootstrap your RBAC system.
 * 
 * Usage:
 * 1. Download your service account key from Firebase Console (Project Settings -> Service Accounts).
 * 2. Save it as 'service-account.json' in this directory.
 * 3. Run: node scripts/initialize-roles.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const ADMIN_EMAILS = [
  'admin@easternvacations.com',
  'manu@easternvacations.com',
  'reservations@easternvacations.com'
];

async function initializeRoles() {
  console.log('🚀 Starting RBAC Initialization...');

  for (const email of ADMIN_EMAILS) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
      
      // Also update Firestore users collection for UI visibility
      await admin.firestore().collection('users').doc(user.uid).set({
        role: 'admin',
        email: email,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`✅ Successfully promoted ${email} to admin.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.warn(`⚠️ User ${email} not found in Firebase Auth. Skipping.`);
      } else {
        console.error(`❌ Error promoting ${email}:`, error.message);
      }
    }
  }

  console.log('🏁 Initialization complete. You can now delete your service-account.json file.');
  process.exit(0);
}

initializeRoles();
