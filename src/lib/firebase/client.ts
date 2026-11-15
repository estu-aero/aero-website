import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Anahtarlar girilmemişse (ör. yerel önizleme) sayfalar çökmesin diye yer tutucu değerlerle başlatılır;
// bu durumda Firebase istekleri başarısız olur ve sayfalar boş durumlarını gösterir.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(
    isFirebaseConfigured
      ? firebaseConfig
      : { ...firebaseConfig, apiKey: 'missing-api-key', projectId: 'missing-project' }
  );
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;
