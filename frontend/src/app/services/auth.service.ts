import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResponse, AuthSession, AuthUser } from '../interfaces';

// Records the API's last answer about whether a session exists, so opening the CMS while signed
// out does not wait on a refresh call that can only fail. A hint and not a credential: the API
// still decides, and the worst a wrong one costs is the round trip it was meant to save.
const SESSION_HINT_KEY = 'ceco.cms.session';

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

  private storageUsable = true;

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
      tap(() => {
        this.clear();
        this.rememberSession(false);
      }),
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
        catchError((error: unknown) => {
          this.clear();
          // Only the API turning the cookie down proves the session is gone. A network failure or a
          // 5xx says nothing, and forgetting on one would send an editor back to the login page
          // over a blip they could have ridden out.
          if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
            this.rememberSession(false);
          }
          return of(false);
        }),
        tap(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );

    return this.refreshInFlight;
  }

  // What the guard calls: already signed in, or able to become so from the cookie
  ensureSession(): Observable<boolean> {
    if (this.isLoggedIn) return of(true);
    if (!this.mightHaveSession()) return of(false);
    return this.refresh();
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
    this.rememberSession(true);
  }

  // Missing until the API has answered once, so a browser that already holds a live session is
  // never signed out just to save the call that would have restored it
  private mightHaveSession(): boolean {
    if (!this.storageUsable) return true;

    try {
      return localStorage.getItem(SESSION_HINT_KEY) !== '0';
    } catch {
      this.storageUsable = false;
      return true;
    }
  }

  private rememberSession(signedIn: boolean): void {
    try {
      localStorage.setItem(SESSION_HINT_KEY, signedIn ? '1' : '0');
    } catch {
      this.storageUsable = false;
    }
  }

  private clear(): void {
    this.accessToken = null;
    this.userSubject.next(null);
  }
}
