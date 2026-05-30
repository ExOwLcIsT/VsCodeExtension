import { Param } from "./Param";
import { styleKeyToClassName } from "./Style";

/**Blanks to convert WPF Controls into HTML elements*/
interface BlankEntry {
  open: string; // відкриваючий тег без < >
  close: string; // закриваючий тег без < >, або "" якщо непарний
}

const blanks: { [id: string]: BlankEntry } = {
  Border: { open: 'div class="wpf-border"', close: "div" },
  BulletDecorator: { open: 'div class="wpf-bullet-decorator"', close: "div" },
  Canvas: { open: 'div class="wpf-canvas"', close: "div" },
  DockPanel: { open: 'div class="wpf-dock-panel"', close: "div" },
  Expander: { open: 'details class="wpf-expander"', close: "details" },
  Grid: { open: 'div class="wpf-grid table"', close: "div" },
  GridSplitter: { open: "", close: "" },
  "Grid.ColumnDefinitions": { open: "", close: "" },
  "Grid.RowDefinitions": { open: "", close: "" },
  "Grid.ColumnDefinition": {
    open: 'div class="wpf-grid-cell td"',
    close: "div",
  },
  "Grid.RowDefinition": { open: 'div class="wpf-grid-row tr"', close: "div" },
  ColumnDefinition: { open: 'div class="wpf-grid-cell td"', close: "div" },
  RowDefinition: { open: 'div class="wpf-grid-row tr"', close: "div" },
  GroupBox: { open: 'fieldset class="wpf-group-box"', close: "fieldset" },
  Panel: { open: 'div class="wpf-panel"', close: "div" },
  ResizeGrip: { open: "", close: "" },
  Separator: { open: 'hr class="wpf-separator"', close: "" },
  ScrollBar: { open: "", close: "" },
  ScrollViewer: { open: 'div class="wpf-scroll-viewer"', close: "div" },
  StackPanel: { open: 'div class="wpf-stack-panel stackpanel"', close: "div" },
  Thumb: { open: 'div class="wpf-thumb"', close: "div" },
  Viewbox: { open: "", close: "" },
  VirtualizingStackPanel: { open: "", close: "" },
  UniformGrid: { open: 'div class="wpf-uniform-grid"', close: "div" },
  Window: { open: 'div class="wpf-window window"', close: "div" },
  WrapPanel: { open: 'div class="wpf-wrap-panel"', close: "div" },
  Button: { open: 'button class="wpf-button"', close: "button" },
  RepeatButton: { open: 'button class="wpf-repeat-button"', close: "button" },
  DataGrid: { open: 'div class="wpf-data-grid table"', close: "div" },
  ListView: { open: 'ul class="wpf-list-view"', close: "ul" },
  TreeView: { open: 'ul class="wpf-tree-view"', close: "ul" },
  Calendar: { open: 'input class="wpf-calendar" type="date"', close: "" },
  DatePicker: { open: 'input class="wpf-date-picker" type="date"', close: "" },
  ContextMenu: { open: 'ul class="wpf-context-menu"', close: "ul" },
  Menu: { open: 'nav class="wpf-menu"', close: "nav" },
  ToolBar: { open: "", close: "" },
  CheckBox: { open: 'label class="wpf-check-box"', close: "label" },
  ComboBox: { open: 'select class="wpf-combo-box"', close: "select" },
  ComboBoxItem: { open: "option", close: "option" },
  ListBox: { open: 'div class="wpf-list-box"', close: "div" },
  ListBoxItem: { open: 'div class="wpf-list-box-item"', close: "div" },
  RadioButton: {
    open: 'label class="wpf-radio-button"',
    close: "label",
  },
  Rectangle: { open: 'div class="wpf-rectangle"', close: "div" },
  Slider: { open: 'input class="wpf-slider" type="range"', close: "" },
  Frame: { open: 'iframe class="wpf-frame"', close: "iframe" },
  Hyperlink: { open: 'a class="wpf-hyperlink"', close: "a" },
  Page: { open: 'div class="wpf-page"', close: "div" },
  NavigationWindow: { open: "", close: "" },
  TabControl: { open: 'div class="wpf-tab-control"', close: "div" },
  OpenFileDialog: {
    open: 'input class="wpf-open-file-dialog" type="file"',
    close: "",
  },
  PrintDialog: { open: "", close: "" },
  SaveFileDialog: { open: "", close: "" },
  AccessText: { open: 'label class="wpf-access-text"', close: "label" },
  Label: { open: 'label class="wpf-label"', close: "label" },
  Popup: { open: 'div class="wpf-popup"', close: "div" },
  ProgressBar: { open: 'progress class="wpf-progress-bar"', close: "progress" },
  StatusBar: { open: 'footer class="wpf-status-bar"', close: "footer" },
  TextBlock: { open: 'div class="wpf-text-block text-block"', close: "div" },
  ToolTip: { open: "", close: "" },
  DocumentViewer: { open: 'div class="wpf-document-viewer"', close: "div" },
  FlowDocumentPageViewer: {
    open: 'div class="wpf-flow-document-page-viewer"',
    close: "div",
  },
  FlowDocumentReader: {
    open: 'div class="wpf-flow-document-reader"',
    close: "div",
  },
  FlowDocumentScrollViewer: {
    open: 'div class="wpf-flow-document-scroll-viewer"',
    close: "div",
  },
  StickyNoteControl: {
    open: 'div class="wpf-sticky-note-control"',
    close: "div",
  },
  TextBox: { open: 'input class="wpf-text-box" type="text"', close: "" },
  RichTextBox: { open: 'div class="wpf-rich-text-box"', close: "div" },
  PasswordBox: {
    open: 'input class="wpf-password-box" type="password"',
    close: "",
  },
  Image: { open: 'img class="wpf-image"', close: "" },
  MediaElement: { open: 'video class="wpf-media-element"', close: "video" },
  SoundPlayerAction: { open: "", close: "" },
  InkCanvas: { open: "", close: "" },
  InkPresenter: { open: "", close: "" },
};

