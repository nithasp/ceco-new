import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CmsService } from 'src/app/services/cms.service';
import SwiperCore, {
  Parallax,
  Pagination,
  Navigation,
  Autoplay,
  EffectFade,
} from 'swiper';
import { ApiResponse, RecentProject } from 'src/app/interfaces';

SwiperCore.use([Parallax, Pagination, Navigation, Autoplay, EffectFade]);
@Component({
  selector: 'app-carousel2',
  templateUrl: './carousel2.component.html',
  styleUrls: ['./carousel2.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class Carousel2Component implements OnInit {
  url: string = '';
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

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.url = this.cmsService.url;
    this.cmsService
      .getRecentProject(this.cmsService.currentLanguage.value)
      .subscribe((res: ApiResponse<RecentProject>) => {
        this.cmsService
          .getRecentProjectGlobalSlide()
          .subscribe((value: RecentProject[]) => {
            this.recentProjectSlides = value;
          });
        this.cmsService.recentProjectGlobalSlide.next(res.data);
      });
  }
}
