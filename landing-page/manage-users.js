/**
 * S2R Tool - User Whitelist Management Script
 *
 * Use this script to add/remove/list authorized users in Firestore.
 *
 * Prerequisites:
 *   npm install firebase-admin
 *
 * Setup:
 *   1. Go to Firebase Console > Project Settings > Service Accounts
 *   2. Click "Generate new private key"
 *   3. Save as "service-account-key.json" in this directory
 *
 * Usage:
 *   node manage-users.js add user@gmail.com "User Name"
 *   node manage-users.js remove user@gmail.com
 *   node manage-users.js list
 *   node manage-users.js add-batch emails.txt
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: service-account-key.json not found!');
    console.error('Download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();
const COLLECTION = 'allowed_users';

async function addUser(email, name = '') {
    email = email.toLowerCase().trim();
    await db.collection(COLLECTION).doc(email).set({
        email: email,
        name: name,
        addedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Added: ${email}${name ? ` (${name})` : ''}`);
}

async function removeUser(email) {
    email = email.toLowerCase().trim();
    await db.collection(COLLECTION).doc(email).delete();
    console.log(`Removed: ${email}`);
}

async function listUsers() {
    const snapshot = await db.collection(COLLECTION).get();
    if (snapshot.empty) {
        console.log('No users in whitelist.');
        return;
    }
    console.log(`\nWhitelisted users (${snapshot.size}):`);
    console.log('─'.repeat(50));
    snapshot.forEach(doc => {
        const data = doc.data();
        const added = data.addedAt ? data.addedAt.toDate().toISOString().split('T')[0] : 'N/A';
        console.log(`  ${data.email}  ${data.name || ''}  (added: ${added})`);
    });
    console.log('');
}

async function addBatch(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const lines = fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));

    const batch = db.batch();
    let count = 0;

    for (const line of lines) {
        // Support format: email or email,name
        const parts = line.split(',').map(p => p.trim());
        const email = parts[0].toLowerCase();
        const name = parts[1] || '';

        if (!email.includes('@')) {
            console.warn(`Skipping invalid email: ${email}`);
            continue;
        }

        const ref = db.collection(COLLECTION).doc(email);
        batch.set(ref, {
            email: email,
            name: name,
            addedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
    }

    await batch.commit();
    console.log(`Added ${count} users from ${filePath}`);
}

// CLI handler
const [,, command, ...args] = process.argv;

(async () => {
    try {
        switch (command) {
            case 'add':
                if (!args[0]) {
                    console.error('Usage: node manage-users.js add <email> [name]');
                    process.exit(1);
                }
                await addUser(args[0], args.slice(1).join(' '));
                break;

            case 'remove':
                if (!args[0]) {
                    console.error('Usage: node manage-users.js remove <email>');
                    process.exit(1);
                }
                await removeUser(args[0]);
                break;

            case 'list':
                await listUsers();
                break;

            case 'add-batch':
                if (!args[0]) {
                    console.error('Usage: node manage-users.js add-batch <emails.txt>');
                    console.error('File format: one email per line, or email,name');
                    process.exit(1);
                }
                await addBatch(args[0]);
                break;

            default:
                console.log('S2R Tool - User Whitelist Manager');
                console.log('');
                console.log('Commands:');
                console.log('  add <email> [name]     Add a user to whitelist');
                console.log('  remove <email>         Remove a user from whitelist');
                console.log('  list                   List all whitelisted users');
                console.log('  add-batch <file.txt>   Add users from file (email per line)');
                break;
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    process.exit(0);
})();