function hasClass(control: Control, className: string): boolean {
  const match = control.open.match(/class="([^"]*)"/);
  return match?.[1].split(/\s+/).includes(className) ?? false;
}

function isGrid(control: Control): boolean {
  return hasClass(control, "wpf-grid") || hasClass(control, "table");
}

function isGridRow(control: Control): boolean {
  return hasClass(control, "wpf-grid-row") || hasClass(control, "tr");
}

function isGridCell(control: Control): boolean {
  return hasClass(control, "wpf-grid-cell") || hasClass(control, "td");
}

function isWindow(control: Control): boolean {
  return hasClass(control, "wpf-window") || hasClass(control, "window");
}

function isCheckBox(control: Control): boolean {
  return hasClass(control, "wpf-check-box");
}

function isRadioButton(control: Control): boolean {
  return hasClass(control, "wpf-radio-button");
}

function getBlankEntry(block: string, attributes: Record<string, string>): BlankEntry {
  if (block === "TextBox") {
    return shouldUseTextArea(attributes)
      ? { open: 'textarea class="wpf-text-box" rows="1"', close: "textarea" }
      : blanks.TextBox;
  }

  return (
    blanks[block] ?? {
      open: 'div class="wpf-unknown"',
      close: "div",
    }
  );
}

function shouldUseTextArea(attributes: Record<string, string>): boolean {
  const acceptsReturn = attributes.AcceptsReturn === "True";
  const wraps =
    attributes.TextWrapping !== undefined && attributes.TextWrapping !== "NoWrap";

  return acceptsReturn || wraps;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addClassToOpenTag(open: string, className: string): string {
  if (open.includes(`class="${className}"`)) {
    return open;
  }
  if (open.includes('class="')) {
    return open.replace(/class="([^"]*)"/, (_match, classes: string) => {
      const classList = classes.split(/\s+/).filter(Boolean);
      return classList.includes(className)
        ? `class="${classes}"`
        : `class="${classes} ${className}"`;
    });
  }

  return `${open} class="${className}"`;
}

