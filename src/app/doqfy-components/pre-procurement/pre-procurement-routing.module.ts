import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcurementListingComponent } from './procurement-listing/procurement-listing.component';
import { ProcurementViewComponent } from './procurement-view/procurement-view.component';
import { ProcurementCreateComponent } from './procurement-create/procurement-create.component';
import { ProcurementBulkComponent } from './procurement-bulk/procurement-bulk.component';

const routes: Routes = [

  {
    path: '', pathMatch: 'full', redirectTo: 'procurement-listing'
  },
  {
    path: 'procurement-listing',
    component: ProcurementListingComponent
  },
  {
    path: 'procurement-view',
    component: ProcurementViewComponent
  } ,
  {
    path: 'procurement-create',
    component: ProcurementCreateComponent
  },
  {
  path: 'bulk-upload',
  component: ProcurementBulkComponent
}
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PreProcurementRoutingModule { }