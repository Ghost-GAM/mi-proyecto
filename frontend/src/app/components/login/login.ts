import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async loginWithGoogle() {
    const user = await this.authService.loginWithGoogle();
    if (user) {
      this.router.navigate(['/dashboard']);
    }
  }
}