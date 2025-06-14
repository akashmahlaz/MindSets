/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { StreamChat } from 'stream-chat';


admin.initializeApp();
const serverClient = StreamChat.getInstance('egq2n55kb4yn', '7ynbrpypd7mvnksac5q7dn2vjmawhs6dvn6vtz8qbzjajgc4zjb2as77msqseack');

export const generateStreamToken = functions.https.onRequest(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No auth header' });
      return;
    }

    const idToken = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const token = serverClient.createToken(userId);
    res.json({ token });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// Create Stream Chat user server-side
export const createStreamChatUser = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { uid, displayName, email, photoURL } = req.body;
    
    if (!uid) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Check if user already exists
    try {
      const existingUsers = await serverClient.queryUsers({ id: uid });
      if (existingUsers.users.length > 0) {
        res.json({ message: 'User already exists', uid });
        return;
      }
    } catch (error) {
      console.log('Error checking existing user, proceeding with creation:', error);
    }

    // Create user in Stream Chat
    await serverClient.upsertUser({
      id: uid,
      name: displayName || email || 'Anonymous',
      image: photoURL || `https://getstream.io/random_png/?name=${displayName || email || uid}`,
    });

    console.log('Stream Chat user created:', uid);
    res.json({ message: 'User created successfully', uid });
  } catch (error) {
    console.error('Error creating Stream Chat user:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// Sync all Firestore users with Stream Chat
export const syncStreamChatUsers = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Get all users from Firestore
    const usersSnapshot = await admin.firestore().collection('users').get();
    const syncResults = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      try {
        // Check if user already exists in Stream Chat
        const existingUsers = await serverClient.queryUsers({ id: userData.uid });
        if (existingUsers.users.length === 0) {
          // Create user in Stream Chat
          await serverClient.upsertUser({
            id: userData.uid,
            name: userData.displayName || userData.email || 'Anonymous',
            image: userData.photoURL || `https://getstream.io/random_png/?name=${userData.displayName || userData.email || userData.uid}`,
          });
          syncResults.push({ uid: userData.uid, status: 'created' });
        } else {
          syncResults.push({ uid: userData.uid, status: 'already_exists' });
        }
      } catch (error) {
        console.error(`Error syncing user ${userData.uid}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        syncResults.push({ uid: userData.uid, status: 'error', error: errorMessage });
      }
    }

    console.log('User sync completed:', syncResults);
    res.json({ message: 'Sync completed', results: syncResults });
  } catch (error) {
    console.error('Error syncing users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