function getStyleResourceKey(value: string): string | undefined {
  const match = value.match(/^\{(?:StaticResource|DynamicResource)\s+([^}]+)\}$/);
  return match?.[1].trim();
}

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributeRegex = /([\w:.]+)\s*=\s*"([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = attributeRegex.exec(tag)) !== null) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

function getParamValue(control: Control | undefined, name: string): string | undefined {
  return control?.params.find((param) => param.name === name)?.value;
}

function gridDefinitionValue(
  control: Control | undefined,
  property: "width" | "height",
): string {
  return getParamValue(control, property) ?? "1fr";
}

function getGridRows(control: Control): Control[] {
  return control.children.filter((child) => isGridRow(child));
}

function getGridCells(control: Control): Control[] {
  return control.children.filter((child) => isGridCell(child));
}

function getColumnDefinitions(grid: Control): Array<Control | undefined> {
  const definitions: Array<Control | undefined> = [];

  getGridRows(grid).forEach((row) => {
    getGridCells(row).forEach((cell, index) => {
      const column = cell.column ?? index;
      definitions[column] ??= cell;
    });
  });

  return definitions.length > 0 ? definitions : [undefined];
}

function getRowDefinitions(grid: Control): Array<Control | undefined> {
  const rows = getGridRows(grid);
  return rows.length > 0 ? rows : [undefined];
}

function shouldSkipAttribute(paramName: string): boolean {
  return (
    paramName === "AcceptsReturn" ||
    paramName === "x:Class" ||
    paramName === "mc:Ignorable" ||
    paramName.startsWith("xmlns") ||
    paramName.startsWith("d:")
  );
}

/**Class for WPF Control converted into HTML element */
export class Control {
  open: string = "div";
  close: string = "div";
  children: Control[] = [];
  params: Param[] = [];
  innerText: string = "";
  title: string = "";
  position: number;
  row?: number;
  column?: number;
  rowSpan: number = 1;
  columnSpan: number = 1;
  spanPlaceholder: string = "";
  hasExplicitWidth: boolean = false;
  hasExplicitHeight: boolean = false;
  horizontalAlignment?: string;
  verticalAlignment?: string;
  type: string = "";
  constructor(open: string, close: string, position: number, type: string = "") {
    this.open = open;
    this.close = close;
    this.position = position;
    this.type = type;
  }
  addChild(child: Control): void {
    this.children.push(child);
  }

  /**Stringify Control and it`s children elements */
  show(): string {
    if (this.open === "") {
      return "";
    }

    if (isGrid(this)) {
      return this.showGrid();
    }

    const attributes = this.getAttributes();
    const innerHtml = `${this.innerText}${this.children.map((p) => p.show()).join("")}`;
    if (isCheckBox(this)) {
      const result = `<${this.open} ${attributes}>${this.children.map((p) => p.show()).join("")}${this.innerText}</${this.close}>`;
      return result;
    }
    if (isRadioButton(this)) {
      const result = `<${this.open} ${attributes}>${this.children.map((p) => p.show()).join("")}${this.innerText}</${this.close}>`;
      return result;
    }
    if (isWindow(this)) {
      const title = escapeHtml(this.title || "Window");
      const result = `<${this.open} ${attributes}><div class="wpf-window-title-bar"><div class="wpf-window-icon"></div><div class="wpf-window-title">${title}</div><div class="wpf-window-controls" aria-hidden="true"><span class="wpf-window-control wpf-window-minimize"></span><span class="wpf-window-control wpf-window-maximize"></span><span class="wpf-window-control wpf-window-close"></span></div></div><div class="wpf-window-content">${innerHtml}</div></${this.close}>`;
      return result;
    }
    const result = `<${this.open} ${attributes}${this.close ? `>${innerHtml}</${this.close}` : "/"}>`;
    return result;
  }

