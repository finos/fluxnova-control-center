import { Component, inject, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GeneralModule } from '../general.module';

@Component({
  selector: 'fluxnova-tooltip-info-modal',
  templateUrl: './tooltip-info-modal.component.html',
  styleUrls: ['./tooltip-info-modal.component.scss'],
  imports: [GeneralModule],
})
export class TooltipInfoModalComponent implements OnInit {
  modal = inject(NgbActiveModal);

  @Input() text = '';
  @Input() title? = '';
  public toolTipTitle?: string;
  public copyTextLabel?: string;

  ngOnInit(): void {
    this.toolTipTitle = 'Copy ' + this.title;
    this.copyTextLabel = this.title;
  }
}
