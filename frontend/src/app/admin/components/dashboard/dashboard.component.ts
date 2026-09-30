import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Media, Paged, Tally } from 'src/app/interfaces';
import { AdminApiService } from '../../services/admin-api.service';
import { describeError } from '../../services/api-error';
import { NotifyService } from '../../services/notify.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements OnInit {
  loading = true;
  tally: Tally | null = null;

  constructor(
    private api: AdminApiService,
    private notify: NotifyService,
  ) {}

  ngOnInit(): void {
    // One pass over everything the CMS manages, so the overview reflects what is actually there. A
    // single failing call must not blank the page, so each one falls back to an empty result.
    forkJoin({
      headers: this.api.listHeaders().pipe(catchError(() => of([]))),
      projects: this.api.listRecentProjects().pipe(catchError(() => of([]))),
      jobs: this.api.listRecruitments().pipe(catchError(() => of([]))),
      experiences: this.api.listExperiences().pipe(catchError(() => of([]))),
      files: this.api.listAllFiles(undefined, 1).pipe(catchError(() => of<Paged<Media>>({ items: [] }))),
      documents: this.api.listDocuments().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        const logo = data.documents.find((doc) => doc.kind === 'logo' && doc.fileUrl);
        const profile = data.documents.find((doc) => doc.kind === 'pdf' && doc.fileUrl);

        this.tally = {
          slidesTh: data.headers.find((header) => header.locale === 'th')?.slides.length ?? 0,
          slidesEn: data.headers.find((header) => header.locale === 'en')?.slides.length ?? 0,
          projectsTh: data.projects.filter((project) => project.locale === 'th').length,
          projectsEn: data.projects.filter((project) => project.locale === 'en').length,
          jobsTh: data.jobs.filter((job) => job.locale === 'th').length,
          jobsEn: data.jobs.filter((job) => job.locale === 'en').length,
          workTables: data.experiences.length,
          files: data.files.meta?.total ?? data.files.items.length,
          hasLogo: Boolean(logo),
          hasProfilePdf: Boolean(profile),
        };
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(describeError(err, 'Could not load the overview.'));
      },
    });
  }
}
