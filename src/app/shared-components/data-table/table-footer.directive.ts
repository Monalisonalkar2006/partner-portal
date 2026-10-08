import { Directive, TemplateRef, Host, OnInit } from '@angular/core';
import { DataTableComponent } from './data-table.component';

/**
 * Registers an `<ng-template appTableFooter>` as the table's footer row(s)
 * (e.g. a subtotal row), rendered below the data rows and above pagination.
 */
@Directive({
  selector: '[appTableFooter]',
  standalone: false,
})
export class AppTableFooterDirective implements OnInit {
  constructor(
    private templateRef: TemplateRef<any>,
    @Host() private table: DataTableComponent,
  ) {}

  ngOnInit(): void {
    this.table.registerFooterTemplate(this.templateRef);
  }
}
