import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout-routing.module';
import { HeaderNavComponent } from './header-nav/header-nav.component';
import { FooterComponent } from './footer/footer.component';
import { SharedComponentsModule } from '../shared-components/shared-components.module';
import { AccordionModule } from "primeng/accordion";
import { ExecutionSharedComponentsModule } from '../shared-components/execution-shared-components.module';



@NgModule({
  declarations: [
    HeaderNavComponent,
    FooterComponent
  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    SharedComponentsModule,
    ExecutionSharedComponentsModule,
    AccordionModule  ],
  exports: [ 
    HeaderNavComponent,
    FooterComponent]
})
export class LayoutModule { }
