import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  EXPERIENCE_TYPES,
  Experience,
  ExperienceCompany,
  ExperienceType,
  ExperienceWork,
  Locale,
} from 'src/app/interfaces';
import { AdminApiService } from '../../services/admin-api.service';
import { describeError } from '../../services/api-error';
import { NotifyService } from '../../services/notify.service';

// The service pages pass these as typeData, so the label is only for the CMS
const TYPE_LABELS: Record<ExperienceType, string> = {
  installation: 'Installation',
  design: 'Design',
  commission: 'Testing & Commissioning',
  maintenance: 'Maintenance',
};

interface WorkDraft {
  description: string;
  year: number | null;
}

// Edits the "previous work" table each service page shows: a list of companies, and under each one
// the jobs done for it with the year. One table per service page per language.
@Component({
  selector: 'app-previous-work-admin',
  templateUrl: './previous-work-admin.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PreviousWorkAdminComponent implements OnInit {
  readonly types = EXPERIENCE_TYPES;
  readonly typeLabels = TYPE_LABELS;

  locale: Locale = 'th';
  type: ExperienceType = 'installation';

  loading = true;
  busy = false;

  experience: Experience | null = null;

  newCompanyName = '';
  workDrafts: Record<number, WorkDraft> = {};

  confirmCompanyId: number | null = null;
  confirmWorkId: number | null = null;

  constructor(
    private api: AdminApiService,
    private notify: NotifyService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.listExperiences(this.locale, this.type).subscribe({
      next: (experiences) => {
        this.experience = experiences[0] ?? null;
        this.workDrafts = {};
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(describeError(err, 'Could not load the table.'));
      },
    });
  }

  switchLocale(locale: Locale): void {
    if (this.locale === locale) return;
    this.locale = locale;
    this.reset();
    this.load();
  }

  switchType(type: ExperienceType): void {
    if (this.type === type) return;
    this.type = type;
    this.reset();
    this.load();
  }

  createTable(): void {
    this.busy = true;
    this.api.createExperience(this.type, this.locale).subscribe({
      next: (experience) => {
        this.busy = false;
        this.experience = experience;
        this.notify.success('Table created.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not create the table.'));
      },
    });
  }

  // ---- companies ----------------------------------------------------------

  addCompany(): void {
    if (!this.experience || !this.newCompanyName.trim() || this.busy) return;
    this.busy = true;

    this.api.addCompany(this.experience.id, this.newCompanyName.trim()).subscribe({
      next: (company) => {
        this.busy = false;
        this.experience?.companies.push(company);
        this.newCompanyName = '';
        this.notify.success('Company added.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not add the company.'));
      },
    });
  }

  saveCompany(company: ExperienceCompany): void {
    if (this.busy) return;
    this.busy = true;

    this.api.updateCompany(company.id, company.name).subscribe({
      next: () => {
        this.busy = false;
        this.notify.success('Company saved.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not save the company.'));
      },
    });
  }

  // Its work rows go with it, through the foreign key
  deleteCompany(company: ExperienceCompany): void {
    this.busy = true;
    this.api.deleteCompany(company.id).subscribe({
      next: () => {
        this.busy = false;
        this.confirmCompanyId = null;
        if (this.experience) {
          this.experience.companies = this.experience.companies.filter((item) => item.id !== company.id);
        }
        this.notify.success('Company deleted.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not delete the company.'));
      },
    });
  }

  moveCompany(index: number, direction: -1 | 1): void {
    if (!this.experience || this.busy) return;
    const target = index + direction;
    if (target < 0 || target >= this.experience.companies.length) return;

    const companies = [...this.experience.companies];
    const moved = companies[index];
    const swap = companies[target];
    if (!moved || !swap) return;
    companies[index] = swap;
    companies[target] = moved;
    this.experience.companies = companies;

    this.busy = true;
    this.api.reorderCompanies(
      this.experience.id,
      companies.map((company) => company.id),
    ).subscribe({
      next: (updated) => {
        this.busy = false;
        this.experience = updated;
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  // ---- work rows ----------------------------------------------------------

  draftFor(companyId: number): WorkDraft {
    if (!this.workDrafts[companyId]) {
      this.workDrafts[companyId] = { description: '', year: new Date().getFullYear() };
    }
    return this.workDrafts[companyId] as WorkDraft;
  }

  addWork(company: ExperienceCompany): void {
    const draft = this.draftFor(company.id);
    if (!draft.description.trim() || this.busy) return;
    this.busy = true;

    this.api.addWork(company.id, draft.description.trim(), draft.year).subscribe({
      next: (work) => {
        this.busy = false;
        company.works.push(work);
        this.workDrafts[company.id] = { description: '', year: draft.year };
        this.notify.success('Work item added.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not add the work item.'));
      },
    });
  }

  saveWork(work: ExperienceWork): void {
    if (this.busy) return;
    this.busy = true;

    this.api.updateWork(work.id, { description: work.description, year: work.year }).subscribe({
      next: () => {
        this.busy = false;
        this.notify.success('Work item saved.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not save the work item.'));
      },
    });
  }

  deleteWork(company: ExperienceCompany, work: ExperienceWork): void {
    this.busy = true;
    this.api.deleteWork(work.id).subscribe({
      next: () => {
        this.busy = false;
        this.confirmWorkId = null;
        company.works = company.works.filter((item) => item.id !== work.id);
        this.notify.success('Work item deleted.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not delete the work item.'));
      },
    });
  }

  moveWork(company: ExperienceCompany, index: number, direction: -1 | 1): void {
    if (this.busy) return;
    const target = index + direction;
    if (target < 0 || target >= company.works.length) return;

    const works = [...company.works];
    const moved = works[index];
    const swap = works[target];
    if (!moved || !swap) return;
    works[index] = swap;
    works[target] = moved;
    company.works = works;

    this.busy = true;
    this.api.reorderWorks(
      company.id,
      works.map((work) => work.id),
    ).subscribe({
      next: (ordered) => {
        this.busy = false;
        company.works = ordered;
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  private reset(): void {
    this.newCompanyName = '';
    this.workDrafts = {};
    this.confirmCompanyId = null;
    this.confirmWorkId = null;
  }
}
