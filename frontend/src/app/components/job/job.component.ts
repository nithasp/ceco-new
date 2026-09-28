import { Component, OnInit } from '@angular/core';
import { CmsService } from 'src/app/services/cms.service';
import { ApiResponse, Recruitments } from 'src/app/interfaces';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss'],
})
export class JobComponent implements OnInit {
  constructor(private cmsService: CmsService) {}

  recruitments: Recruitments[] = [];
  isLoading: boolean = true;

  ngOnInit(): void {
    window.scrollTo(0, 0);

    this.cmsService
      .getRecruitments(this.cmsService.currentLanguage.value)
      .subscribe((res: ApiResponse<Recruitments>) => {
        this.cmsService
          .getRecruitmentsItemGlobal()
          .subscribe((value: Recruitments[]) => {
            this.recruitments = value;
          });
        this.cmsService.recruitmentsItemsGlobal.next(res.data);
        this.cmsService.isLoading.next(false);
      });

    this.cmsService.getIsLoading().subscribe((value: boolean) => {
      this.isLoading = value;
    });
  }
}
