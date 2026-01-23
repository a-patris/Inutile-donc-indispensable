import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let dbInstance: Firestore | null = null;

function getDb(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }

  // Ne s'exécute qu'au runtime, pas au build time
  if (typeof window !== "undefined") {
    throw new Error("Firebase Admin should only be used server-side");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

  dbInstance = getFirestore(app);
  return dbInstance;
}

// Proxy pour initialisation lazy
export const db = new Proxy({} as Firestore, {
  get(_target, prop, _receiver) {
    const db = getDb();
    const value = (db as any)[prop];
    if (typeof value === "function") {
      return value.bind(db);
    }
    return value;
  },
});
