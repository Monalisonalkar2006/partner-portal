import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { sortOptions } from '../dropdown-sort.util';

/**
 * Generic multi-select dropdown wrapping PrimeNG's <p-multiSelect> — the multi-select sibling of
 * app-dropdown, same rules: A→Z sorted by default, built-in client-side search box on by default,
 * (onFilter) still available for a page that needs to drive its own backend search on top. See
 * app-dropdown.component.ts for the full rationale; kept identical here for consistency.
 *
 * Usage (drop-in for <p-multiSelect>): same attribute/event names as PrimeNG (options, optionLabel,
 * optionValue, placeholder, showClear, filterBy, onChange, onFilter, onClear), plus [(ngModel)] or
 * formControlName via ControlValueAccessor (value is the selected-items array).
 */
@Component({
  selector: 'app-multiselect-dropdown',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppMultiselectDropdownComponent),
      multi: true,
    },
  ],
  template: `
    <p-multiSelect
      [ngModel]="value"
      (ngModelChange)="onValueChange($event)"
      [options]="sortedOptions"
      [placeholder]="placeholder"
      [optionLabel]="optionLabel || null"
      [optionValue]="optionValue || null"
      [filter]="filter"
      [filterBy]="effectiveFilterBy"
      [showClear]="showClear"
      [disabled]="disabled"
      [styleClass]="styleClass"
      [appendTo]="appendTo || null"
      [display]="display"
      [scrollHeight]="scrollHeight"
      [panelStyleClass]="panelStyleClass"
      (onChange)="onChange.emit($event)"
      (onFilter)="onFilter.emit($event)"
      (onClear)="onClear.emit()"
    ><ng-content></ng-content></p-multiSelect>
  `,
  styleUrls: ['./app-multiselect-dropdown.component.scss'],
})
export class AppMultiselectDropdownComponent implements ControlValueAccessor, OnChanges {
  @Input() options: any[] = [];
  @Input() placeholder: string = '';
  @Input() optionLabel: string = '';
  @Input() optionValue: string = '';
  /** Built-in client-side search box. On by default. */
  @Input() filter: boolean = true;
  /** Defaults to `optionLabel` when unset, since that's what the search box should match against. */
  @Input() filterBy: string = '';
  @Input() showClear: boolean = false;
  @Input() disabled: boolean = false;
  @Input() styleClass: string = '';
  @Input() appendTo?: string;
  /** 'comma' (default, matches PrimeNG's own default) or 'chip'. */
  @Input() display: 'comma' | 'chip' = 'comma';
  @Input() scrollHeight: string = '200px';
  @Input() panelStyleClass?: string;
  @Input() baseZIndex: number = 0;
  @Input() autoZIndex: boolean = true;
  /** Sorts `options` A→Z (by optionLabel, or the raw value for a plain string array) before display.
   *  Set false only when the option order itself is meaningful and shouldn't be alphabetized. */
  @Input() sort: boolean = true;

  @Output() onChange = new EventEmitter<any>();
  @Output() onFilter = new EventEmitter<any>();
  @Output() onClear = new EventEmitter<void>();

  value: any[] = [];
  sortedOptions: any[] = [];

  private _onChange: (v: any) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['optionLabel'] || changes['sort']) {
      this.sortedOptions = this.sort ? sortOptions(this.options, this.optionLabel) : this.options || [];
    }
  }

  get effectiveFilterBy(): string {
    return this.filterBy || this.optionLabel || undefined;
  }

  onValueChange(val: any[]): void {
    this.value = val;
    this._onChange(val);
    this._onTouched();
  }

  writeValue(val: any[]): void {
    this.value = val ?? [];
  }

  registerOnChange(fn: (v: any) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
