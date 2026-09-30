import { Component, input, output } from '@angular/core';
import { FlowingMenuItemComponent } from './flowing-menu-item.component';
import { FlowingMenuItem } from './flowing-menu.model';

/**
 * FlowingMenu de React Bits, portado a Angular.
 * Menu vertical a pantalla completa: cada item revela al pasar el mouse un
 * marquee con su texto repetido y su foto.
 */
@Component({
  selector: 'app-flowing-menu',
  standalone: true,
  imports: [FlowingMenuItemComponent],
  template: `
    <div class="menu-wrap" [style.background-color]="bgColor()">
      <nav class="menu">
        @for (item of items(); track item.link) {
          <app-flowing-menu-item
            [link]="item.link"
            [text]="item.text"
            [image]="item.image"
            [speed]="speed()"
            [textColor]="textColor()"
            [marqueeBgColor]="marqueeBgColor()"
            [marqueeTextColor]="marqueeTextColor()"
            [borderColor]="borderColor()"
            (navegar)="navegar.emit($event)"
          />
        }
      </nav>
    </div>
  `,
  styles: `
    .menu-wrap {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .menu {
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  `,
})
export class FlowingMenuComponent {
  items = input<FlowingMenuItem[]>([]);
  speed = input(15);
  textColor = input('#ffffff');
  bgColor = input('#120F17');
  marqueeBgColor = input('#ffffff');
  marqueeTextColor = input('#120F17');
  borderColor = input('#ffffff');

  navegar = output<{ ev: MouseEvent; link: string }>();
}
