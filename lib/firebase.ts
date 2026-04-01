import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if there's no pre-existing app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const requestForToken = async () => {
  if (typeof window !== "undefined") {
    try {
      const messaging = getMessaging(app);
      // Reemplaza con tu llave VAPID (Voluntary Application Server Identification) de Firebase
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      if (currentToken) {
        console.log("Token FCM actual:", currentToken);
        // FIXME: Envía este token a tu backend para actualizar el usuario (token_dispositivo)
        return currentToken;
      } else {
        console.log("No se pudo obtener un token de registro.");
      }
    } catch (err) {
      console.error("Hubo un error al recuperar el token.", err);
    }
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (typeof window !== "undefined") {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
};

export { app };
