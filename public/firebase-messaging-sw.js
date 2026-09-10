// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCS3W7-ShjxyNhf5L7Kc1aS1TEQH5zko-E",
  authDomain: "fanfam-79fe8.firebaseapp.com",
  projectId: "fanfam-79fe8",
  storageBucket: "fanfam-79fe8.firebasestorage.app",
  messagingSenderId: "888108804051",
  appId: "1:888108804051:web:9021996fc5663526c27126",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo.png", // Update with your app's icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
