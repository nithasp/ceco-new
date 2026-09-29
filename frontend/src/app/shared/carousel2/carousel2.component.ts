import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { CmsService } from 'src/app/services/cms.service';
import SwiperCore, {
  Parallax,
  Pagination,
  Navigation,
  Autoplay,
  EffectFade,
} from 'swiper';
import { RecentProject } from 'src/app/interfaces';

SwiperCore.use([Parallax, Pagination, Navigation, Autoplay, EffectFade]);
@Component({
  selector: 'app-carousel2',
  templateUrl: './carousel2.component.html',
  styleUrls: ['./carousel2.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class Carousel2Component implements OnInit, OnDestroy {
  recentProjectSlides: RecentProject[] = [];
  swiperConfig = {
    navigation: true,
    pagination: {
      clickable: true,
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    speed: 500,
  };

  private readonly subscriptions = new Subscription();

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.cmsService.getRecentProjectGlobalSlide().subscribe((value: RecentProject[]) => {
        this.recentProjectSlides = value;
      }),
    );

    this.subscriptions.add(
      this.cmsService
        .getRecentProject(this.cmsService.currentLanguage.value)
        .subscribe((projects: RecentProject[]) => {
          this.cmsService.recentProjectGlobalSlide.next(projects);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
