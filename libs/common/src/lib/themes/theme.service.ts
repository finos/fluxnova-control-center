import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeName } from '@fxn/types';
import { WINDOW } from 'ngx-window-token';
import { getBpmnColors } from './bpmn-colors';

/**
 * A service meant to assist components in following theming guidelines when they cannot easily utilize scss definitions.
 * Currently, the only use cases are for coloring the modeler and viewer from bpmn-js.
 * */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject<Document>(DOCUMENT);
  private window = inject<Window>(WINDOW);

  /**
   * Returns the colors to be used when displaying bpmn diagrams.
   */
  public getBpmnColors(themeName: ThemeName) {
    return getBpmnColors(themeName);
  }
}
