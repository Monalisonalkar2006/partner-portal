import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryParentComponent } from './inventory-parent/inventory-parent.component';
import { StampInventoryListingComponent } from './stamp-inventory-listing/stamp-inventory-listing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExecutionSharedComponentsModule } from 'src/app/shared-components/execution-shared-components.module';
import { InventoryStatusComponent } from './inventory-status/inventory-status.component';
import { StampAvailabilityComponent } from './stamp-availability/stamp-availability.component';
import { WalletOpeningClosingBalanceComponent } from './wallet-opening-closing-balance/wallet-opening-closing-balance.component';


@NgModule({
  declarations: [
    InventoryParentComponent,
    StampInventoryListingComponent,
    InventoryStatusComponent,
    StampAvailabilityComponent,
    WalletOpeningClosingBalanceComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    FormsModule,
    ExecutionSharedComponentsModule,
    ReactiveFormsModule
  ]
})
export class InventoryModule { }
