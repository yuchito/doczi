import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout';
import { MainLayout } from './layouts/main-layout';
import { Login } from './pages/auth/login/login';

export const appRoutes: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login },
      { path: '', redirectTo: 'login', pathMatch: 'full' }, // root redirects to login
    ],
  },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'wizard', loadComponent: () => import('./pages/wizard/wizard').then(m => m.Wizard) },
      { path: 'templates', loadComponent: () => import('./pages/templates/templates').then(m => m.Templates) },
    ],
  },
  { path: '**', redirectTo: 'login', pathMatch: 'full' },
];
