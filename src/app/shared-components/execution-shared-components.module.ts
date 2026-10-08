import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Avatar } from 'primeng/avatar';
import { Drawer } from 'primeng/drawer';
import { Menubar } from 'primeng/menubar';
import { SharedComponentsModule } from './shared-components.module';
import { AppDropdownComponent } from './app-dropdown/app-dropdown.component';
import { AppMultiselectDropdownComponent } from './app-multiselect-dropdown/app-multiselect-dropdown.component';
import { AppSearchInputComponent } from './app-search-input/app-search-input.component';
import { AppTabViewComponent } from './app-tab-view/app-tab-view.component';
import { DataTableComponent } from './data-table/data-table.component';
import { AppColumnChooserComponent } from './data-table/column-chooser.component';
import { AppTableCellDirective } from './data-table/table-cell.directive';
import { RowActionStopDirective } from './data-table/row-action-stop.directive';
import { AppTableFooterDirective } from './data-table/table-footer.directive';
import { AppIconActionDirective } from './data-table/icon-action.directive';
import { TablePaginationComponent } from './table-pagination/table-pagination.component';

@NgModule({
  declarations: [
    AppDropdownComponent,
    AppMultiselectDropdownComponent,
    AppSearchInputComponent,
    AppTabViewComponent,
    DataTableComponent,
    AppColumnChooserComponent,
    AppTableCellDirective,
    RowActionStopDirective,
    AppTableFooterDirective,
    AppIconActionDirective,
    TablePaginationComponent,
  ],
  imports: [
    CommonModule,
    ConfirmDialogModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    DialogModule,
    MultiSelectModule,
    PaginatorModule,
    TableModule,
    Avatar,
    Button,
    DatePicker,
    Drawer,
    Menubar,
    SelectModule,
    SharedComponentsModule,
  ],
  exports: [
    AppDropdownComponent,
    AppMultiselectDropdownComponent,
    AppSearchInputComponent,
    AppTabViewComponent,
    DataTableComponent,
    AppColumnChooserComponent,
    AppTableCellDirective,
    RowActionStopDirective,
    AppTableFooterDirective,
    AppIconActionDirective,
    TablePaginationComponent,
    ConfirmDialogModule,
    DatePicker,
    DialogModule,
    MultiSelectModule,
    PaginatorModule,
    TableModule,
    Avatar,
    Button,
    Drawer,
    Menubar,
    SelectModule,
    SharedComponentsModule,
  ],
})
export class ExecutionSharedComponentsModule {}
