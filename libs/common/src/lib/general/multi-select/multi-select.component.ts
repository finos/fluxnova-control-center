import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SubSink } from 'subsink';

@Component({
  selector: 'fluxnova-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  standalone: false,
})
export class MultiSelectComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('selectedDisplay') selectedDisplay?: ElementRef;
  @ViewChild('select') ngSelect?: NgSelectComponent;
  @Input() loadingTemplateRef?: TemplateRef<any>;
  @Input() optionTemplateRef?: TemplateRef<any>;
  @Input() optionTemplateContext: any = {};
  @Input() labelForId?: string;
  @Input() dropdownClass? = '';
  @Input() disabled?: boolean;
  @Input() selectedArray?: any[];
  @Input() options?: any[];
  @Input() bindLabel = 'label';
  @Input() bindValue = 'value';
  @Input() placeholder = 'Select Items';
  @Input() loading = false;
  @Input() appendTo? = null;
  @Input() typeahead = new Subject<string>();
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() dropdownPosition: 'top' | 'bottom' | 'right' | 'left' | 'auto' = 'auto';
  @Input() allowAddNewItems = false;
  @Input() addTagText = 'Type to search';
  @Input() notFoundText = 'No items found';
  @Input() maxSelectedItems: number | undefined;
  @Input() defaultSelected = false;
  @Output() multiSelectionChange: EventEmitter<any> = new EventEmitter();
  @Output() clear: EventEmitter<any> = new EventEmitter();
  numberOfLabelsToDisplay = 0;
  public resize$ = new Subject<void>();
  public resizeObserver?: ResizeObserver;
  private subs = new SubSink();

  ngAfterViewInit() {
    this.subs.add(
      this.resize$.pipe(debounceTime(100)).subscribe(() => {
        this.updateNumberOfDisplayedItems();
      }),
    );

    if (this.ngSelect?.element) {
      this.resizeObserver = new ResizeObserver(() => this.resize$.next());
      this.resizeObserver.observe(this.ngSelect.element);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.options || changes.selectedArray) {
      this.options = this.options?.map((x) => ({ ...x, disabled: this.isMultiOptionItemSelected(x) }));
    }
    if (changes.selectedArray) {
      setTimeout(() => this.updateNumberOfDisplayedItems());
    }
  }

  onAddTag(name: string) {
    return {
      [this.bindValue]: name,
      [this.bindLabel]: name,
    };
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.subs.unsubscribe();
  }

  getItemTemplateContext(item: any) {
    return { ...this.optionTemplateContext, item };
  }

  isMultiOptionItemSelected(item: any) {
    return !!this.selectedArray?.find((x) => x[this.bindValue] === item[this.bindValue]);
  }

  handleMultiSelectChange(selectedArray: any[]) {
    this.multiSelectionChange.emit(selectedArray);
  }

  handleClear() {
    this.ngSelect?.close();
    this.ngSelect?.blur();
    this.multiSelectionChange.emit();
  }

  removeSelectItem(item: any) {
    const selectedArray = this.selectedArray?.filter((selected) => selected[this.bindValue] !== item[this.bindValue]);
    this.multiSelectionChange.emit(selectedArray || []);
  }

  updateNumberOfDisplayedItems() {
    if (this.defaultSelected) {
      this.numberOfLabelsToDisplay = 0;
    } else if (this.selectedDisplay && this.selectedArray?.length) {
      const labelMargin = 5;
      const selectedOptionLabelWidths = this.selectedArray.map(
        (x: any, i: number) => this.selectedDisplay?.nativeElement.children[i].clientWidth + labelMargin,
      );
      this.numberOfLabelsToDisplay = this.itemsToDisplay(selectedOptionLabelWidths);
    }
  }

  isLabelHidden(i: number) {
    return this.numberOfLabelsToDisplay < i + 1;
  }

  itemsToDisplay(selectedOptionLabelWidths: number[]) {
    const numberOfSelectedItems = selectedOptionLabelWidths.length;
    const minWidthOfInput = 8;
    const widthOfMoreLabel = 65;
    const widthOfTotalSelectedLabel = 85;
    const multiOptionsWrapperWidth = selectedOptionLabelWidths.reduce((acc, curr) => acc + curr, 0);
    const ngValueContainerWdith = this.selectedDisplay?.nativeElement.parentElement.clientWidth;
    if (multiOptionsWrapperWidth <= ngValueContainerWdith - minWidthOfInput) {
      return numberOfSelectedItems;
    } else if (numberOfSelectedItems === 1) {
      return selectedOptionLabelWidths[0] > widthOfTotalSelectedLabel ? 0 : 1;
    } else {
      let visibleLabelsWidth = 0;
      let numberOfVisibleLabels = 0;
      let numberOfVisibleLabelsWithOverflowLabel = 0;
      for (let i = 0; i < selectedOptionLabelWidths.length; i++) {
        const labelWidth = selectedOptionLabelWidths[i];
        if (visibleLabelsWidth + labelWidth <= ngValueContainerWdith - minWidthOfInput) {
          numberOfVisibleLabels++;
        }
        if (visibleLabelsWidth + labelWidth <= ngValueContainerWdith - (minWidthOfInput + widthOfMoreLabel)) {
          numberOfVisibleLabelsWithOverflowLabel++;
        }
        visibleLabelsWidth += labelWidth;
      }

      return numberOfSelectedItems > numberOfVisibleLabels
        ? numberOfVisibleLabelsWithOverflowLabel
        : numberOfVisibleLabels;
    }
  }
}
