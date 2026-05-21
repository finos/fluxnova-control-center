import { ItemType } from '@fxn/types';

export interface RouteData {
  itemType: ItemType;
  itemTypeClass: string;
  itemTypeListName?: string;
  itemTypeName: string;
  backNavigation?: string;
}

export interface FluxnovaRouteData {
  title?: string;
  headerIcon?: 'logo' | 'menu';
  parentLabel?: string;
  parentPath?: string;
  hideContextBar?: boolean; // defaults to false
  preloadDelay?: number; // provide value greater than 0 to preload lazy modules after preloadDelay milliseconds
  resourceId?: string; // property name in route params that contains the resource id
}
