import { NextResponse } from 'next/server';

export async function GET() {
  const serviceWorkerContent = `
    importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

    firebase.initializeApp({
      apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
      authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
      projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
      storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
      messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
      appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
      measurementId: "${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png',
        badge: '/icon.png',
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  `;

  return new NextResponse(serviceWorkerContent, {
    headers: {
      'Content-Type': 'application/javascript',
    },
  });
}