  private getAttributes(
    extraStyles: string[] = [],
    ignoredParamNames: Set<string> = new Set(),
  ): string {
    const styleParts = [
      ...this.params
        .filter((param) => !ignoredParamNames.has(param.name))
        .map((param) => param.show()),
      ...extraStyles,
    ];
    const styles =
      styleParts.length === 0 ? "" : `style="${styleParts.join(" ")}"`;

    return [
      `data-position="${this.position}"`,
      this.row !== undefined ? `data-grid-row="${this.row}"` : "",
      this.column !== undefined ? `data-grid-column="${this.column}"` : "",
      this.rowSpan > 1 ? `data-row-span="${this.rowSpan}"` : "",
      this.columnSpan > 1 ? `data-column-span="${this.columnSpan}"` : "",
      this.hasExplicitWidth ? `data-explicit-width="true"` : "",
      this.hasExplicitHeight ? `data-explicit-height="true"` : "",
      this.horizontalAlignment
        ? `data-wpf-horizontal-alignment="${this.horizontalAlignment.toLowerCase()}"`
        : "",
      this.verticalAlignment
        ? `data-wpf-vertical-alignment="${this.verticalAlignment.toLowerCase()}"`
        : "",
      this.spanPlaceholder
        ? `data-span-placeholder="${this.spanPlaceholder}"`
        : "",
      styles,
    ]
      .filter(Boolean)
      .join(" ");
  }

  private showGrid(): string {
    const columns = getColumnDefinitions(this)
      .map((column) => gridDefinitionValue(column, "width"))
      .join(" ");
    const rows = getRowDefinitions(this)
      .map((row) => gridDefinitionValue(row, "height"))
      .join(" ");
    const attributes = this.getAttributes([
      `grid-template-columns:${columns};`,
      `grid-template-rows:${rows};`,
    ]);
    const innerHtml = getGridRows(this)
      .flatMap((row, rowIndex) =>
        getGridCells(row).map((cell, columnIndex) =>
          this.showGridCell(cell, rowIndex, columnIndex),
        ),
      )
      .join("");

    return `<${this.open} ${attributes}>${innerHtml}</${this.close}>`;
  }

  private showGridCell(
    cell: Control,
    rowIndex: number,
    columnIndex: number,
  ): string {
    if (cell.spanPlaceholder || cell.children.length === 0) {
      return "";
    }

    const row = (cell.row ?? rowIndex) + 1;
    const column = (cell.column ?? columnIndex) + 1;
    const attributes = cell.getAttributes(
      [
        `grid-row:${row} / span ${Math.max(1, cell.rowSpan)};`,
        `grid-column:${column} / span ${Math.max(1, cell.columnSpan)};`,
      ],
      new Set([
        "width",
        "height",
        "min-width",
        "flex",
        "flex-grow",
        "flex-shrink",
      ]),
    );
    const innerHtml = `${cell.innerText}${cell.children
      .map((child) => child.show())
      .join("")}`;

    return `<${cell.open} ${attributes}>${innerHtml}</${cell.close}>`;
  }

