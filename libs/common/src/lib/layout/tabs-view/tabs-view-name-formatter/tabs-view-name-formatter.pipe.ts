import { Pipe, PipeTransform } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

@Pipe({
  name: 'tabsViewNameFormatterPipe',
  standalone: false,
})
export class TabsViewNameFormatterPipe implements PipeTransform {
  titleCasePipe = new TitleCasePipe();

  transform(value: string, enforceCapitalCase: boolean, countInstances: number | undefined) {
    let display = value;

    display = this.getFormattedForDashesToSpaces(display);

    display = enforceCapitalCase ? this.getFormattedForUpperCase(display) : display;

    display = countInstances === undefined ? display : this.getFormattedForCountCase(display, countInstances as number);

    return display;
  }

  private getFormattedForDashesToSpaces(str: string) {
    return str.replace(/-/g, ' ');
  }

  private getFormattedForUpperCase(str: string) {
    return this.titleCasePipe.transform(str);
  }

  private getFormattedForCountCase(str: string, countInstances: number) {
    const countDisplay = countInstances >= 1000 ? '1000+' : `${countInstances}`;

    return `${str} (${countDisplay})`;
  }
}
