import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ToastService } from '@fxn/common/src';
import { DecisionDefinitionDiagram, DIAGRAM_TYPE, ProcessDefinitionDiagram } from '@fxn/types';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DiagramService {
  private toastService = inject(ToastService);
  private http = inject(HttpClient);

  public getDiagram(id: string, type: DIAGRAM_TYPE) {
    if (type === DIAGRAM_TYPE.BPMN) return this.getProcessDefinitionDiagram(id);
    else return this.getDecisionDefinitionDiagram(id);
  }

  public getProcessDefinitionDiagram(definitionId: string): Observable<ProcessDefinitionDiagram> {
    return this.http.get<ProcessDefinitionDiagram>(`api/process-definitions/${definitionId}/diagram`).pipe(
      catchError((err) => {
        this.handleError(`Error Loading Diagram: ${err.error.message}`);
        throw new Error(`Error Loading Diagram: ${err.error.message}`);
      }),
    );
  }

  public getDecisionDefinitionDiagram(definitionId: string): Observable<DecisionDefinitionDiagram> {
    return this.http.get<{ id: string; dmnXml: string }>(`api/decision-definition/${definitionId}/xml`).pipe(
      map((result) => ({ definitionId: result.id, xml: result.dmnXml, name: '' })),
      catchError((err) => {
        this.handleError(`Error Loading Diagram: ${err.error.message}`);
        throw new Error(`Error Loading Diagram: ${err.error.message}`);
      }),
    );
  }

  public handleError(errorMessage: string) {
    this.toastService.error(`${errorMessage}`);
    return of({
      error: `${errorMessage}`,
    });
  }
}
