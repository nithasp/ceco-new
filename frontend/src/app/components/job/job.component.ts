import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CmsService } from 'src/app/services/cms.service';
import { Recruitment } from 'src/app/interfaces';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss'],
})
export class JobComponent implements OnInit, OnDestroy {
  recruitments: Recruitment[] = [];
  isLoading: boolean = true;

  private readonly subscriptions = new Subscription();

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);

    this.subscriptions.add(
      this.cmsService.getRecruitmentsItemGlobal().subscribe((value: Recruitment[]) => {
        this.recruitments = value;
      }),
    );

    this.subscriptions.add(
      this.cmsService.getIsLoading().subscribe((value: boolean) => {
        this.isLoading = value;
      }),
    );

    this.subscriptions.add(
      this.cmsService.getRecruitments(this.cmsService.currentLanguage.value).subscribe({
        next: (jobs: Recruitment[]) => {
          this.cmsService.recruitmentsItemsGlobal.next(jobs);
          this.cmsService.isLoading.next(false);
        },
        // The spinner has to stop even when the API is unreachable, or the page reads as stuck
        error: () => this.cmsService.isLoading.next(false),
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
