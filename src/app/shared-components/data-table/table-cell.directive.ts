import { Directive, Input, OnInit, TemplateRef, Host } from '@angular/core';
import { DataTableComponent } from './data-table.component';

/**
 * Registers an `<ng-template appTableCell="field">` as the custom cell
 * renderer for that column on the enclosing `<app-data-table>`.
 */
@Directive({
  selector: '[appTableCell]',
  standalone: false,
})
export class AppTableCellDirective implements OnInit {
  @Input('appTableCell') field: string;

  constructor(
    private templateRef: TemplateRef<any>,
    @Host() private table: DataTableComponent,
  ) {}

  ngOnInit(): void {
    this.table.registerCellTemplate(this.field, this.templateRef);
  }
}
