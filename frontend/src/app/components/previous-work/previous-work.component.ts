import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { CmsService } from 'src/app/services/cms.service';
import { Experience, ExperienceType } from 'src/app/interfaces';

@Component({
  selector: 'app-previous-work',
  templateUrl: './previous-work.component.html',
  styleUrls: ['./previous-work.component.scss'],
})
export class PreviousWorkComponent implements OnInit, OnDestroy {
  @Input() typeData!: ExperienceType;

  experience: Experience | undefined = undefined;

  private readonly subscriptions = new Subscription();

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.cmsService.experienceType.next(this.typeData);

    this.subscriptions.add(
      this.cmsService.getExperienceItems().subscribe((value: Experience | undefined) => {
        this.experience = value;
      }),
    );

    this.subscriptions.add(
      this.cmsService
        .getExperiences(this.cmsService.currentLanguage.value)
        .subscribe((experiences: Experience[]) => {
          const match = experiences.find((item) => item.type === this.typeData);
          this.cmsService.experienceItems.next(match);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
