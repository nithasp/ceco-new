import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ApiResponse,
  HeaderHomePage,
  HeaderHomePageSlide,
  RecentProject,
  Experiences,
  Recruitments,
  Pdfs,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class CmsService {
  url: string = 'https://api.beonit.xyz/strapi';
  currentLanguage = new BehaviorSubject<string>('th');
  isLoading = new BehaviorSubject<boolean>(true);

  homeSlide1 = new BehaviorSubject<HeaderHomePageSlide[]>([]);
  currentHomeSlide1 = new BehaviorSubject<number>(0);

  recentProjectGlobalSlide = new BehaviorSubject<RecentProject[]>([]);

  experienceItems = new BehaviorSubject<Experiences | undefined>(undefined);
  experienceType = new BehaviorSubject<string>('installation');

  recruitmentsItemsGlobal = new BehaviorSubject<Recruitments[]>([]);

  constructor(private httpClient: HttpClient) {}

  getHeaderSlide(lang: string = this.currentLanguage.value) {
    return this.httpClient.get<ApiResponse<HeaderHomePage>>(
      `${this.url}/api/headers?locale=${lang}&populate%5B%5D=*&populate%5B%5D=Slides.Image`
    );
  }

  getRecentProject(lang: string = this.currentLanguage.value) {
    return this.httpClient.get<ApiResponse<RecentProject>>(
      `${this.url}/api/recents?locale=${lang}&populate=*`
    );
  }

  getExperiences(lang: string = this.currentLanguage.value) {
    return this.httpClient.get<ApiResponse<Experiences>>(
      `${this.url}/api/experiences?locale=${lang}&populate[]=company.work`
    );
  }

  getRecruitments(lang: string = this.currentLanguage.value) {
    return this.httpClient.get<ApiResponse<Recruitments>>(
      `${this.url}/api/recruitments/?locale=${lang}`
    );
  }

  getCompanyProfile() {
    return this.httpClient.get<ApiResponse<Pdfs>>(
      `${this.url}/api/pdfs?populate=*`
    );
  }

  getCompanyLogo() {
    return this.httpClient.get<any>(
      `${this.url}/api/logos/?lang=all&populate[]=image`
    );
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
