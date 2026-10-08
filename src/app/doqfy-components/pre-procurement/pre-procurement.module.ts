import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';

import { ExecutionSharedComponentsModule } from 'src/app/shared-components/execution-shared-components.module';
import { PreProcurementRoutingModule } from './pre-procurement-routing.module';
import { ProcurementBulkComponent } from './procurement-bulk/procurement-bulk.component';
import { ProcurementCreateComponent } from './procurement-create/procurement-create.component';
import { ProcurementListingComponent } from './procurement-listing/procurement-listing.component';
import { ProcurementParentComponent } from './procurement-parent/procurement-parent.component';
import { ProcurementViewComponent } from './procurement-view/procurement-view.component';

@NgModule({
  declarations: [
    ProcurementParentComponent,
    ProcurementListingComponent,
    ProcurementViewComponent,
    ProcurementCreateComponent,
    ProcurementBulkComponent,
  ],
  imports: [
    CommonModule,
    PreProcurementRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ExecutionSharedComponentsModule,
  ],
  providers: [DatePipe, ConfirmationService],
})
export class PreProcurementModule {}
