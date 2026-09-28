import { Component, OnInit } from '@angular/core';
import { CmsService } from 'src/app/services/cms.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  mainUrl: string = '';
  companyProfileUrl: string = '';

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.mainUrl = this.cmsService.url;
    this.cmsService.getCompanyProfile().subscribe((res: any) => {
      const companyProfile = res.data.find(
        (x: any) => x.attributes.Name === 'Profile'
      );
      const getCompanyProfileUrl =
        this.mainUrl + companyProfile.attributes.Item.data.attributes.url;

      this.companyProfileUrl = getCompanyProfileUrl;
    });
  }
}
