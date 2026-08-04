import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition } from './default-column-definition';

export const inputOutputColFields = ['name', 'type', 'value'];

export const inputOutputColDefs: { [field: string]: ColDefWithFilterParams } = {
  name: {
    ...defaultColDefinition,
    initialWidth: 330, // Wide enough for a GUID
    headerName: 'Name',
    field: 'clauseName',
  },
  type: {
    ...defaultColDefinition,
    initialWidth: 200,
    headerName: 'Type',
    field: 'type',
  },
  value: {
    ...defaultColDefinition,
    initialWidth: 330, // Wide enough for a GUID
    headerName: 'Value',
    field: 'value',
  },
};
