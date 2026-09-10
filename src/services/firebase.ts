import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

const getMessagingInstance = async () => {
  const supported = await isSupported();

  if (!supported) {
    console.warn("Firebase Messaging is not supported in this browser.");

    return null;
  }

  return getMessaging(firebaseApp);
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!("Notification" in window)) {
      return null;
    }

    if (Notification.permission !== "granted") {
      return null;
    }

    const messaging = await getMessagingInstance();

    if (!messaging) {
      return null;
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    });

    if (!currentToken) {
      console.warn("No FCM registration token is available.");

      return null;
    }

    return currentToken;
  } catch (error) {
    console.error("Unable to retrieve FCM token:", error);

    return null;
  }
};

export const onMessageListener = async (): Promise<MessagePayload | null> => {
  const messaging = await getMessagingInstance();

  if (!messaging) {
    return null;
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export default firebaseApp;
