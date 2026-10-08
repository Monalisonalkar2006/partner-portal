import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Marks a wrapper (action icons, a progress bar, a tooltip target, etc.) as
 * excluded from the enclosing <app-data-table> row's click-to-view and
 * hover-elevation behavior. The wrapped control keeps its own click/hover
 * behavior untouched; it just stops the click from also reaching the row
 * and suppresses the row's hover shadow while the pointer is over it.
 */
@Directive({
  selector: '[appRowActionStop]',
  standalone: false,
})
export class RowActionStopDirective {
  private static readonly SUPPRESS_CLASS = 'app-table__row--suppress-hover';

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.closestRow()?.classList.add(RowActionStopDirective.SUPPRESS_CLASS);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.closestRow()?.classList.remove(RowActionStopDirective.SUPPRESS_CLASS);
  }

  private closestRow(): HTMLElement | null {
    return this.el.nativeElement.closest('tr');
  }
}
