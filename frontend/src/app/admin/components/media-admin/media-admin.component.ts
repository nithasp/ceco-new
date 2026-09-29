import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Media } from 'src/app/interfaces';
import { AdminApiService } from '../../services/admin-api.service';
import { describeError } from '../../services/api-error';
import { NotifyService } from '../../services/notify.service';

const BYTES_IN_KB = 1024;

// Every image and PDF the site uses. Files live in Cloudflare R2 when it is configured and on the
// server's disk otherwise; the row records which, so the same library shows both.
@Component({
  selector: 'app-media-admin',
  templateUrl: './media-admin.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MediaAdminComponent implements OnInit {
  loading = true;
  busy = false;
  uploading = false;

  files: Media[] = [];
  search = '';
  total = 0;

  selected: Media | null = null;
  confirmDeleteId: number | null = null;
  // Set when the API reports the file is still used somewhere; deleting then needs ?force=true
  forceNeeded = false;

  constructor(
    private api: AdminApiService,
    private notify: NotifyService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.listAllFiles(this.search || undefined).subscribe({
      next: (page) => {
        this.files = page.items;
        this.total = page.meta?.total ?? page.items.length;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(describeError(err, 'Could not load the media library.'));
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = Array.from(input.files ?? []);
    if (!chosen.length) return;

    this.uploading = true;
    let remaining = chosen.length;

    // Uploaded one at a time so a single rejected file does not take the rest with it
    for (const file of chosen) {
      this.api.uploadFile(file).subscribe({
        next: (created) => {
          this.files = [created, ...this.files];
          this.total += 1;
          this.notify.success(`Uploaded ${created.name}.`);
          if (--remaining === 0) {
            this.uploading = false;
            input.value = '';
          }
        },
        error: (err) => {
          this.notify.error(`${file.name}: ${describeError(err, 'upload failed')}`);
          if (--remaining === 0) {
            this.uploading = false;
            input.value = '';
          }
        },
      });
    }
  }

  select(file: Media): void {
    this.selected = this.selected?.id === file.id ? null : { ...file };
    this.confirmDeleteId = null;
    this.forceNeeded = false;
  }

  save(): void {
    if (!this.selected || this.busy) return;
    const edited = this.selected;
    this.busy = true;

    this.api
      .updateFile(edited.id, { name: edited.name, alternativeText: edited.alternativeText })
      .subscribe({
        next: (updated) => {
          this.busy = false;
          this.files = this.files.map((file) => (file.id === updated.id ? updated : file));
          this.selected = { ...updated };
          this.notify.success('File details saved.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not save the file details.'));
        },
      });
  }

  requestDelete(file: Media): void {
    this.confirmDeleteId = file.id;
    this.forceNeeded = false;
  }

  delete(file: Media, force: boolean): void {
    this.busy = true;
    this.api.deleteFile(file.id, force).subscribe({
      next: () => {
        this.busy = false;
        this.confirmDeleteId = null;
        this.forceNeeded = false;
        this.files = this.files.filter((item) => item.id !== file.id);
        this.total = Math.max(0, this.total - 1);
        if (this.selected?.id === file.id) this.selected = null;
        this.notify.success('File deleted.');
      },
      error: (err) => {
        this.busy = false;
        // 409 means a slide or document still points at it; offer to detach and delete anyway
        const stillUsed = (err as { status?: number }).status === 409;
        this.forceNeeded = stillUsed;
        this.notify.error(describeError(err, 'Could not delete the file.'));
      },
    });
  }

  isImage(file: Media): boolean {
    return file.mime.startsWith('image/');
  }

  extLabel(file: Media): string {
    return file.ext.replace('.', '').toUpperCase();
  }

  sizeLabel(bytes: number): string {
    if (bytes < BYTES_IN_KB) return `${bytes} B`;
    const kb = bytes / BYTES_IN_KB;
    if (kb < BYTES_IN_KB) return `${kb.toFixed(0)} KB`;
    return `${(kb / BYTES_IN_KB).toFixed(1)} MB`;
  }
}
