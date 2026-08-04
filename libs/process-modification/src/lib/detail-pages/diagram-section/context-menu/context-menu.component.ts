import {
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { SubSink } from 'subsink';
import { of } from 'rxjs';
import { ItemType } from '@fxn/types';
import { PimCommandStackService } from '../pim-command-stack.service';
import { ContextMenuItemComponent } from './context-menu-item.component';
import { ContextMenuItemAction } from './context-menu-item.service';

export interface ContextMenuOptions {
  items: { iconName: string; title: string; action: string }[];
  target: any;
  targetIsActive?: boolean;
}

export interface ContextMenuClickEvent {
  action: ContextMenuItemAction;
  target: any;
  original?: ContextMenuClickEvent;
}

const HIDDEN = 'hidden';
const VISIBLE = 'visible';

@Component({
  selector: 'fluxnova-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
  standalone: false,
})
export class ContextMenuComponent {
  private win = inject<Window>(WINDOW);
  private commandStack = inject(PimCommandStackService);

  @Output() itemClickEvent = new EventEmitter<ContextMenuClickEvent>();

  @ViewChild('contextMenu')
  private contextMenu!: ElementRef<HTMLDivElement>;

  @ViewChild('contextMenuItems', { read: ViewContainerRef })
  private contextMenuItemsContainer!: ViewContainerRef;

  private menuItems: ComponentRef<ContextMenuItemComponent>[] = [];
  private menuItemSubs: SubSink = new SubSink();
  private target: any;

  protected contextMenuStyle: Partial<CSSStyleDeclaration> = {
    visibility: HIDDEN,
    left: '0px',
    top: '0px',
  };

  @Input()
  public detailItem?: { itemType: ItemType; itemId: string };

  public init(options: ContextMenuOptions) {
    this.contextMenuItemsContainer.clear();
    this.menuItemSubs.unsubscribe();
    this.menuItems = [];
    this.target = options.target;
    let componentRef: ComponentRef<ContextMenuItemComponent>;

    for (const item of options.items) {
      componentRef = this.contextMenuItemsContainer.createComponent(ContextMenuItemComponent);
      componentRef.setInput('action', item.action);
      componentRef.setInput('iconName', item.iconName);
      componentRef.setInput('title', item.title);

      if (item.action === ContextMenuItemAction.REDO)
        componentRef.setInput('disabled', this.commandStack.undoStack.length === 0);
      else if (item.action === ContextMenuItemAction.UNDO)
        componentRef.setInput('disabled', this.commandStack.stack.length === 0);
      else
        componentRef.setInput(
          'disabled',
          this.isActionDisabled(item.action as ContextMenuItemAction, options.targetIsActive),
        );

      this.menuItemSubs.add(
        componentRef.instance.itemClickEvent.subscribe((action) => {
          let original: ContextMenuClickEvent | undefined;

          this.close();

          if (item.action === ContextMenuItemAction.REDO) {
            this.commandStack.redo();

            original = {
              action: this.commandStack.top().type,
              target: this.commandStack.top().target,
            };
          } else if (item.action === ContextMenuItemAction.UNDO) {
            original = {
              action: this.commandStack.top().type,
              target: this.commandStack.top().target,
            };

            this.commandStack.undo();
          }

          this.itemClickEvent.emit({
            action: action as ContextMenuItemAction,
            target: this.target,
            ...(original && { original }),
          });
        }),
      );

      this.menuItems.push(componentRef);
    }
    return of(true);
  }

  public open(mouseX: number, mouseY: number) {
    if (this.menuItems.length) {
      this.calculatePosition(mouseX, mouseY);
      this.contextMenuStyle.visibility = VISIBLE;
    } else this.close();
  }

  public close() {
    this.contextMenuStyle.visibility = HIDDEN;
  }

  private calculatePosition(mouseX: number, mouseY: number) {
    const menuHeight = this.contextMenu.nativeElement.getBoundingClientRect().height || 0;
    const menuWidth = this.contextMenu.nativeElement.getBoundingClientRect().width || 0;
    const windowWidth = this.win.innerWidth || 0;
    const windowHeight = this.win.innerHeight || 0;

    // Set to default position
    this.contextMenuStyle.left = `${mouseX}px`;
    this.contextMenuStyle.top = `${mouseY}px`;

    if (mouseX + menuWidth > windowWidth) {
      // position to the left of the mouse rather than to the right
      this.contextMenuStyle.left = `${mouseX - menuWidth}px`;
    }
    if (mouseY + menuHeight > windowHeight) {
      // position above the mouse rather than below.
      this.contextMenuStyle.top = `${mouseY - menuHeight}px`;
    }
  }

  public isActionDisabled(action: ContextMenuItemAction, targetIsActive: boolean = false): boolean {
    return (
      this.commandStack.containsCommandForElement(this.target) ||
      (action === ContextMenuItemAction.ADD_TOKEN && targetIsActive) ||
      (action === ContextMenuItemAction.REMOVE_TOKEN && !targetIsActive)
    );
  }
}
