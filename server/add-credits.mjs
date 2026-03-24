import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found at:', serviceAccountPath);
  
  // List files in root to help debug
  try {
    const rootFiles = fs.readdirSync(path.join(__dirname, '..'));
    console.log('\nFiles in root directory:');
    rootFiles.filter(f => f.includes('firebase') || f.includes('key')).forEach(f => console.log('  -', f));
  } catch (e) {
    // ignore
  }
  
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://launchly-c1c32-default-rtdb.firebaseio.com'
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

const db = admin.database();

async function findUserByName(displayName) {
  console.log(`🔍 Searching for user: "${displayName}"`);
  
  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();

    if (!users) {
      console.log('❌ No users found in database');
      return null;
    }

    // Search for user by display name
    for (const uid in users) {
      const userData = users[uid];
      const name = userData.displayName || '';
      
      if (name.toLowerCase().includes(displayName.toLowerCase())) {
        console.log(`✅ Found user!`);
        console.log(`   UID: ${uid}`);
        console.log(`   Display Name: ${userData.displayName}`);
        console.log(`   Email: ${userData.email}`);
        return { uid, userData };
      }
    }

    console.log('❌ User not found');
    return null;
  } catch (error) {
    console.error('Error searching for user:', error);
    throw error;
  }
}

async function addCreditsToUser(uid, amount) {
  console.log(`\n💰 Adding ${amount} credits to user ${uid}`);

  try {
    const creditsRef = db.ref(`users/${uid}/credits`);
    const snapshot = await creditsRef.once('value');
    const currentCredits = snapshot.val();

    if (!currentCredits) {
      console.log('❌ User credits record not found');
      return false;
    }

    const newBalance = (currentCredits.currentCredits || 0) + amount;
    
    // Update credits
    await creditsRef.update({
      currentCredits: newBalance,
      lastUpdated: new Date().toISOString()
    });

    console.log(`✅ Credits added successfully!`);
    console.log(`   Previous Balance: ${currentCredits.currentCredits || 0}`);
    console.log(`   Added: ${amount}`);
    console.log(`   New Balance: ${newBalance}`);
    
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}

async function main() {
  try {
    const userName = 'karim moh';
    const creditsToAdd = 500;

    console.log('📊 Adding Credits Script');
    console.log('========================\n');

    // Find user
    const result = await findUserByName(userName);
    
    if (!result) {
      console.log('\n❌ Operation cancelled - user not found');
      process.exit(1);
    }

    const { uid } = result;

    // Confirm and add credits
    console.log(`\n📝 Confirming operation:`);
    console.log(`   User: ${result.userData.displayName}`);
    console.log(`   Credits to add: ${creditsToAdd}`);

    const success = await addCreditsToUser(uid, creditsToAdd);

    if (success) {
      console.log(`\n✨ Operation completed successfully!`);
    } else {
      console.log(`\n❌ Operation failed`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
