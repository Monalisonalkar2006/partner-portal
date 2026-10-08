import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { DataTableComponent } from './data-table.component';

/**
 * Standalone "Configure Columns" trigger + Select All/checkbox dropdown for
 * an <app-data-table>. Drop it wherever it belongs in a page's own filter
 * bar (not on top of the table) and point it at the table via a template
 * reference: <app-data-table #dataTable ...> ... <app-column-chooser [table]="dataTable">.
 */
@Component({
  selector: 'app-column-chooser',
  templateUrl: './column-chooser.component.html',
  styleUrls: ['./column-chooser.component.scss'],
  standalone: false,
})
export class AppColumnChooserComponent {
  @Input() table!: DataTableComponent;

  isOpen = false;

  constructor(private elRef: ElementRef<HTMLElement>) {}

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}
