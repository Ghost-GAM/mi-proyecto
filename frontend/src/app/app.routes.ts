import { Routes } from '@angular/router';
import { CarpinteriaComponent } from './components/carpinteria/carpinteria';

export const routes: Routes = [
  { path: '', component: CarpinteriaComponent },
  { path: '**', redirectTo: '' }
];