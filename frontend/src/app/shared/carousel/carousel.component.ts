import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CmsService } from 'src/app/services/cms.service';
import { HeaderSlide, SiteHeader } from 'src/app/interfaces';

const SLIDE_INTERVAL_MS = 5000;

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
export class CarouselComponent implements OnInit, OnDestroy {
  slides: HeaderSlide[] = [];
  currentSlide: number = 0;

  private readonly subscriptions = new Subscription();
  private timer?: ReturnType<typeof setInterval>;

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.cmsService.getCurrentHomeSlide1().subscribe((value: number) => {
        this.currentSlide = value;
      }),
    );

    this.subscriptions.add(
      this.cmsService.getHomeSlide1().subscribe((value: HeaderSlide[]) => {
        this.slides = value;
      }),
    );

    this.subscriptions.add(
      this.cmsService
        .getHeaderSlide(this.cmsService.currentLanguage.value)
        .subscribe((header: SiteHeader | null) => {
          this.cmsService.homeSlide1.next(header?.slides ?? []);
        }),
    );

    this.autoPlaySlides();
  }

  // The index lives in the service, so the language switcher can reset it when it reloads the slides
  onPreviousClick(): void {
    if (!this.slides.length) return;
    const previous = this.currentSlide - 1;
    this.cmsService.currentHomeSlide1.next(previous < 0 ? this.slides.length - 1 : previous);
  }

  onNextClick(): void {
    if (!this.slides.length) return;
    const next = this.currentSlide + 1;
    this.cmsService.currentHomeSlide1.next(next === this.slides.length ? 0 : next);
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) this.cmsService.currentHomeSlide1.next(index);
  }

  private autoPlaySlides(): void {
    this.timer = setInterval(() => this.onNextClick(), SLIDE_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.subscriptions.unsubscribe();
  }
}
