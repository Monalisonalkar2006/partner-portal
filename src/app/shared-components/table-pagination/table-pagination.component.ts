import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';

export interface PaginationChangeEvent {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
}

@Component({
  selector: 'app-table-pagination',
  templateUrl: './table-pagination.component.html',
  styleUrls: ['./table-pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TablePaginationComponent {
  @Input() first: number = 0;
  @Input() rows: number = 10;
  @Input() totalRecords: number = 0;
  @Input() rowsPerPageOptions: number[] = [10, 20, 30, 50, 100];

  @Output() pageChange = new EventEmitter<PaginationChangeEvent>();
  @Output() rowsChange = new EventEmitter<any>();

  jumpPageValue: number | null = null;
  jumpPageError: string = '';

  get currentPage(): number {
    if (!this.rows) return 1;
    return Math.floor(this.first / this.rows) + 1;
  }

  get totalPages(): number {
    if (!this.rows) return 0;
    return Math.ceil(this.totalRecords / this.rows);
  }

  onPageChange(event: any): void {
    if (event.rows !== this.rows) {
      this.rowsChange.emit(event.rows);
    }
    this.pageChange.emit(event);
  }

  onRowsChange(event: any): void {
    this.rowsChange.emit(event);
  }

  goToPage(): void {
    const page = Number(this.jumpPageValue);

    if (!this.jumpPageValue && this.jumpPageValue !== 0) {
      this.jumpPageError = 'Enter a page number';
      return;
    }
    if (!Number.isInteger(page) || page < 1 || page > this.totalPages) {
      this.jumpPageError = `Enter a page between 1 and ${this.totalPages}`;
      return;
    }

    this.jumpPageError = '';
    this.jumpPageValue = null;
    if (page === this.currentPage) return;

    const first = (page - 1) * this.rows;
    this.pageChange.emit({ first, rows: this.rows, page: page - 1, pageCount: this.totalPages });
  }
}
