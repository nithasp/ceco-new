import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ViewportScroller } from '@angular/common';
import { Subscription } from 'rxjs';
import { CmsService } from 'src/app/services/cms.service';
import {
  Experience,
  Locale,
  RecentProject,
  Recruitment,
  SiteDocument,
  SiteHeader,
} from 'src/app/interfaces';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  public isMenuCollapsed = true;
  scrolled: boolean = false;

  // Empty until the logo loads, so the navbar never points <img> at a broken URL
  logoUrl: string = '';

  private readonly subscriptions = new Subscription();

  constructor(
    private translateService: TranslateService,
    private viewportScroller: ViewportScroller,
    private cmsService: CmsService,
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 0;
  }

  ngOnInit(): void {
    this.getCompanyLogo();
  }

  getCompanyLogo(): void {
    this.subscriptions.add(
      this.cmsService.getCompanyLogo().subscribe({
        next: (logo: SiteDocument | null) => {
          this.logoUrl = logo?.fileUrl ?? '';
        },
        error: () => {
          this.logoUrl = '';
        },
      }),
    );
  }

  // Switching language reloads every piece of API-backed copy on the page, because the content is
  // stored once per locale rather than translated in the browser
  selectLanguage(value: Locale): void {
    this.translateService.use(value);
    this.cmsService.currentLanguage.next(value);

    this.subscriptions.add(
      this.cmsService.getHeaderSlide(value).subscribe((header: SiteHeader | null) => {
        this.cmsService.currentHomeSlide1.next(0);
        this.cmsService.homeSlide1.next(header?.slides ?? []);
      }),
    );

    this.subscriptions.add(
      this.cmsService.getRecentProject(value).subscribe((projects: RecentProject[]) => {
        this.cmsService.recentProjectGlobalSlide.next(projects);
      }),
    );

    this.subscriptions.add(
      this.cmsService.getExperiences(value).subscribe((experiences: Experience[]) => {
        const match = experiences.find((item) => item.type === this.cmsService.experienceType.value);
        this.cmsService.experienceItems.next(match);
      }),
    );

    this.subscriptions.add(
      this.cmsService.getRecruitments(value).subscribe((jobs: Recruitment[]) => {
        this.cmsService.recruitmentsItemsGlobal.next(jobs);
      }),
    );

    this.subscriptions.add(
      this.cmsService.getCompanyLogo(value).subscribe((logo: SiteDocument | null) => {
        this.logoUrl = logo?.fileUrl ?? '';
      }),
    );
  }

  navbarActive(elem: HTMLElement): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    elem.classList.toggle('active');
  }

  toElem(id: string): void {
    setTimeout(() => {
      this.viewportScroller.scrollToAnchor(id);
    }, 100);
  }

  toTopPage(): void {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
