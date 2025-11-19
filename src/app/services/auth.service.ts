import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export type UserRole = 'admin' | 'user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private currentRole: UserRole | null = null;
  private currentUsuarioId: number | null = null;

  constructor(private router: Router, private apiService: ApiService) {
    // Verificar se já está autenticado (salvo no localStorage)
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedRole = localStorage.getItem('userRole') as UserRole | null;
    const savedUserId = localStorage.getItem('userId');
    
    if (savedAuth === 'true' && savedRole && savedUserId) {
      this.isAuthenticatedSubject.next(true);
      this.currentRole = savedRole;
      this.currentUsuarioId = parseInt(savedUserId);
    }
  }

  login(email: string, senha: string): Observable<any> {
    return this.apiService.login(email, senha).pipe(
      tap((response) => {
        if (response.sucesso) {
          this.isAuthenticatedSubject.next(true);
          this.currentRole = response.usuario.role as UserRole;
          this.currentUsuarioId = response.usuario.id;
          
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userRole', response.usuario.role);
          localStorage.setItem('userId', response.usuario.id.toString());
          localStorage.setItem('token', response.token);
          
          this.apiService.salvarUsuario(response.usuario, response.token);
        }
      })
    );
  }

  logout(): void {
    this.isAuthenticatedSubject.next(false);
    this.currentRole = null;
    this.currentUsuarioId = null;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    this.apiService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    return this.currentRole === 'admin';
  }

  getCurrentRole(): UserRole | null {
    return this.currentRole;
  }

  getCurrentUsuarioId(): number | null {
    return this.currentUsuarioId;
  }
}
