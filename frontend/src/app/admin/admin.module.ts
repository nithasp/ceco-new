import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DocumentsAdminComponent } from './components/documents-admin/documents-admin.component';
import { HomeAdminComponent } from './components/home-admin/home-admin.component';
import { JobAdminComponent } from './components/job-admin/job-admin.component';
import { LoginComponent } from './components/login/login.component';
import { MediaAdminComponent } from './components/media-admin/media-admin.component';
import { MediaPickerComponent } from './components/media-picker/media-picker.component';
import { PreviousWorkAdminComponent } from './components/previous-work-admin/previous-work-admin.component';
import { NotifyService } from './services/notify.service';

// Lazy-loaded from the 'admin' route, so a visitor to the public site never downloads the CMS
@NgModule({
  declarations: [
    AdminLayoutComponent,
    DashboardComponent,
    DocumentsAdminComponent,
    HomeAdminComponent,
    JobAdminComponent,
    LoginComponent,
    MediaAdminComponent,
    MediaPickerComponent,
    PreviousWorkAdminComponent,
  ],
  imports: [CommonModule, FormsModule, AdminRoutingModule],
  // Scoped to this module: the toast list belongs to the CMS shell and nothing else uses it
  providers: [NotifyService],
})
export class AdminModule {}
