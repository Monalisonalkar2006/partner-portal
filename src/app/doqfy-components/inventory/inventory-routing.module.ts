import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StampInventoryListingComponent } from './stamp-inventory-listing/stamp-inventory-listing.component';
import { InventoryStatusComponent } from './inventory-status/inventory-status.component';
import { StampAvailabilityComponent } from './stamp-availability/stamp-availability.component';
import { WalletOpeningClosingBalanceComponent } from './wallet-opening-closing-balance/wallet-opening-closing-balance.component';

const routes: Routes = [

  {
    path: '', pathMatch: 'full', redirectTo: 'stamp-inventory'
  },
  {
    path: 'stamp-inventory',
    component: StampInventoryListingComponent
  },
  {
    path: 'inventory-status',
    component: InventoryStatusComponent
  },
  {
    path: 'stamp-availability',
    component: StampAvailabilityComponent
  },
  {
    path: 'wallet-opening-closing-balance',
    component: WalletOpeningClosingBalanceComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
