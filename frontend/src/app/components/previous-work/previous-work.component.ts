import { Component, OnInit, Input } from '@angular/core';
import { CmsService } from 'src/app/services/cms.service';
import { ApiResponse, Experiences } from 'src/app/interfaces';

@Component({
  selector: 'app-previous-work',
  templateUrl: './previous-work.component.html',
  styleUrls: ['./previous-work.component.scss'],
})
export class PreviousWorkComponent implements OnInit {
  @Input() typeData!: string;

  companies: Experiences | undefined = undefined;

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.cmsService.experienceType.next(this.typeData);

    this.cmsService
      .getExperiences(this.cmsService.currentLanguage.value)
      .subscribe((res: ApiResponse<Experiences>) => {
        this.cmsService
          .getExperienceItems()
          .subscribe((value: Experiences | undefined) => {
            this.companies = value;
          });

        const matchDataType = res.data.find(
          (x: Experiences) => x.attributes.type === this.typeData
        );

        if (matchDataType) {
          this.cmsService.experienceItems.next(matchDataType);
        }
      });
  }
}
