import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { describeError } from '../../services/api-error';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../admin-theme.scss'],
  // The theme is written as plain .cms rules, so it must not be rewritten per component
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  submitting = false;
  errorMessage: string | null = null;

  private redirectTo = '/admin';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Only an in-app path is honoured, so a crafted ?redirect= cannot bounce the editor off-site
    const requested = this.route.snapshot.queryParamMap.get('redirect');
    if (requested && requested.startsWith('/admin')) this.redirectTo = requested;
  }

  submit(): void {
    if (this.submitting || !this.username.trim() || !this.password) return;

    this.submitting = true;
    this.errorMessage = null;

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.password = '';
        this.router.navigateByUrl(this.redirectTo);
      },
      error: (err) => {
        this.submitting = false;
        this.password = '';
        this.errorMessage = describeError(err, 'Could not sign in.');
      },
    });
  }
}
