import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DocumentKind, Media, SiteDocument } from 'src/app/interfaces';
import { AdminApiService } from '../../services/admin-api.service';
import { describeError } from '../../services/api-error';
import { NotifyService } from '../../services/notify.service';

// The two site-wide files: the navbar logo, and the PDF the footer download button links to. The
// footer looks the PDF up by the name "Profile", so renaming that row hides the button.
@Component({
  selector: 'app-documents-admin',
  templateUrl: './documents-admin.component.html',
  styleUrls: ['../../admin-theme.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DocumentsAdminComponent implements OnInit {
  readonly profileName = 'Profile';

  loading = true;
  busy = false;

  logos: SiteDocument[] = [];
  pdfs: SiteDocument[] = [];

  confirmDeleteId: number | null = null;

  constructor(
    private api: AdminApiService,
    private notify: NotifyService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.listDocuments().subscribe({
      next: (documents) => {
        this.logos = documents.filter((doc) => doc.kind === 'logo');
        this.pdfs = documents.filter((doc) => doc.kind === 'pdf');
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(describeError(err, 'Could not load the site files.'));
      },
    });
  }

  create(kind: DocumentKind): void {
    if (this.busy) return;
    this.busy = true;

    const name = kind === 'logo' ? 'Site logo' : this.profileName;
    this.api.createDocument({ kind, name, locale: null, isPublished: true }).subscribe({
      next: (created) => {
        this.busy = false;
        if (created.kind === 'logo') this.logos = [...this.logos, created];
        else this.pdfs = [...this.pdfs, created];
        this.notify.success('Entry created. Attach a file to it next.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not create the entry.'));
      },
    });
  }

  onFile(doc: SiteDocument, media: Media | null): void {
    doc.fileId = media?.id ?? null;
    doc.fileUrl = media?.url ?? null;
    doc.fileName = media?.name ?? null;
    doc.fileMime = media?.mime ?? null;
    this.save(doc);
  }

  save(doc: SiteDocument): void {
    if (this.busy) return;
    this.busy = true;

    this.api
      .updateDocument(doc.id, {
        name: doc.name,
        description: doc.description,
        fileId: doc.fileId,
        isPublished: doc.isPublished,
      })
      .subscribe({
        next: (updated) => {
          this.busy = false;
          Object.assign(doc, updated);
          this.notify.success('Saved.');
        },
        error: (err) => {
          this.busy = false;
          this.notify.error(describeError(err, 'Could not save.'));
        },
      });
  }

  delete(doc: SiteDocument): void {
    this.busy = true;
    this.api.deleteDocument(doc.id).subscribe({
      next: () => {
        this.busy = false;
        this.confirmDeleteId = null;
        this.logos = this.logos.filter((item) => item.id !== doc.id);
        this.pdfs = this.pdfs.filter((item) => item.id !== doc.id);
        this.notify.success('Entry deleted.');
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(describeError(err, 'Could not delete the entry.'));
      },
    });
  }
}
