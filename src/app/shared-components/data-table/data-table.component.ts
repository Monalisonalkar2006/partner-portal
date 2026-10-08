import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
} from '@angular/core';
import { DatePipe, CurrencyPipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AnalyticsService } from 'src/app/services/analytics.service';

export interface TableColumn {
  /** Row key to read. Supports dot-paths into nested objects/arrays, e.g. 'estamp_info.0.second_party_name'
   *  — resolved safely (missing/empty intermediate values just resolve to undefined, never throw). */
  field: string;
  header: string;
  width?: string;
  sortable?: boolean;
  /** Field name to emit on (columnSort) when it differs from `field` (e.g. a derived/joined column) */
  sortField?: string;
  template?: TemplateRef<any>;
  /** Current visibility, toggled via <app-column-chooser>. Defaults to true (visible). */
  visible?: boolean;
  /** Set false for a column (e.g. Action) that must always render and never appears in the chooser list. */
  toggleable?: boolean;
  /** Key shown in <app-column-chooser>'s list and emitted on (columnVisibilityChange) when it differs
   *  from `field` (e.g. a persisted backend settings key that doesn't match the render/data field name). */
  visibilityKey?: string;

  /** Computed/aggregated value for a column that isn't a plain field on the row (e.g. summing a nested
   *  array). Receives the raw row; its return value is used in place of resolving `field`. Write your own
   *  "is there any data at all" guard inside it (see calculateTotalStampDuty usage) rather than relying on
   *  the generic empty-value fallback below, since only you know what "no data" means for a computed value. */
  accessorFn?: (row: any) => any;
  /** Shown instead of the resolved value when that value is null, undefined, or an empty string
   *  (e.g. '----', 'NA'). Leave unset to render the empty value as-is (blank cell). */
  fallback?: string;
  /** Built-in Angular pipe to format the resolved value before display, as "name" or "name:arg1:arg2".
   *  Only the first colon separates the pipe name from its args, so a format may itself contain colons.
   *  Supported:
   *    - 'date'      — everything after the first colon is the format, colons included
   *                    (e.g. 'date:dd/MM/yyyy hh:mm a' renders date AND time).
   *    - 'currency'  — 'currency:CODE:display:digitsInfo' (defaults 'INR' / 'symbol').
   *    - 'number'    — 'number:digitsInfo' (e.g. 'number:1.2-2').
   *    - 'titlecase' — takes no args. */
  pipe?: string;
  /** Truncate a string value to this many characters, appending '..'. */
  truncate?: number;
  /** Show the full (untruncated, unpiped) resolved value in a tooltip. Typically paired with `truncate`. */
  tooltip?: boolean;
  /** CSS class(es) for the default cell's wrapping <span> (same shape as [ngClass]), e.g. a column that used
   *  to be a `<span style="...">{{ row.field }}</span>` in its own ng-template just for layout/typography. */
  cellClass?: string | string[] | { [klass: string]: boolean };
  /** Inline style for the default cell's wrapping <span> (same shape as [ngStyle]). */
  cellStyle?: { [key: string]: string };
  /** Set false to lock this column in place when the table's [draggableColumns]="true" — it can't be
   *  picked up itself, and no other column can be dragged past it either (e.g. an Action column that
   *  should always stay last). Has no effect when the table isn't draggable at all. Defaults to true. */
  draggable?: boolean;
}

export interface ColumnVisibility {
  field: string;
  visible: boolean;
}

export interface PageEvent {
  page: number;
  rows: number;
  first: number;
}

