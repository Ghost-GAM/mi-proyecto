import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: "AIzaSyAHRGfXa9egMTzT2dIdHRcLWYypq3S7bZA",
  authDomain: "programacionweb-1234.firebaseapp.com",
  projectId: "programacionweb-1234",
  storageBucket: "programacionweb-1234.firebasestorage.app",
  messagingSenderId: "76751324566",
  appId: "1:76751324566:web:c59d4bb5accee5d14b89b7"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};