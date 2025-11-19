import { Routes } from '@angular/router';
import { AcompanhamentoEmprestimoComponent } from './components/acompanhamento-emprestimo/acompanhamento-emprestimo.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    redirectTo: '/acompanhamento',
    pathMatch: 'full'
  },
  {
    path: 'acompanhamento',
    component: AcompanhamentoEmprestimoComponent,
    canActivate: [authGuard]
  }
];
