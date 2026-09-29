import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Anyone reaching /admin without a session is sent to the login page, with the page they asked for
// remembered so they land there once they are signed in. The API checks the token again on every
// request, so this is only about what the browser shows.
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.auth.ensureSession().pipe(
      map((signedIn) => {
        if (signedIn) return true;
        this.router.navigate(['/admin/login'], { queryParams: { redirect: state.url } });
        return false;
      }),
    );
  }
}

// Keeps an already signed-in editor off the login page
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    return this.auth.ensureSession().pipe(
      map((signedIn) => {
        if (!signedIn) return true;
        this.router.navigate(['/admin']);
        return false;
      }),
    );
  }
}
