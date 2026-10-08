import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSearchInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="search-wrap">
      <i class="pi pi-search search-icon"></i>
      <input
        pInputText
        type="text"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (keyup.enter)="enterPress.emit(value)"
        (keypress)="keypress.emit($event)"
        (paste)="paste.emit($event)"
      />
    </div>
  `,
  styleUrls: ['./app-search-input.component.scss'],
})
export class AppSearchInputComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'Search...';

  @Output() enterPress = new EventEmitter<string>();
  @Output() keypress = new EventEmitter<KeyboardEvent>();
  @Output() paste = new EventEmitter<ClipboardEvent>();

  value: string = '';

  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this._onChange(val);
  }

  onBlur(): void {
    this._onTouched();
  }

  writeValue(val: string): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_: boolean): void {}
}
