import { Component, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from "@angular/material/input";
import { MatOption, MatSelect } from "@angular/material/select";

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormField,
    MatSelect,
    MatOption
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss'],
})
export class MainLayout {
  direction = signal<'ltr' | 'rtl'>('ltr');
  language = signal<'fr' | 'ar'>('fr');

  private router = inject(Router);

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  changeLanguage(lang: 'fr' | 'ar') {
    this.language.set(lang);
    this.direction.set(lang === 'ar' ? 'rtl' : 'ltr');
    // optionally save to localStorage
    localStorage.setItem('app-lang', lang);
    localStorage.setItem('app-dir', this.direction());
  }

  constructor() {
    // Load saved language if any
    const savedLang = localStorage.getItem('app-lang') as 'fr' | 'ar' | null;
    if (savedLang) {
      this.changeLanguage(savedLang);
    }
  }
}
