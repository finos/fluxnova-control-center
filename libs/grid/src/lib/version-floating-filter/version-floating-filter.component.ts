import { Component, OnInit } from '@angular/core';
import { DefaultFloatingFilterComponent } from '../default-floating-filter/default-floating-filter.component';

@Component({
  selector: 'fluxnova-version-floating-filter',
  templateUrl: './version-floating-filter.component.html',
  styleUrls: ['./version-floating-filter.component.scss'],
  standalone: false,
})
export class VersionFloatingFilterComponent extends DefaultFloatingFilterComponent implements OnInit {
  isLatestVersionSelected = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.isLatestVersionSelected = params['toggleFilters']?.includes('latestVersion');
    });
  }

  clear() {
    this.currentFilter = undefined;
    this.updateFilterModel();
  }

  enforceMin(value: any) {
    if (value.currentTarget.value < 1 && value.currentTarget.value !== '') {
      this.currentFilter = '1';
    }
  }
}
