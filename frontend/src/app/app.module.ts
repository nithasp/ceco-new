// Main
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { httpInterceptor } from './http.interceptor';
import { AppRoutingModule } from './app-routing.module';

// Plugins
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SwiperModule } from 'swiper/angular';
import {
  NgxBootstrapIconsModule,
  geoAltFill,
  telephone,
  envelope,
  receiptCutoff,
  filetypePdf,
  download,
  chevronRight,
  personFill,
  facebook
} from 'ngx-bootstrap-icons';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';


// Components
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './shared/header/header.component';
import { CarouselComponent } from './shared/carousel/carousel.component';
import { Carousel2Component } from './shared/carousel2/carousel2.component';
import { FooterComponent } from './shared/footer/footer.component';
import { JobComponent } from './components/job/job.component';
import { InstallationComponent } from './components/services/installation/installation.component';
import { DesignComponent } from './components/services/design/design.component';
import { CommissioningComponent } from './components/services/commissioning/commissioning.component';
import { MaintenanceComponent } from './components/services/maintenance/maintenance.component';
import { PreviousWorkComponent } from './components/previous-work/previous-work.component';

const icons = {
  geoAltFill,
  telephone,
  envelope,
  receiptCutoff,
  filetypePdf,
  download,
  chevronRight,
  personFill,
  facebook
};

export function httpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    CarouselComponent,
    Carousel2Component,
    FooterComponent,
    JobComponent,
    InstallationComponent,
    DesignComponent,
    CommissioningComponent,
    MaintenanceComponent,
    PreviousWorkComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgbModule,
    SwiperModule,
    HttpClientModule,
    NgxBootstrapIconsModule.pick(icons),

    // Ngx-Translate
    TranslateModule.forRoot({
      defaultLanguage: 'th',
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: httpInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
