import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from '../guards/auth.guard';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DocumentsAdminComponent } from './components/documents-admin/documents-admin.component';
import { HomeAdminComponent } from './components/home-admin/home-admin.component';
import { JobAdminComponent } from './components/job-admin/job-admin.component';
import { LoginComponent } from './components/login/login.component';
import { MediaAdminComponent } from './components/media-admin/media-admin.component';
import { PreviousWorkAdminComponent } from './components/previous-work-admin/previous-work-admin.component';

const routes: Routes = [
  // The login page sits outside the shell, and turns an already signed-in editor straight around
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  {
    path: '',
    component: AdminLayoutComponent,
    // One guard for the whole area: anything under /admin needs a session. The API enforces it
    // again on every request, so this only decides what the browser is allowed to render.
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'home', component: HomeAdminComponent },
      { path: 'previous-work', component: PreviousWorkAdminComponent },
      { path: 'job', component: JobAdminComponent },
      { path: 'documents', component: DocumentsAdminComponent },
      { path: 'media', component: MediaAdminComponent },
      { path: '**', redirectTo: '' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