  /**
   * Parses string into Control object
   * */
  static parse(s: string, position: number): Control {
    const normalized = s
      .trim()
      .replace(/^</, "")
      .replace(/\/?>$/, "")
      .trim();
    const block = normalized.match(/^([^\s>/]+)/)?.[1] ?? "";
    const attributes = parseAttributes(normalized);
    const tag: BlankEntry = getBlankEntry(block, attributes);

    const control: Control = new Control(tag.open, tag.close, position, block);
    if (block === "CheckBox") {
      control.children.push(
        new Control(
          'input class="wpf-check-box-input" type="checkbox"',
          "",
          0,
          "CheckBox.Input",
        ),
      );
    }
    if (block === "RadioButton") {
      control.children.push(
        new Control(
          'input class="wpf-radio-button-input" type="radio"',
          "",
          0,
          "RadioButton.Input",
        ),
      );
    }
    if (block === "StackPanel") {
      control.open = addClassToOpenTag(
        control.open,
        attributes.Orientation === "Horizontal"
          ? "wpf-stack-panel-horizontal"
          : "wpf-stack-panel-vertical",
      );
    }

    for (const [paramName, paramValue] of Object.entries(attributes)) {
      if (shouldSkipAttribute(paramName)) {
        continue;
      }
      if (paramName === "Content") {
        control.innerText = paramValue;
        continue;
      }
      if (paramName === "Title") {
        control.title = paramValue;
        continue;
      }
      if (paramName === "Style") {
        const styleResourceKey = getStyleResourceKey(paramValue);
        if (styleResourceKey) {
          control.open = addClassToOpenTag(
            control.open,
            styleKeyToClassName(styleResourceKey),
          );
        }
        continue;
      }
      if (block === "CheckBox" && paramName === "IsChecked") {
        if (paramValue === "True" || paramValue === "true") {
          control.children[0].open += " checked";
        }
        continue;
      }
      if (block === "RadioButton" && paramName === "IsChecked") {
        if (paramValue === "True" || paramValue === "true") {
          control.children[0].open += " checked";
          control.open = addClassToOpenTag(control.open, "wpf-checked");
        }
        continue;
      }
      if (block === "ComboBoxItem" && paramName === "IsSelected") {
        if (paramValue === "True" || paramValue === "true") {
          control.open += " selected";
        }
        continue;
      }
      if (paramName === "Text") {
        if (control.close) {
          control.innerText = paramValue;
          continue;
        } else {
          control.open += ` value="${paramValue}"`;
          continue;
        }
      }
      if (paramName === "Grid.Row") {
        control.row = Number.parseInt(paramValue);
        continue;
      }
      if (paramName === "Grid.Column") {
        control.column = Number.parseInt(paramValue);
        continue;
      }
      if (paramName === "Grid.RowSpan") {
        control.rowSpan = Math.max(1, Number.parseInt(paramValue));
        continue;
      }
      if (paramName === "Grid.ColumnSpan") {
        control.columnSpan = Math.max(1, Number.parseInt(paramValue));
        continue;
      }
      if (paramName === "Width") {
        control.hasExplicitWidth = true;
      }
      if (paramName === "Height") {
        control.hasExplicitHeight = true;
      }
      if (paramName === "HorizontalAlignment") {
        control.horizontalAlignment = paramValue;
        continue;
      }
      if (paramName === "VerticalAlignment") {
        control.verticalAlignment = paramValue;
        continue;
      }
      if (paramName === "Orientation") {
        continue;
      }
      if (block === "UniformGrid" && paramName === "Columns") {
        control.params.push(new Param("--wpf-uniform-columns", paramValue));
        continue;
      }
      if (block === "UniformGrid" && paramName === "Rows") {
        control.params.push(new Param("--wpf-uniform-rows", paramValue));
        continue;
      }
      const param: Param = new Param(
        paramName.split(".")[paramName.split(".").length - 1],
        paramValue,
      );
      control.params.push(param);
    }
    return control;
  }
  static copy(other: Control): Control {
    const control = new Control(other.open, other.close, other.position);
    control.params = other.params.map((p) => new Param(p.name, p.value));
    control.innerText = other.innerText;
    control.title = other.title;
    control.row = other.row;
    control.column = other.column;
    control.rowSpan = other.rowSpan;
    control.columnSpan = other.columnSpan;
    control.spanPlaceholder = other.spanPlaceholder;
    control.hasExplicitWidth = other.hasExplicitWidth;
    control.hasExplicitHeight = other.hasExplicitHeight;
    control.horizontalAlignment = other.horizontalAlignment;
    control.verticalAlignment = other.verticalAlignment;
    control.type = other.type;
    return control;
  }
}
