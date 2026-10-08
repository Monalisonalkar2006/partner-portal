import { Directive, Host, HostListener } from '@angular/core';
import { DataTableComponent } from './data-table.component';
import { AnalyticsService } from 'src/app/services/analytics.service';

/**
 * Drop onto an action icon inside an *appTableCell template to fire the
 * 'icon_click' GA event (tagged with the enclosing table's [analyticsTab])
 * whenever it's clicked. The icon's own (click) handler is untouched — this
 * only adds the tracking call alongside it.
 */
@Directive({
  selector: '[appIconAction]',
  standalone: false,
})
export class AppIconActionDirective {
  constructor(
    @Host() private table: DataTableComponent,
    private analyticsService: AnalyticsService,
  ) {}

  @HostListener('click')
  onClick(): void {
    if (this.table.analyticsTab) {
      this.analyticsService.trackViewInteraction(this.table.analyticsTab, 'icon_click');
    }
  }
}
