import { Component, Input } from '@angular/core';
import { colors, ThemeColors } from '../../themes';
import Icons from '../../../assets/icons.svg';

@Component({
  selector: 'fluxnova-icon',
  template: `
    <svg [ngStyle]="color ? { color: this.computedColor } : {}" [class]="class" fill="currentColor">
      <use [attr.href]="url" />
    </svg>
  `,
  styleUrls: ['./icon.component.scss'],
  standalone: false,
})
export class IconComponent {
  icons = Icons;
  themeColors = colors['default'];
  @Input() iconName = '';
  @Input() additionalClasses = '';
  @Input() color = '';

  get class() {
    return `fluxnova-icon ${this.additionalClasses}`.trim();
  }

  get computedColor() {
    return this.color[0] === '#' ? this.color : this.themeColors[this.color as keyof ThemeColors];
  }

  get url() {
    return `${this.icons}#${this.iconName}`;
  }
}
