import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  HeaderSlide,
  Locale,
  Media,
  ProjectDraft,
  RecentProject,
  SiteHeader,
  SlideDraft,
} from 'src/app/interfaces';
import { AdminApiService } from '../../services/admin-api.service';
import { describeError } from '../../services/api-error';
import { NotifyService } from '../../services/notify.service';

const emptySlide = (): SlideDraft => ({
  title: '',
  description: '',
  imageId: null,
  previewUrl: null,
  isPublished: true,
});

const emptyProject = (): ProjectDraft => ({
  name: '',
  description: '',
  imageId: null,
  previewUrl: null,
  isPublished: true,
});

// Edits the two API-backed parts of the home page: the hero carousel (app-carousel) and the
// "Recently Projects" slider (app-carousel2). Content is stored once per language, so the tab at the
// top decides which copy is being edited — it is not a translation toggle.
@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeAdminComponent implements OnInit {
  locale: Locale = 'th';
  loading = true;
  busy = false;

  header: SiteHeader | null = null;
  projects: RecentProject[] = [];

  newSlide: SlideDraft = emptySlide();
  newProject: ProjectDraft = emptyProject();
  showNewSlide = false;
  showNewProject = false;

  confirmSlideId: number | null = null;
  confirmProjectId: number | null = null;

  constructor(
    private api: AdminApiService,
    private notify: NotifyService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      headers: this.api.listHeaders(),
      projects: this.api.listRecentProjects(this.locale),
    }).subscribe({
      next: (data) => {
        this.header = data.headers.find((item) => item.locale === this.locale) ?? null;
        this.projects = data.projects;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(describeError(err, 'Could not load the home page content.'));
      },
    });
  }

  switchLocale(locale: Locale): void {
    if (this.locale === locale) return;
    this.locale = locale;
    this.resetDrafts();
    this.load();
  }

  // ---- carousel -----------------------------------------------------------

  // Only needed if the header row for a language was deleted; the seed creates both
  createHeader(): void {
    this.busy = true;
    const name = this.locale === 'th' ? 'หน้าแรก' : 'Home';

    this.api.createHeader(name, this.locale).subscribe({
      next: () => {
        this.busy = false;
        this.notify.success('Carousel created.');
        this.load();
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not create the carousel.'));
      },
    });
  }

  onNewSlideImage(media: Media | null): void {
    this.newSlide.imageId = media?.id ?? null;
    this.newSlide.previewUrl = media?.url ?? null;
  }

  addSlide(): void {
    if (!this.header || !this.newSlide.title.trim() || this.busy) return;
    this.busy = true;

    this.api
      .addSlide(this.header.id, {
        title: this.newSlide.title.trim(),
        description: this.newSlide.description.trim() || null,
        imageId: this.newSlide.imageId,
        isPublished: this.newSlide.isPublished,
      })
      .subscribe({
        next: (slide) => {
          this.busy = false;
          this.header?.slides.push(slide);
          this.newSlide = emptySlide();
          this.showNewSlide = false;
          this.notify.success('Slide added.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not add the slide.'));
        },
      });
  }

  onSlideImage(slide: HeaderSlide, media: Media | null): void {
    slide.imageId = media?.id ?? null;
    slide.imageUrl = media?.url ?? null;
    slide.imageAlt = media?.alternativeText ?? null;
    this.saveSlide(slide);
  }

  saveSlide(slide: HeaderSlide): void {
    if (this.busy) return;
    this.busy = true;

    this.api
      .updateSlide(slide.id, {
        title: slide.title,
        description: slide.description,
        imageId: slide.imageId,
        isPublished: slide.isPublished,
      })
      .subscribe({
        next: (updated) => {
          this.busy = false;
          Object.assign(slide, updated);
          this.notify.success('Slide saved.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not save the slide.'));
        },
      });
  }

  deleteSlide(slide: HeaderSlide): void {
    this.busy = true;
    this.api.deleteSlide(slide.id).subscribe({
      next: () => {
        this.busy = false;
        this.confirmSlideId = null;
        if (this.header) {
          this.header.slides = this.header.slides.filter((item) => item.id !== slide.id);
        }
        this.notify.success('Slide deleted.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not delete the slide.'));
      },
    });
  }

  // The list is reordered locally first so the move is visible at once, then the new order is sent
  moveSlide(index: number, direction: -1 | 1): void {
    if (!this.header || this.busy) return;
    const target = index + direction;
    if (target < 0 || target >= this.header.slides.length) return;

    const slides = [...this.header.slides];
    const moved = slides[index];
    const swap = slides[target];
    if (!moved || !swap) return;
    slides[index] = swap;
    slides[target] = moved;
    this.header.slides = slides;

    this.busy = true;
    this.api.reorderSlides(
      this.header.id,
      slides.map((slide) => slide.id),
    ).subscribe({
      next: (ordered) => {
        this.busy = false;
        if (this.header) this.header.slides = ordered;
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  // ---- recent projects ----------------------------------------------------

  onNewProjectImage(media: Media | null): void {
    this.newProject.imageId = media?.id ?? null;
    this.newProject.previewUrl = media?.url ?? null;
  }

  addProject(): void {
    if (!this.newProject.name.trim() || this.busy) return;
    this.busy = true;

    this.api
      .createRecentProject({
        name: this.newProject.name.trim(),
        description: this.newProject.description.trim() || null,
        locale: this.locale,
        imageId: this.newProject.imageId,
        isPublished: this.newProject.isPublished,
      })
      .subscribe({
        next: (project) => {
          this.busy = false;
          this.projects = [...this.projects, project];
          this.newProject = emptyProject();
          this.showNewProject = false;
          this.notify.success('Project added.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not add the project.'));
        },
      });
  }

  onProjectImage(project: RecentProject, media: Media | null): void {
    project.imageId = media?.id ?? null;
    project.imageUrl = media?.url ?? null;
    project.imageAlt = media?.alternativeText ?? null;
    this.saveProject(project);
  }

  saveProject(project: RecentProject): void {
    if (this.busy) return;
    this.busy = true;

    this.api
      .updateRecentProject(project.id, {
        name: project.name,
        description: project.description,
        imageId: project.imageId,
        isPublished: project.isPublished,
      })
      .subscribe({
        next: (updated) => {
          this.busy = false;
          Object.assign(project, updated);
          this.notify.success('Project saved.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not save the project.'));
        },
      });
  }

  deleteProject(project: RecentProject): void {
    this.busy = true;
    this.api.deleteRecentProject(project.id).subscribe({
      next: () => {
        this.busy = false;
        this.confirmProjectId = null;
        this.projects = this.projects.filter((item) => item.id !== project.id);
        this.notify.success('Project deleted.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not delete the project.'));
      },
    });
  }

  moveProject(index: number, direction: -1 | 1): void {
    if (this.busy) return;
    const target = index + direction;
    if (target < 0 || target >= this.projects.length) return;

    const projects = [...this.projects];
    const moved = projects[index];
    const swap = projects[target];
    if (!moved || !swap) return;
    projects[index] = swap;
    projects[target] = moved;
    this.projects = projects;

    this.busy = true;
    this.api.reorderRecentProjects(
      this.locale,
      projects.map((project) => project.id),
    ).subscribe({
      next: (ordered) => {
        this.busy = false;
        this.projects = ordered;
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  private resetDrafts(): void {
    this.newSlide = emptySlide();
    this.newProject = emptyProject();
    this.showNewSlide = false;
    this.showNewProject = false;
    this.confirmSlideId = null;
    this.confirmProjectId = null;
  }
}
