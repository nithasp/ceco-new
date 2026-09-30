import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { JobDraft, Locale, Recruitment } from 'src/app/interfaces';
import { AdminApiService } from '../../services/admin-api.service';
import { describeError } from '../../services/api-error';
import { NotifyService } from '../../services/notify.service';

const emptyJob = (): JobDraft => ({ position: '', description: '', amount: null, isPublished: true });

// The career page accordion. Each job's description is rich text: Angular sanitizes it on the way
// into [innerHTML], so markup saved here is rendered but cannot execute script.
@Component({
  selector: 'app-job-admin',
  templateUrl: './job-admin.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class JobAdminComponent implements OnInit {
  locale: Locale = 'th';
  loading = true;
  busy = false;

  jobs: Recruitment[] = [];
  newJob: JobDraft = emptyJob();
  showNewJob = false;
  confirmJobId: number | null = null;
  previewJobId: number | null = null;

  constructor(
    private api: AdminApiService,
    private notify: NotifyService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.listRecruitments(this.locale).subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(describeError(err, 'Could not load the job openings.'));
      },
    });
  }

  switchLocale(locale: Locale): void {
    if (this.locale === locale) return;
    this.locale = locale;
    this.newJob = emptyJob();
    this.showNewJob = false;
    this.confirmJobId = null;
    this.previewJobId = null;
    this.load();
  }

  addJob(): void {
    if (!this.newJob.position.trim() || this.busy) return;
    this.busy = true;

    this.api
      .createRecruitment({
        position: this.newJob.position.trim(),
        description: this.newJob.description.trim() || null,
        amount: this.newJob.amount,
        locale: this.locale,
        isPublished: this.newJob.isPublished,
      })
      .subscribe({
        next: (job) => {
          this.busy = false;
          this.jobs = [...this.jobs, job];
          this.newJob = emptyJob();
          this.showNewJob = false;
          this.notify.success('Job added.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not add the job.'));
        },
      });
  }

  saveJob(job: Recruitment): void {
    if (this.busy) return;
    this.busy = true;

    this.api
      .updateRecruitment(job.id, {
        position: job.position,
        description: job.description,
        amount: job.amount,
        isPublished: job.isPublished,
      })
      .subscribe({
        next: (updated) => {
          this.busy = false;
          Object.assign(job, updated);
          this.notify.success('Job saved.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not save the job.'));
        },
      });
  }

  deleteJob(job: Recruitment): void {
    this.busy = true;
    this.api.deleteRecruitment(job.id).subscribe({
      next: () => {
        this.busy = false;
        this.confirmJobId = null;
        this.jobs = this.jobs.filter((item) => item.id !== job.id);
        this.notify.success('Job deleted.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not delete the job.'));
      },
    });
  }

  // The accordion on the career page follows this order
  moveJob(index: number, direction: -1 | 1): void {
    if (this.busy) return;
    const target = index + direction;
    if (target < 0 || target >= this.jobs.length) return;

    const jobs = [...this.jobs];
    const moved = jobs[index];
    const swap = jobs[target];
    if (!moved || !swap) return;
    jobs[index] = swap;
    jobs[target] = moved;
    this.jobs = jobs;

    this.busy = true;
    this.api.reorderRecruitments(
      this.locale,
      jobs.map((job) => job.id),
    ).subscribe({
      next: (ordered) => {
        this.busy = false;
        this.jobs = ordered;
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  togglePreview(job: Recruitment): void {
    this.previewJobId = this.previewJobId === job.id ? null : job.id;
  }
}
