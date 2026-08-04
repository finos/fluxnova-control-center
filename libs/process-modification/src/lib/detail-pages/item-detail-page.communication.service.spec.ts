import { describe, expect, it } from 'vitest';
import { ItemDetailPageCommunicationService } from './item-detail-page.communication.service';

describe('Item DetailsPage Communication Service', () => {
  it('should create new subjects when reset is called', () => {
    const comservice = new ItemDetailPageCommunicationService();

    comservice.reloadNeeded$.subscribe(() => {
      //do nothing
    });
    comservice.selectedRowsUpdated$.subscribe(() => {
      //do nothing
    });
    comservice.tabFilterUpdated$.subscribe(() => {
      //do nothing
    });

    expect(comservice.reloadNeeded$.observed).toBe(true);
    expect(comservice.selectedRowsUpdated$.observed).toBe(true);
    expect(comservice.tabFilterUpdated$.observed).toBe(true);

    comservice.reset();

    expect(comservice.reloadNeeded$.observed).toBe(false);
    expect(comservice.selectedRowsUpdated$.observed).toBe(false);
    expect(comservice.tabFilterUpdated$.observed).toBe(false);
  });
});
