import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Media } from 'src/app/interfaces';
import { AdminApiService } from '../../services/admin-api.service';
import { describeError } from '../../services/api-error';
import { NotifyService } from '../../services/notify.service';

// Picks the file attached to a slide, a project or a document: shows what is attached now, opens the
// library to choose another, uploads a new one, or detaches it. Used everywhere a file is chosen, so
// upload behaves the same across the CMS.
@Component({
  selector: 'app-media-picker',
  templateUrl: './media-picker.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MediaPickerComponent {
  @Input() previewUrl: string | null = null;
  @Input() mediaId: number | null = null;
  @Input() label = 'Image';
  // 'image' lists pictures only; 'all' also lists the PDF the footer links to
  @Input() scope: 'image' | 'all' = 'image';
  @Input() accept = 'image/*';
  @Input() disabled = false;

  @Output() changed = new EventEmitter<Media | null>();

  open = false;
  loading = false;
  uploading = false;
  files: Media[] = [];
  search = '';

  constructor(
    private api: AdminApiService,
    private notify: NotifyService,
  ) {}

  toggle(): void {
    this.open = !this.open;
    if (this.open && !this.files.length) this.load();
  }

  load(): void {
    this.loading = true;
    const request =
      this.scope === 'all' ? this.api.listAllFiles(this.search) : this.api.listMedia(this.search);

    request.subscribe({
      next: (page) => {
        this.files = page.items;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(describeError(err, 'Could not load the media library.'));
      },
    });
  }

  choose(file: Media): void {
    this.previewUrl = file.url;
    this.mediaId = file.id;
    this.open = false;
    this.changed.emit(file);
  }

  clear(): void {
    this.previewUrl = null;
    this.mediaId = null;
    this.open = false;
    this.changed.emit(null);
  }

  // A newly uploaded file is selected straight away: that is almost always why it was uploaded
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.api.uploadFile(file).subscribe({
      next: (created) => {
        this.uploading = false;
        input.value = '';
        this.files = [created, ...this.files];
        this.notify.success(`Uploaded ${created.name}.`);
        this.choose(created);
      },
      error: (err) => {
        this.uploading = false;
        input.value = '';
        this.notify.error(describeError(err, 'The upload failed.'));
      },
    });
  }

  isImage(file: Media): boolean {
    return file.mime.startsWith('image/');
  }

  extLabel(file: Media): string {
    return file.ext.replace('.', '').toUpperCase();
  }
}
