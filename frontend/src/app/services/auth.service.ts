import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResponse, AuthSession, AuthUser } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}${environment.apiPrefix}/auth`;

  // The access token is held in memory only. Nothing readable by JavaScript survives a reload, so
  // an XSS bug cannot lift a long-lived credential out of localStorage; the HttpOnly refresh cookie
  // is what restores the session instead.
  private accessToken: string | null = null;

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this.userSubject.asObservable();

  // Several guards can fire at once on a deep link; they share one refresh call rather than racing
  private refreshInFlight: Observable<boolean> | null = null;

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return this.accessToken;
  }

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.accessToken !== null;
  }

  login(username: string, password: string): Observable<AuthUser> {
    return this.http
      .post<ApiResponse<AuthSession>>(
        `${this.base}/login`,
        { username, password },
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.data),
        tap((session) => this.apply(session)),
        map((session) => session.user),
      );
  }

  logout(): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${this.base}/logout`, {}, { withCredentials: true }).pipe(
      // A failed call still ends the session on this device; the cookie is gone either way
      catchError(() => of(null)),
      tap(() => this.clear()),
      map(() => undefined),
    );
  }

  // Exchanges the refresh cookie for a new access token. Used on a reload, and by the interceptor
  // when a request comes back with an expired token.
  refresh(): Observable<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = this.http
      .post<ApiResponse<AuthSession>>(`${this.base}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => this.apply(res.data)),
        map(() => true),
        catchError(() => {
          this.clear();
          return of(false);
        }),
        tap(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );

    return this.refreshInFlight;
  }

  // What the guard calls: already signed in, or able to become so from the cookie
  ensureSession(): Observable<boolean> {
    return this.isLoggedIn ? of(true) : this.refresh();
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthUser> {
    return this.http
      .put<ApiResponse<AuthSession>>(
        `${environment.apiUrl}${environment.apiPrefix}/users/me/password`,
        { currentPassword, newPassword },
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.data),
        tap((session) => this.apply(session)),
        map((session) => session.user),
        catchError((err) => throwError(() => err)),
      );
  }

  private apply(session: AuthSession): void {
    this.accessToken = session.accessToken;
    this.userSubject.next(session.user);
  }

  private clear(): void {
    this.accessToken = null;
    this.userSubject.next(null);
  }
}
