import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TabItem {
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-tab-view',
  templateUrl: './app-tab-view.component.html',
  styleUrls: ['./app-tab-view.component.scss'],
  standalone: false
})
export class AppTabViewComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeIndex: number = 0;
  @Output() activeIndexChange = new EventEmitter<number>();
  @Output() tabChange = new EventEmitter<{ index: number }>();

  select(index: number): void {
    if (index === this.activeIndex) return;
    this.activeIndex = index;
    this.activeIndexChange.emit(index);
    this.tabChange.emit({ index });
  }
}
