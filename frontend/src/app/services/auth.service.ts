import { Injectable } from '@angular/core';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, provider } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async loginWithGoogle(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}