// Quick script to approve a counsellor for testing
// Run with: node approve-counsellor.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCH10RRTE-UO37WCNI3zQ1nYyME1KXfYcQ",
  authDomain: "mental-health-f7b7f.firebaseapp.com",
  projectId: "mental-health-f7b7f",
  storageBucket: "mental-health-f7b7f.firebasestorage.app",
  messagingSenderId: "1057785713043",
  appId: "1:1057785713043:web:adeb0d3e95b6c3da127ad3",
  measurementId: "G-LJGDPLEZKS",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function approveCounsellors() {
  try {
    // Get all counsellors
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'counsellor'));
    const snapshot = await getDocs(q);
    
    console.log(`Found ${snapshot.size} counsellors`);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      console.log(`\nCounsellor: ${data.displayName}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Current approval: ${data.isApproved}`);
      console.log(`  Current verification: ${data.verificationStatus}`);
      
      // Approve the counsellor
      const userRef = doc(db, 'users', docSnap.id);
      await updateDoc(userRef, {
        isApproved: true,
        verificationStatus: 'verified',
      });
      
      console.log(`  ✅ Approved!`);
    }
    
    console.log('\n✅ All counsellors approved!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

approveCounsellors();
