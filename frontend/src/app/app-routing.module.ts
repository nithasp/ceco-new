import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InstallationComponent } from './components/services/installation/installation.component';
import { JobComponent } from './components/job/job.component';
import { CommissioningComponent } from './components/services/commissioning/commissioning.component';
import { DesignComponent } from './components/services/design/design.component';
import { MaintenanceComponent } from './components/services/maintenance/maintenance.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'job', component: JobComponent },
  { path: 'installation', component: InstallationComponent },
  { path: 'commissioning', component: CommissioningComponent },
  { path: 'design', component: DesignComponent },
  { path: 'maintenance', component: MaintenanceComponent },
  // The CMS is loaded only when someone actually opens it, so it costs the public site nothing
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { anchorScrolling: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
