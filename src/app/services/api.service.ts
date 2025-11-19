import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  sucesso: boolean;
  usuario: Usuario;
  token: string;
}

export interface Pagamento {
  id: number;
  emprestimoId: number;
  numeroParcel: number;
  valorRealPago: number | null;
  dataPagamento: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarUsuarioSalvo();
  }

  private carregarUsuarioSalvo(): void {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      this.usuarioSubject.next(JSON.parse(usuarioSalvo));
    }
  }

  // ============ AUTENTICAÇÃO ============

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, senha });
  }

  logout(): Observable<any> {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    this.usuarioSubject.next(null);
    return this.http.post(`${this.apiUrl}/auth/logout`, {});
  }

  salvarUsuario(usuario: Usuario, token: string): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('token', token);
    this.usuarioSubject.next(usuario);
  }

  obterUsuarioAtual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  // ============ USUÁRIOS ============

  obterUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
  }

  // ============ EMPRÉSTIMOS ============

  obterEmprestimosUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/emprestimos/${usuarioId}`);
  }

  obterEmprestimo(usuarioId: number, emprestimoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/emprestimos/${usuarioId}/${emprestimoId}`);
  }

  // ============ PAGAMENTOS ============

  obterPagamentos(emprestimoId: number): Observable<Pagamento[]> {
    return this.http.get<Pagamento[]>(`${this.apiUrl}/pagamentos/${emprestimoId}`);
  }

  salvarPagamento(emprestimoId: number, numeroParcel: number, valorRealPago: number | null): Observable<any> {
    return this.http.put(`${this.apiUrl}/pagamentos/${emprestimoId}/${numeroParcel}`, { valorRealPago });
  }

  removerPagamento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pagamentos/${id}`);
  }

  // ============ HEALTH CHECK ============

  verificarSaude(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
