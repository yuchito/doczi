import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly API_BASE_URL = environment.apiBaseUrl;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly emailControl = computed(() => this.loginForm.controls.email);
  readonly passwordControl = computed(() => this.loginForm.controls.password);

  login() {
    if (this.loginForm.invalid) {
      this.snackBar.open('Veuillez remplir le formulaire correctement', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.http.post<{ access_token: string }>(`${this.API_BASE_URL}/auth/login`, { email, password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.access_token);
        this.snackBar.open('Connexion réussie !', 'Fermer', { duration: 3000 });
        this.router.navigate(['/wizard']);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Échec de la connexion.', 'Fermer', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }
}
