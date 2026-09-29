import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthUser } from 'src/app/interfaces';
import { AuthService } from 'src/app/services/auth.service';
import { NotifyService, Toast } from '../../services/notify.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminLayoutComponent {
  readonly user$: Observable<AuthUser | null>;
  readonly toasts$: Observable<Toast[]>;

  signingOut = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private notify: NotifyService,
  ) {
    this.user$ = this.auth.user$;
    this.toasts$ = this.notify.toasts$;
  }

  signOut(): void {
    if (this.signingOut) return;
    this.signingOut = true;

    this.auth.logout().subscribe(() => {
      this.signingOut = false;
      this.router.navigate(['/admin/login']);
    });
  }

  dismiss(id: number): void {
    this.notify.dismiss(id);
  }
}
