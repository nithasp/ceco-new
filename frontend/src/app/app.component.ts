import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ceco';

  // The CMS has its own shell, so the public navbar and footer are left out under /admin
  isAdminArea = false;

  private readonly subscriptions = new Subscription();

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Set from the current URL as well, so a deep link into /admin is right on the first paint
    this.isAdminArea = this.isAdminUrl(this.router.url);

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.isAdminArea = this.isAdminUrl(event.urlAfterRedirects);
        }),
    );
  }

  private isAdminUrl(url: string): boolean {
    return url === '/admin' || url.startsWith('/admin/') || url.startsWith('/admin?');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
