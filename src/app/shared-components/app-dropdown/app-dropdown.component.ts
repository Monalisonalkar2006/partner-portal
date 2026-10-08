import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { sortOptions } from '../dropdown-sort.util';

/**
 * Generic single-select dropdown wrapping PrimeNG's <p-select>, styled to look identical to the
 * existing `.custom-dropdown`/global `.p-dropdown` look (see app-dropdown.component.scss). Options
 * are sorted A→Z by default (set `[sort]="false"` on the rare page where order is meaningful, e.g.
 * a status workflow order). The built-in search box (`filter`, on by default) filters whatever
 * `[options]` is currently bound — purely client-side. A page with a very large/paged list can
 * still drive its own backend search exactly as before by binding `(onFilter)`: PrimeNG emits it
 * with the raw search text, the page re-fetches, and re-supplies a new `[options]` array — the two
 * modes aren't exclusive.
 *
 * Usage (drop-in for <p-select>): same attribute/event names as PrimeNG (options, optionLabel,
 * optionValue, placeholder, showClear, filterBy, onChange, onFilter, onClear), plus [(ngModel)] or
 * formControlName via ControlValueAccessor.
 */
@Component({
  selector: 'app-dropdown',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDropdownComponent),
      multi: true,
    },
  ],
  template: `
    <p-select
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
      [readonly]="readonly"
      [editable]="editable"
      [styleClass]="styleClass"
      [appendTo]="appendTo || null"
      [optionDisabled]="optionDisabled || null"
      [dataKey]="dataKey || null"
      [panelStyleClass]="panelStyleClass || null"
      (onChange)="onChange.emit($event)"
      (onFilter)="onFilter.emit($event)"
      (onClear)="onClear.emit()"
      (onBlur)="onBlur.emit($event)"
    >
      <ng-content></ng-content>
    </p-select>
  `,
  styleUrls: ['./app-dropdown.component.scss'],
})
export class AppDropdownComponent implements ControlValueAccessor, OnChanges {
  @Input() options: any[] = [];
  @Input() placeholder: string = '';
  @Input() optionLabel: string = '';
  @Input() optionValue: string = '';
  /** Built-in client-side search box. On by default — this is the generic table's whole point. */
  @Input() filter: boolean = true;
  /** Defaults to `optionLabel` when unset, since that's what the search box should match against. */
  @Input() filterBy: string = '';
  @Input() showClear: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() editable: boolean = false;
  @Input() styleClass: string = '';
  @Input() appendTo?: string;
  /** Matches PrimeNG's own default (true). Set false to show the placeholder instead of auto-selecting
   *  the first option when nothing is bound yet — same as `<p-select [autoDisplayFirst]="false">`. */
  @Input() autoDisplayFirst: boolean = true;
  /** Field name on each option object holding a boolean for "this option is disabled". */
  @Input() optionDisabled?: string;
  /** Field name to track option identity by, for object options (PrimeNG's own `dataKey`). */
  @Input() dataKey?: string;
  /** CSS class for the dropdown panel (PrimeNG's own `panelStyleClass`). */
  @Input() panelStyleClass?: string;
  /** Sorts `options` A→Z (by optionLabel, or the raw value for a plain string array) before display.
   *  Set false only when the option order itself is meaningful and shouldn't be alphabetized. */
  @Input() sort: boolean = true;

  @Output() onChange = new EventEmitter<any>();
  @Output() onFilter = new EventEmitter<any>();
  @Output() onClear = new EventEmitter<void>();
  @Output() onBlur = new EventEmitter<any>();

  value: any = null;
  sortedOptions: any[] = [];

  private _onChange: (v: any) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['optionLabel'] || changes['sort']) {
      this.sortedOptions = this.sort ? sortOptions(this.options, this.optionLabel) : this.options || [];
    }
  }

  get effectiveFilterBy(): string {
    return this.filterBy || this.optionLabel || undefined;
  }

  onValueChange(val: any): void {
    this.value = val;
    this._onChange(val);
    this._onTouched();
  }

  writeValue(val: any): void {
    this.value = val ?? null;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: any) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }
}
