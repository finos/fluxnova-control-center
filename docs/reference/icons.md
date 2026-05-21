# Icons

The Fluxnova Control Center uses custom icons contained in a SVG sprite that is maintained in a file called
`icons.svg` under the `libs/common/src/assets` directory. To add an icon to this file, open the SVG
in a text editor and copy the XML (everything inside the `svg` tag) from the new SVG into a new
`symbol` tag inside the `icons.svg` file and make sure to give it a meaningful ID (e.g.
`id="new-icon-id"`).

To make it easier to consume the icons in the Angular app, the `IconComponent` (selector:
`fluxnova-icon`) allows you to reference icons from the `icons.svg` file by their ID. For example:

- In a component template:
  - ```html
    <fluxnova-icon iconName="new-icon-id" class="any-styling classes here"></fluxnova-icon>
    ```

- In component source:
  - ```javascript
    this.icon = 'new-icon-id';
    ```

### Coloring icons

There are two ways to set the color of an icon:

- by setting the `fill` attribute for the symbol or any of its child paths in the svg file, which
  will set a static color for that icon that cannot be overridden. Setting this to `currentColor`
  will make the icon take on the font color of its parent element, allowing for dynamic coloring via
  CSS. The downside of this approach is that it makes it difficult to use the same icon in different
  colors in different places in the app, since the color is determined by the CSS of the parent
  element.
- by explicitly setting a color via the `color` prop on the icon component class. In order for this
  to work, the icon's svg cannot have any `fill` attributes, otherwise those will override the color
  passed to the `color` prop.

  ```html
  <fluxnova-icon [iconName]="icon" color="primary"></fluxnova-icon>
  <!-- or -->
  <fluxnova-icon [iconName]="icon" color="#000fff"></fluxnova-icon>
  ```
