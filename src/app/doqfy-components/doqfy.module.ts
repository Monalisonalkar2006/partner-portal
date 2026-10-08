import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminFrequentlyUsedComponent } from './admin-dashboard/admin-frequently-used/admin-frequently-used.component';
import { AdminSideNavComponent } from './admin-dashboard/admin-side-nav/admin-side-nav.component';
import { ChartComponent } from './dashboard/chart/chart.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FrequentlyUsedComponent } from './dashboard/frequently-used/frequently-used.component';
import { OrderDashboardComponent } from './dashboard/order-dashboard/order-dashboard.component';
import { SideNavComponent } from './dashboard/side-nav/side-nav.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { ExecutionSharedComponentsModule } from '../shared-components/execution-shared-components.module';
import { LayoutModule } from '../layout/layout.module';

const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'admin-dashboard', component: AdminDashboardComponent },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./inventory/inventory.module').then(
            (module) => module.InventoryModule,
          ),
      },
      {
        path: 'pre-procurement',
        loadChildren: () =>
          import('./pre-procurement/pre-procurement.module').then(
            (module) => module.PreProcurementModule,
          ),
      },
    ],
  },
];

@NgModule({
  declarations: [
    LandingPageComponent,
    DashboardComponent,
    ChartComponent,
    FrequentlyUsedComponent,
    OrderDashboardComponent,
    SideNavComponent,
    AdminDashboardComponent,
    AdminFrequentlyUsedComponent,
    AdminSideNavComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExecutionSharedComponentsModule,
    LayoutModule,
    RouterModule.forChild(routes),
  ],
})
export class DoqfyModule {}
