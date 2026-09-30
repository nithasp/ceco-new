import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ceco';

  // The CMS has its own shell, so the public navbar and footer are left out under /admin
  isAdminArea = false;

  showAdminSplash = false;

  private committedIsAdmin = false;
  private pendingIsAdmin = false;
  private renderedUrl: string | null = null;

  private readonly subscriptions = new Subscription();

  constructor(
    private router: Router,
    private location: Location,
  ) {}

  ngOnInit(): void {
    // Read from the address bar, not from Router.url: the initial navigation has not run yet at
    // this point, so the router still reports '/' and a deep link into /admin would paint the
    // public header and footer for as long as the guard takes.
    this.committedIsAdmin = this.isAdminUrl(this.location.path());
    this.pendingIsAdmin = this.committedIsAdmin;
    this.sync();

    this.subscriptions.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.pendingIsAdmin = this.isAdminUrl(event.url);
        } else if (event instanceof NavigationEnd) {
          this.renderedUrl = event.urlAfterRedirects;
          this.committedIsAdmin = this.isAdminUrl(event.urlAfterRedirects);
          this.pendingIsAdmin = false;
        } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
          this.pendingIsAdmin = false;
        } else {
          return;
        }

        this.sync();
      }),
    );
  }

  private sync(): void {
    this.isAdminArea = this.committedIsAdmin || this.pendingIsAdmin;

    const cmsOnScreen = this.renderedUrl !== null && this.isAdminUrl(this.renderedUrl);
    this.showAdminSplash = this.pendingIsAdmin && !cmsOnScreen;
  }

  private isAdminUrl(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    return path === '/admin' || path.startsWith('/admin/');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
