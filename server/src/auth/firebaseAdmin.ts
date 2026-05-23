import admin from "firebase-admin";
import { env } from "../config/env.js";

export function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      })
    });
  } else {
    admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  }

  return admin;
}
