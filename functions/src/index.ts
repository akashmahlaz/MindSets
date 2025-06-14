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

