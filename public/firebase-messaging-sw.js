importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCB4SeuFgwPW9hvxGf4kmxjnHqMGCoFc",
  authDomain: "messaging-fb1bb.firebaseapp.com",
  projectId: "messaging-fb1bb",
  storageBucket: "messaging-fb1bb.firebasestorage.app",
  messagingSenderId: "473724402435",
  appId: "1:473724402435:web:85f5b5dae977f47e44",
  measurementId: "G-0FQCBLYZTN"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 