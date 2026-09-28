import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { CmsService } from 'src/app/services/cms.service';
import {
  ApiResponse,
  HeaderHomePage,
  HeaderHomePageSlide,
} from 'src/app/interfaces';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  animations: [
    trigger('carouselAnimation', [
      transition('void => *', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 })),
      ]),
      transition('* => void', [animate('500ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class CarouselComponent implements OnInit {
  url: string = '';
  slides: HeaderHomePageSlide[] = [];

  currentSlide: number = 0;
  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.url = this.cmsService.url;

    this.cmsService.getCurrentHomeSlide1().subscribe((value: number) => {
      this.currentSlide = value;
    });

    this.cmsService
      .getHomeSlide1()
      .subscribe((value: HeaderHomePageSlide[]) => {
        this.slides = value;
      });

    this.cmsService
      .getHeaderSlide(this.cmsService.currentLanguage.value)
      .subscribe((res: ApiResponse<HeaderHomePage>) => {
        this.cmsService.homeSlide1.next(res.data[0].attributes.Slides);
      });

    this.autoPlaySlides();
  }

  onPreviousClick() {
    const previous = this.currentSlide - 1;
    this.currentSlide = previous < 0 ? this.slides.length - 1 : previous;
  }

  onNextClick() {
    const next = this.currentSlide + 1;
    this.currentSlide = next === this.slides.length ? 0 : next;
  }

  autoPlaySlides() {
    setInterval(() => {
      this.onNextClick(); 
    }, 5000);
  }
}
