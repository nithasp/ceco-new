import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ApiResponse,
  Experience,
  ExperienceType,
  HeaderSlide,
  Locale,
  RecentProject,
  Recruitment,
  SiteDocument,
  SiteHeader,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class CmsService {
  private readonly base = `${environment.apiUrl}${environment.apiPrefix}/content`;

  currentLanguage = new BehaviorSubject<Locale>('th');
  isLoading = new BehaviorSubject<boolean>(true);

  homeSlide1 = new BehaviorSubject<HeaderSlide[]>([]);
  currentHomeSlide1 = new BehaviorSubject<number>(0);

  recentProjectGlobalSlide = new BehaviorSubject<RecentProject[]>([]);

  experienceItems = new BehaviorSubject<Experience | undefined>(undefined);
  experienceType = new BehaviorSubject<ExperienceType>('installation');

  recruitmentsItemsGlobal = new BehaviorSubject<Recruitment[]>([]);

  companyLogoUrl = new BehaviorSubject<string>('');
  companyProfileUrl = new BehaviorSubject<string>('');

  constructor(private httpClient: HttpClient) {}

  // Each call unwraps the envelope, so a component works with the content itself. Image and file
  // URLs arrive absolute, so nothing has to be prefixed here.

  getHeaderSlide(lang: Locale = this.currentLanguage.value): Observable<SiteHeader | null> {
    return this.httpClient
      .get<ApiResponse<SiteHeader | null>>(`${this.base}/header`, { params: { locale: lang } })
      .pipe(map((res) => res.data));
  }

  getRecentProject(lang: Locale = this.currentLanguage.value): Observable<RecentProject[]> {
    return this.httpClient
      .get<ApiResponse<RecentProject[]>>(`${this.base}/recent-projects`, { params: { locale: lang } })
      .pipe(map((res) => res.data ?? []));
  }

  getExperiences(lang: Locale = this.currentLanguage.value): Observable<Experience[]> {
    return this.httpClient
      .get<ApiResponse<Experience[]>>(`${this.base}/experiences`, { params: { locale: lang } })
      .pipe(map((res) => res.data ?? []));
  }

  getRecruitments(lang: Locale = this.currentLanguage.value): Observable<Recruitment[]> {
    return this.httpClient
      .get<ApiResponse<Recruitment[]>>(`${this.base}/recruitments`, { params: { locale: lang } })
      .pipe(map((res) => res.data ?? []));
  }

  getCompanyProfile(): Observable<SiteDocument | null> {
    return this.httpClient
      .get<ApiResponse<SiteDocument | null>>(`${this.base}/company-profile`)
      .pipe(map((res) => res.data));
  }

  getCompanyLogo(lang: Locale = this.currentLanguage.value): Observable<SiteDocument | null> {
    return this.httpClient
      .get<ApiResponse<SiteDocument | null>>(`${this.base}/logo`, { params: { locale: lang } })
      .pipe(map((res) => res.data));
  }

  getIsLoading() {
    return this.isLoading.asObservable();
  }

  getHomeSlide1() {
    return this.homeSlide1.asObservable();
  }

  getCurrentHomeSlide1() {
    return this.currentHomeSlide1.asObservable();
  }

  getRecentProjectGlobalSlide() {
    return this.recentProjectGlobalSlide.asObservable();
  }

  getExperienceItems() {
    return this.experienceItems.asObservable();
  }

  getRecruitmentsItemGlobal() {
    return this.recruitmentsItemsGlobal.asObservable();
  }
}
