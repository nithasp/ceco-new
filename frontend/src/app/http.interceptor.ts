import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './services/auth.service';

const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

@Injectable()
export class httpInterceptor implements HttpInterceptor {
  // AuthService itself uses HttpClient, so resolving it here rather than in the constructor avoids
  // the circular dependency Angular would otherwise report at start-up
  constructor(private injector: Injector) {}

  private get auth(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!request.url.startsWith(environment.apiUrl)) return next.handle(request);

    const isAuthCall = AUTH_PATHS.some((path) => request.url.includes(path));
    const authorized = this.withToken(request);

    return next.handle(authorized).pipe(
      catchError((error: HttpErrorResponse) => {
        // A 15-minute access token expires while the CMS is open; one refresh and one retry keeps
        // the editor working instead of bouncing them to the login page mid-edit.
        const expired = error.status === 401 && error.error?.code === 'token_expired';
        if (!expired || isAuthCall) return throwError(() => error);

        return this.auth.refresh().pipe(
          switchMap((renewed) => {
            if (!renewed) return throwError(() => error);
            return next.handle(this.withToken(request));
          }),
        );
      }),
    );
  }

  // The cookie is scoped to the auth routes, so withCredentials only matters there, but setting it
  // for the whole API keeps the rule in one place
  private withToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.auth.token;
    return request.clone({
      withCredentials: true,
      ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
    });
  }
}
