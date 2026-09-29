import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ApiResponse,
  DocumentKind,
  Experience,
  ExperienceCompany,
  ExperienceType,
  ExperienceWork,
  HeaderSlide,
  Locale,
  Media,
  PageMeta,
  RecentProject,
  Recruitment,
  SiteDocument,
  SiteHeader,
} from 'src/app/interfaces';

export interface Paged<T> {
  items: T[];
  meta?: PageMeta;
}

export interface SlidePayload {
  title?: string;
  description?: string | null;
  imageId?: number | null;
  position?: number;
  isPublished?: boolean;
}

export interface RecentProjectPayload {
  name?: string;
  description?: string | null;
  locale?: Locale;
  imageId?: number | null;
  position?: number;
  isPublished?: boolean;
}

export interface RecruitmentPayload {
  position?: string;
  description?: string | null;
  amount?: number | null;
  priority?: number;
  locale?: Locale;
  isPublished?: boolean;
}

export interface DocumentPayload {
  kind?: DocumentKind;
  name?: string;
  description?: string | null;
  locale?: Locale | null;
  fileId?: number | null;
  position?: number;
  isPublished?: boolean;
}

// Every admin call goes through here, so the bearer token and the URL shape live in one place.
// The interceptor attaches the token and renews it when it has expired.
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly base = `${environment.apiUrl}${environment.apiPrefix}/admin`;

  constructor(private http: HttpClient) {}

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((res) => res.data));
  }

  // ---- media --------------------------------------------------------------

  listMedia(search?: string, limit = 100): Observable<Paged<Media>> {
    let params = new HttpParams().set('limit', String(limit)).set('mimeGroup', 'image');
    if (search) params = params.set('search', search);

    return this.http
      .get<ApiResponse<Media[]>>(`${this.base}/media`, { params })
      .pipe(map((res) => ({ items: res.data ?? [], meta: res.meta })));
  }

  listAllFiles(search?: string, limit = 100): Observable<Paged<Media>> {
    let params = new HttpParams().set('limit', String(limit));
    if (search) params = params.set('search', search);

    return this.http
      .get<ApiResponse<Media[]>>(`${this.base}/media`, { params })
      .pipe(map((res) => ({ items: res.data ?? [], meta: res.meta })));
  }

  // The browser sets the multipart boundary, so Content-Type is deliberately not set here
  uploadFile(file: File, alternativeText?: string): Observable<Media> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (alternativeText) form.append('alternativeText', alternativeText);

    return this.unwrap(this.http.post<ApiResponse<Media>>(`${this.base}/media`, form));
  }

  updateFile(id: number, changes: { name?: string; alternativeText?: string | null }): Observable<Media> {
    return this.unwrap(this.http.patch<ApiResponse<Media>>(`${this.base}/media/${id}`, changes));
  }

  deleteFile(id: number, force = false): Observable<Media> {
    const params = new HttpParams().set('force', String(force));
    return this.unwrap(this.http.delete<ApiResponse<Media>>(`${this.base}/media/${id}`, { params }));
  }

  // ---- home carousel ------------------------------------------------------

  listHeaders(): Observable<SiteHeader[]> {
    return this.unwrap(this.http.get<ApiResponse<SiteHeader[]>>(`${this.base}/headers`));
  }

  createHeader(name: string, locale: Locale): Observable<SiteHeader> {
    return this.unwrap(this.http.post<ApiResponse<SiteHeader>>(`${this.base}/headers`, { name, locale }));
  }

  updateHeader(id: number, name: string): Observable<SiteHeader> {
    return this.unwrap(this.http.patch<ApiResponse<SiteHeader>>(`${this.base}/headers/${id}`, { name }));
  }

  deleteHeader(id: number): Observable<SiteHeader> {
    return this.unwrap(this.http.delete<ApiResponse<SiteHeader>>(`${this.base}/headers/${id}`));
  }

  addSlide(headerId: number, payload: SlidePayload): Observable<HeaderSlide> {
    return this.unwrap(
      this.http.post<ApiResponse<HeaderSlide>>(`${this.base}/headers/${headerId}/slides`, payload),
    );
  }

  updateSlide(id: number, payload: SlidePayload): Observable<HeaderSlide> {
    return this.unwrap(this.http.patch<ApiResponse<HeaderSlide>>(`${this.base}/header-slides/${id}`, payload));
  }

  deleteSlide(id: number): Observable<HeaderSlide> {
    return this.unwrap(this.http.delete<ApiResponse<HeaderSlide>>(`${this.base}/header-slides/${id}`));
  }

  reorderSlides(headerId: number, ids: number[]): Observable<HeaderSlide[]> {
    return this.unwrap(
      this.http.put<ApiResponse<HeaderSlide[]>>(`${this.base}/headers/${headerId}/slides/order`, { ids }),
    );
  }

  // ---- recent projects ----------------------------------------------------

  listRecentProjects(locale?: Locale): Observable<RecentProject[]> {
    const params = locale ? new HttpParams().set('locale', locale) : undefined;
    return this.unwrap(
      this.http.get<ApiResponse<RecentProject[]>>(`${this.base}/recent-projects`, { params }),
    );
  }

  createRecentProject(payload: RecentProjectPayload): Observable<RecentProject> {
    return this.unwrap(this.http.post<ApiResponse<RecentProject>>(`${this.base}/recent-projects`, payload));
  }

  updateRecentProject(id: number, payload: RecentProjectPayload): Observable<RecentProject> {
    return this.unwrap(
      this.http.patch<ApiResponse<RecentProject>>(`${this.base}/recent-projects/${id}`, payload),
    );
  }

  deleteRecentProject(id: number): Observable<RecentProject> {
    return this.unwrap(this.http.delete<ApiResponse<RecentProject>>(`${this.base}/recent-projects/${id}`));
  }

  reorderRecentProjects(locale: Locale, ids: number[]): Observable<RecentProject[]> {
    const params = new HttpParams().set('locale', locale);
    return this.unwrap(
      this.http.put<ApiResponse<RecentProject[]>>(`${this.base}/recent-projects/order`, { ids }, { params }),
    );
  }

  // ---- previous work ------------------------------------------------------

  listExperiences(locale?: Locale, type?: ExperienceType): Observable<Experience[]> {
    let params = new HttpParams();
    if (locale) params = params.set('locale', locale);
    if (type) params = params.set('type', type);

    return this.unwrap(this.http.get<ApiResponse<Experience[]>>(`${this.base}/experiences`, { params }));
  }

  createExperience(type: ExperienceType, locale: Locale): Observable<Experience> {
    return this.unwrap(
      this.http.post<ApiResponse<Experience>>(`${this.base}/experiences`, { type, locale }),
    );
  }

  deleteExperience(id: number): Observable<Experience> {
    return this.unwrap(this.http.delete<ApiResponse<Experience>>(`${this.base}/experiences/${id}`));
  }

  addCompany(experienceId: number, name: string): Observable<ExperienceCompany> {
    return this.unwrap(
      this.http.post<ApiResponse<ExperienceCompany>>(`${this.base}/experiences/${experienceId}/companies`, {
        name,
      }),
    );
  }

  updateCompany(id: number, name: string): Observable<ExperienceCompany> {
    return this.unwrap(
      this.http.patch<ApiResponse<ExperienceCompany>>(`${this.base}/experience-companies/${id}`, { name }),
    );
  }

  deleteCompany(id: number): Observable<ExperienceCompany> {
    return this.unwrap(
      this.http.delete<ApiResponse<ExperienceCompany>>(`${this.base}/experience-companies/${id}`),
    );
  }

  reorderCompanies(experienceId: number, ids: number[]): Observable<Experience> {
    return this.unwrap(
      this.http.put<ApiResponse<Experience>>(`${this.base}/experiences/${experienceId}/companies/order`, {
        ids,
      }),
    );
  }

  addWork(companyId: number, description: string, year: number | null): Observable<ExperienceWork> {
    return this.unwrap(
      this.http.post<ApiResponse<ExperienceWork>>(`${this.base}/experience-companies/${companyId}/works`, {
        description,
        year,
      }),
    );
  }

  updateWork(
    id: number,
    changes: { description?: string; year?: number | null },
  ): Observable<ExperienceWork> {
    return this.unwrap(
      this.http.patch<ApiResponse<ExperienceWork>>(`${this.base}/experience-works/${id}`, changes),
    );
  }

  deleteWork(id: number): Observable<ExperienceWork> {
    return this.unwrap(this.http.delete<ApiResponse<ExperienceWork>>(`${this.base}/experience-works/${id}`));
  }

  reorderWorks(companyId: number, ids: number[]): Observable<ExperienceWork[]> {
    return this.unwrap(
      this.http.put<ApiResponse<ExperienceWork[]>>(
        `${this.base}/experience-companies/${companyId}/works/order`,
        { ids },
      ),
    );
  }

  // ---- jobs ---------------------------------------------------------------

  listRecruitments(locale?: Locale): Observable<Recruitment[]> {
    const params = locale ? new HttpParams().set('locale', locale) : undefined;
    return this.unwrap(this.http.get<ApiResponse<Recruitment[]>>(`${this.base}/recruitments`, { params }));
  }

  createRecruitment(payload: RecruitmentPayload): Observable<Recruitment> {
    return this.unwrap(this.http.post<ApiResponse<Recruitment>>(`${this.base}/recruitments`, payload));
  }

  updateRecruitment(id: number, payload: RecruitmentPayload): Observable<Recruitment> {
    return this.unwrap(this.http.patch<ApiResponse<Recruitment>>(`${this.base}/recruitments/${id}`, payload));
  }

  deleteRecruitment(id: number): Observable<Recruitment> {
    return this.unwrap(this.http.delete<ApiResponse<Recruitment>>(`${this.base}/recruitments/${id}`));
  }

  reorderRecruitments(locale: Locale, ids: number[]): Observable<Recruitment[]> {
    const params = new HttpParams().set('locale', locale);
    return this.unwrap(
      this.http.put<ApiResponse<Recruitment[]>>(`${this.base}/recruitments/order`, { ids }, { params }),
    );
  }

  // ---- logo and PDF -------------------------------------------------------

  listDocuments(kind?: DocumentKind): Observable<SiteDocument[]> {
    const params = kind ? new HttpParams().set('kind', kind) : undefined;
    return this.unwrap(this.http.get<ApiResponse<SiteDocument[]>>(`${this.base}/documents`, { params }));
  }

  createDocument(payload: DocumentPayload): Observable<SiteDocument> {
    return this.unwrap(this.http.post<ApiResponse<SiteDocument>>(`${this.base}/documents`, payload));
  }

  updateDocument(id: number, payload: DocumentPayload): Observable<SiteDocument> {
    return this.unwrap(this.http.patch<ApiResponse<SiteDocument>>(`${this.base}/documents/${id}`, payload));
  }

  deleteDocument(id: number): Observable<SiteDocument> {
    return this.unwrap(this.http.delete<ApiResponse<SiteDocument>>(`${this.base}/documents/${id}`));
  }
}
