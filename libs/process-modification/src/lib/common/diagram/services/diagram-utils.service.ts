import { Injectable } from '@angular/core';
import { LABEL, PROCESS, SEQUENCE_FLOW } from './diagram.element.types';

interface DiagramElement {
  type: string;
}

@Injectable({ providedIn: 'root' })
export class DiagramUtilsService {
  public elementIsProcess(element: DiagramElement): boolean {
    return !(element.type.indexOf(PROCESS) === -1);
  }

  public elementIsFlow(element: DiagramElement): boolean {
    return !(element.type.indexOf(SEQUENCE_FLOW) === -1);
  }

  public elementIsLabel(element: DiagramElement): boolean {
    return element.type === LABEL;
  }
}
