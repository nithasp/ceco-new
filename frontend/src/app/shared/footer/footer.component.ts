import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CmsService } from 'src/app/services/cms.service';
import { SiteDocument } from 'src/app/interfaces';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, OnDestroy {
  // Null until a PDF is attached in the admin pages; the download button stays hidden until then
  companyProfileUrl: string | null = null;

  private readonly subscriptions = new Subscription();

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.cmsService.getCompanyProfile().subscribe({
        next: (profile: SiteDocument | null) => {
          this.companyProfileUrl = profile?.fileUrl ?? null;
        },
        error: () => {
          this.companyProfileUrl = null;
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