/**
 * Generic data table wrapping PrimeNG p-datatable.
 * Header background and row borders are driven by --table-* CSS tokens.
 * Includes: pagination, loading skeleton, empty state, custom cell templates.
 *
 * Usage (simple):
 *   <app-data-table [columns]="cols" [data]="rows" [loading]="busy">
 *   </app-data-table>
 *
 * Usage (custom cell):
 *   <app-data-table [columns]="cols" [data]="rows">
 *     <ng-template appTableCell="status" let-row>
 *       <app-status-badge [status]="row.status"></app-status-badge>
 *     </ng-template>
 *   </app-data-table>
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [DatePipe, CurrencyPipe, DecimalPipe, TitleCasePipe],
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() paginator: boolean = true;
  @Input() rows: number = 10;
  @Input() totalRecords: number = 0;
  @Input() lazy: boolean = false;
  @Input() emptyMessage: string = 'No records found.';
  @Input() scrollable: boolean = false;
  @Input() scrollHeight: string = '400px';
  @Input() rowsPerPageOptions: number[] = [10, 20, 30, 50, 100];
  /** Returns extra CSS class(es) for a body row, e.g. to highlight a selected row */
  @Input() getRowClass?: (row: any) => string;
  /** Shows the row hover-elevation shadow even when no (rowClick) is bound (no cursor/click change) */
  @Input() hoverElevate: boolean = false;
  /** Tab/grid name to tag the automatic row-click GA event with (e.g. 'Individual'). Omit to disable tracking. */
  @Input() analyticsTab?: string;
  /** Set true to let a <app-column-chooser [table]="this"> placed elsewhere on the page control this
   *  table's columns. Defaults to false, so a grid must opt in explicitly before the chooser button
   *  (even if present in markup) will render or take effect for it. */
  @Input() columnChooser: boolean = false;
  /** Set true to let the user drag column headers to reorder them (cdk-drag-drop). Defaults to false —
   *  this is a per-table opt-in set by whoever builds the page, not a user-facing setting, so a grid stays
   *  fixed-order unless the developer explicitly turns it on for that table. */
  @Input() draggableColumns: boolean = false;
  /** Emitted whenever column visibility changes (see <app-column-chooser>). */
  @Output() columnVisibilityChange = new EventEmitter<ColumnVisibility[]>();

  first: number = 0;

  /** Keeps the missing-[columns] warning to one line per instance instead of one per CD pass. */
  private warnedMissingColumns = false;

  /** Keyed cell templates registered via *appTableCell directive */
  readonly cellTemplates = new Map<string, TemplateRef<any>>();
  /** Optional footer row(s) (e.g. a subtotal), registered via *appTableFooter directive */
  footerTemplate: TemplateRef<any> | null = null;

  @Output() pageChange  = new EventEmitter<PageEvent>();
  @Output() rowsChange  = new EventEmitter<number>();
  @Output() rowClick    = new EventEmitter<any>();
  /** Emits the column field name when its sort icon is clicked */
  @Output() columnSort  = new EventEmitter<string>();

  constructor(
    private cdr: ChangeDetectorRef,
    private analyticsService: AnalyticsService,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private decimalPipe: DecimalPipe,
    private titleCasePipe: TitleCasePipe,
  ) {}

  onRowClick(row: any): void {
    if (this.analyticsTab) {
      this.analyticsService.trackViewInteraction(this.analyticsTab, 'row_click');
    }
    this.rowClick.emit(row);
  }

  /** Safely reads a (possibly dot-path, possibly nested-array) value off a row. Never throws — a
   *  missing/empty step along the way just resolves to undefined, matching a manual `?.` chain. */
  private resolvePath(row: any, path: string): any {
    return path.split('.').reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), row);
  }

  /** Runs a built-in pipe named in a `pipe` spec ("name" or "name:arg1:arg2").
   *
   *  Only the FIRST colon is treated as the name/args separator. Everything after it is kept intact as
   *  `argStr`, because a date format legitimately contains colons of its own ('dd/MM/yyyy hh:mm a') —
   *  splitting on every colon would hand DatePipe a half format like 'dd/MM/yyyy hh' and silently drop
   *  the minutes/meridiem. So `date` and `number` take the whole remainder as their single format arg,
   *  while `currency` (whose args never contain colons) splits the remainder into its separate args. */
  private applyPipe(value: any, pipeSpec: string): any {
    const sepIndex = pipeSpec.indexOf(':');
    const name = sepIndex === -1 ? pipeSpec : pipeSpec.slice(0, sepIndex);
    const argStr = sepIndex === -1 ? '' : pipeSpec.slice(sepIndex + 1);

    switch (name) {
      case 'date':
        return this.datePipe.transform(value, argStr || 'mediumDate');
      case 'currency': {
        const args = argStr ? argStr.split(':') : [];
        return this.currencyPipe.transform(value, args[0] || 'INR', args[1] || 'symbol', args[2]);
      }
      case 'number':
        return this.decimalPipe.transform(value, argStr || undefined);
      case 'titlecase':
        return this.titleCasePipe.transform(value);
      default:
        return value;
    }
  }

  /** Resolved + fallback + pipe applied, but not yet truncated — this is what a tooltip should show. */
  getCellValue(row: any, col: TableColumn): any {
    let value = col.accessorFn ? col.accessorFn(row) : this.resolvePath(row, col.field);

    if (value === null || value === undefined || value === '') {
      return col.fallback !== undefined ? col.fallback : value;
    }
    if (col.pipe) {
      value = this.applyPipe(value, col.pipe);
    }
    return value;
  }

  /** What the cell actually renders — same as getCellValue, additionally truncated when configured. */
  getDisplayValue(row: any, col: TableColumn): any {
    const value = this.getCellValue(row, col);
    if (col.truncate && typeof value === 'string' && value.length > col.truncate) {
      return value.slice(0, col.truncate) + '..';
    }
    return value;
  }

  /** `columns`, guaranteed to be an array.
   *
   *  The field initializer above isn't enough on its own: a page that binds [columns] to a property it
   *  never actually declares passes `undefined`, which overwrites the default `[]`. Because the column
   *  getters are called straight from the template (the header/body/empty/loading *ngFors), a raw
   *  `this.columns.filter(...)` would then throw on every change-detection pass. That doesn't just blank
   *  out one grid — the exception escapes mid-render and can leave a host modal half-initialised and its
   *  backdrop stuck, forcing a page refresh. Degrading to an empty grid is the safer failure mode, so
   *  normalise here and warn once in dev instead. */
  private get safeColumns(): TableColumn[] {
    if (!this.columns) {
      if (!this.warnedMissingColumns) {
        this.warnedMissingColumns = true;
        console.warn(
          '[app-data-table] [columns] resolved to null/undefined — rendering an empty table. ' +
            'Check that the bound property exists on the host component.',
        );
      }
      return [];
    }
    return this.columns;
  }

  /** Columns eligible for the chooser list (excludes toggleable: false, e.g. Action). */
  get toggleableColumns(): TableColumn[] {
    return this.safeColumns.filter((c) => c.toggleable !== false);
  }

  /** Columns actually rendered: always-visible ones, plus toggleable ones not hidden by the user. */
  get visibleColumns(): TableColumn[] {
    return this.safeColumns.filter((c) => c.toggleable === false || c.visible !== false);
  }

  isAllColumnsSelected(): boolean {
    const toggleable = this.toggleableColumns;
    return toggleable.length > 0 && toggleable.every((c) => c.visible !== false);
  }

  toggleSelectAllColumns(event: any): void {
    const checked = !!event.target.checked;
    this.toggleableColumns.forEach((c) => (c.visible = checked));
    this.onColumnVisibilityToggle();
  }

  onColumnCheckboxChange(col: TableColumn, event: any): void {
    col.visible = !!event.target.checked;
    this.onColumnVisibilityToggle();
  }

  /** Reorders `columns` in place after a header drag. Indices come from `visibleColumns` (what's actually
   *  rendered), so they're translated back to positions in the full `columns` array by reference — this
   *  keeps reordering correct even when some columns are currently hidden via the column chooser.
   *
   *  A column marked `draggable: false` can't be picked up (enforced via [cdkDragDisabled] in the
   *  template), but that alone wouldn't stop some OTHER column from being dropped into/past its slot,
   *  which would silently shift it. So the target index is also clamped here to the nearest `draggable:
   *  false` columns on either side of the dragged column's original position — it can reorder freely
   *  among its draggable neighbors, but can never cross a locked column. */
  onColumnDrop(event: CdkDragDrop<TableColumn[]>): void {
    if (!this.draggableColumns || event.previousIndex === event.currentIndex) {
      return;
    }
    const visible = this.visibleColumns;
    const draggedCol = visible[event.previousIndex];
    if (!draggedCol || draggedCol.draggable === false) {
      return;
    }
    const fromIndex = this.columns.indexOf(draggedCol);
    let toIndex = this.columns.indexOf(visible[event.currentIndex]);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    let lowerBound = -1;
    let upperBound = this.columns.length;
    this.columns.forEach((c, i) => {
      if (c.draggable === false) {
        if (i < fromIndex) lowerBound = Math.max(lowerBound, i);
        if (i > fromIndex) upperBound = Math.min(upperBound, i);
      }
    });
    toIndex = Math.max(lowerBound + 1, Math.min(toIndex, upperBound - 1));
    if (toIndex === fromIndex) {
      return;
    }

    moveItemInArray(this.columns, fromIndex, toIndex);
    this.cdr.markForCheck();
  }

  onColumnVisibilityToggle(): void {
    this.columnVisibilityChange.emit(
      this.toggleableColumns.map((c) => ({
        field: c.visibilityKey || c.field,
        visible: c.visible !== false,
      })),
    );
    this.cdr.markForCheck();
  }

  registerCellTemplate(field: string, tpl: TemplateRef<any>): void {
    this.cellTemplates.set(field, tpl);
  }

  registerFooterTemplate(tpl: TemplateRef<any>): void {
    this.footerTemplate = tpl;
  }

  getCellTemplate(field: string): TemplateRef<any> | undefined {
    return this.cellTemplates.get(field);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows  = event.rows;
    this.cdr.markForCheck();
    this.pageChange.emit({
      page:  event.page,
      rows:  event.rows,
      first: event.first,
    });
  }

  onRowsChange(rows: number): void {
    this.rowsChange.emit(rows);
  }
}
