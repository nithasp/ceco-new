import { Component, HostListener, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ViewportScroller } from '@angular/common';
import { CmsService } from 'src/app/services/cms.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  public isMenuCollapsed = true;
  scrolled: boolean = false;
  uploadUrl: string = 'https://api.beonit.xyz/strapi';

  constructor(
    private translateService: TranslateService,
    private viewportScroller: ViewportScroller,
    private cmsService: CmsService
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 0;
  }

  ngOnInit(): void {
    this.getCompanyLogo();
  }

  getCompanyLogo() {
    this.cmsService.getCompanyLogo().subscribe((res) => {
      if (res.data.length > 0) {
        const logoUrl = res.data[0].attributes.image.data.attributes.url;
        this.uploadUrl = this.uploadUrl + logoUrl;
      } else {
        this.uploadUrl = '';
      }
    });
  }

  selectLanguage(value: string) {
    this.translateService.use(value);
    this.cmsService.currentLanguage.next(value);

    this.cmsService.getHeaderSlide(value).subscribe((res: any) => {
      this.cmsService.currentHomeSlide1.next(0);
      this.cmsService.homeSlide1.next(res.data[0].attributes.Slides);
    });

    this.cmsService.getRecentProject(value).subscribe((res: any) => {
      this.cmsService.recentProjectGlobalSlide.next(res.data);
    });

    this.cmsService.getExperiences(value).subscribe((res: any) => {
      const matchDataType = res.data.find(
        (x: any) => x.attributes.type === this.cmsService.experienceType.value
      );
      if (matchDataType) {
        this.cmsService.experienceItems.next(matchDataType);
      }
    });

    this.cmsService.getRecruitments(value).subscribe((res: any) => {
      this.cmsService.recruitmentsItemsGlobal.next(res.data);
    });
  }

  navbarActive(elem: HTMLElement) {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    elem.classList.toggle('active');
  }

  toElem(id: string) {
    setTimeout(() => {
      this.viewportScroller.scrollToAnchor(id);
    }, 100);
  }

  toTopPage() {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }
}
