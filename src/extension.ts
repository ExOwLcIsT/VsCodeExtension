// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Control } from "./classes/Control";
import { Param } from "./classes/Param";
import { Style } from "./classes/Style";
import { join } from "path";

interface ParseResult {
  controls: Control[];
  styles: Style[];
}
/**
 *
 * Parses array of strings (original WPF tags spitted by '<')
 * into array of Controls
 *
 * */
function parseArray(arr: { text: string; position: number }[]): ParseResult {
  const controls: Control[] = []; // Parsed and  closed controls, that are not children
  const controlStack: Control[] = []; // Stack of WPF controls to keep track of unclosed tags
  const styles: Style[] = []; // WPF tags for styling, converted to css
  const styleStack: Style[] = []; // Stack of WPF styling tags to keep track of unclosed ones
  let ignoredStyleDepth = 0;
  // Keeps track on unclosed tags
  // on pop pushes children of previous tag
  // or if it`s first element of stack, the control is pushed to controls array

  for (let i = 0; i < arr.length; i++) {
    const tagName = getTagName(arr[i].text);
    // self-closing tag (<TextBox/>)
    if (arr[i].text.endsWith("/>")) {
      if (styleStack.length > 0 && ignoredStyleDepth > 0) {
        continue;
      }
      if (isSetterTag(tagName)) {
        const property = Style.parseSetter(arr[i].text);
        const style = styleStack.at(styleStack.length - 1);
        if (property && style) {
          style.properties.push(property);
        }
        continue;
      }
      if (isStyleTag(tagName)) {
        styles.push(Style.parse(arr[i].text));
        continue;
      }
      if (isResourceTag(tagName)) {
        continue;
      }
      if (styleStack.length > 0) {
        continue;
      }

      const control = Control.parse(arr[i].text, arr[i].position);

      if (control.open === "") {
        continue;
      }
      if (controlStack.length === 0) {
        controls.push(control);
        continue;
      }
      // if RowDefinition, adding row to the table
      if (isGridRow(control)) {
        const table = controlStack[controlStack.length - 1];
        addGridRowDefinition(table, control);
        continue;
      }
      // if ColumnDefinition, table rows are filled with td
      if (isGridCell(control)) {
        const table = controlStack[controlStack.length - 1];
        if (!isGrid(table)) {
          controlStack.at(controlStack.length - 1)?.children.push(control);
          continue;
        }
        addGridColumnDefinition(table, control);
        continue;
      }
      const parentControl = controlStack.at(controlStack.length - 1);
      //If the element with either Grid.Row or Grid.Column is not in grid, it is put as a child in the container
      if (parentControl && isGrid(parentControl)) {
        placeControlInGrid(parentControl, control);
        continue;
      }

      controlStack.at(controlStack.length - 1)?.children.push(control);
    } else if (arr[i].text.startsWith("/")) {
      if (isStyleTag(tagName)) {
        const style = styleStack.pop();
        if (style) {
          styles.push(style);
        }
        continue;
      }
      if (styleStack.length > 0) {
        if (!isSetterTag(tagName) && ignoredStyleDepth > 0) {
          ignoredStyleDepth--;
        }
        continue;
      }
      if (isSetterTag(tagName)) {
        const property = Style.parseSetter(arr[i].text);
        const style = styleStack.at(styleStack.length - 1);
        if (property && style) {
          style.properties.push(property);
        }
        continue;
      }
      if (isResourceTag(tagName)) {
        continue;
      }

      // closing tag (</TextBlock>)
      const closingControl = Control.parse(arr[i].text.slice(1), 0);
      if (!closingControl.open) {
        continue;
      }
      const openedControl = controlStack.pop();
      if (
        openedControl === undefined ||
        openedControl.type !== closingControl.type
      ) {
        throw Error(`Closed unopened tag${arr[i].text}`);
      }
      if (controlStack.length === 0) {
        controls.push(openedControl);
        continue;
      }

      // if RowDefinition, adding row to the table
      if (isGridRow(openedControl)) {
        const table = controlStack[controlStack.length - 1];
        addGridRowDefinition(table, openedControl);
        continue;
      }
      // if ColumnDefinition, table rows are filled with td
      if (isGridCell(openedControl)) {
        const table = controlStack[controlStack.length - 1];
        if (!isGrid(table)) {
          controlStack
            .at(controlStack.length - 1)
            ?.children.push(openedControl);
          continue;
        }
        addGridColumnDefinition(table, openedControl);
        continue;
      }
      const parentControl = controlStack.at(controlStack.length - 1);
      if (parentControl && isGrid(parentControl)) {
        placeControlInGrid(parentControl, openedControl);
        continue;
      }

      controlStack.at(controlStack.length - 1)?.children.push(openedControl);
    } else if (arr[i].text.includes(">")) {
      if (isStyleTag(tagName)) {
        styleStack.push(Style.parse(arr[i].text));
        continue;
      }
      if (isSetterTag(tagName) || isResourceTag(tagName)) {
        continue;
      }
      if (styleStack.length > 0) {
        ignoredStyleDepth++;
        continue;
      }

      // Opened tag (<TextBlock>)
      const splitted = arr[i].text.split(">");
      const tagPart = splitted[0] + ">";
      const innerTextPart = splitted[1] ? splitted[1] : "";
      const control = Control.parse(tagPart, arr[i].position);
      if (!control.open) {
        continue;
      }
      control.innerText = innerTextPart;
      controlStack.push(control);
    } else // text in tag (<TextBlock>Text in tag</TextBlock>)
    {
      if (styleStack.length > 0) {
        continue;
      }
      controlStack[controlStack.length - 1].innerText = arr[i].text;
    }
  }
  return { controls, styles };
}

/**
 *
 * Parses name from the tag (first word after '<')
 *
 * */
function getTagName(tag: string): string {
  const match = tag
    .trim()
    .replace(/^\/+/, "")
    .match(/^([^\s>/]+)/);
  return match?.[1] ?? "";
}

function isStyleTag(tagName: string): boolean {
  return tagName === "Style";
}

function isSetterTag(tagName: string): boolean {
  return tagName === "Setter";
}

function isResourceTag(tagName: string): boolean {
  return tagName === "ResourceDictionary" || tagName.endsWith(".Resources");
}

function addGridRowDefinition(table: Control, row: Control): void {
  const columnTemplates = getColumnTemplates(table);
  const rows = getGridRows(table);
  if (rows.length === 1 && rows[0].position === -1) {
    const index = table.children.indexOf(rows[0]);
    table.children.splice(index, 1);
  }
  if (columnTemplates.length > 0) {
    row.children = columnTemplates.map((cell, index) =>
      createGridCell(index, cell),
    );
  }     
  table.children.push(row);
}

function addGridColumnDefinition(table: Control, column: Control): void {
  const rows = getGridRows(table);
  if (rows.length === 0) {
    table.children.push(createGridRow(-1));
  }

  getGridRows(table).forEach((row) => {
    const cells = getGridCells(row);
    row.children.push(createGridCell(cells.length, column));
  });
}

function placeControlInGrid(table: Control, control: Control): void {
  const rowIndex = Math.max(0, control.row ?? 0);
  const columnIndex = Math.max(0, control.column ?? 0);
  const rowSpan = Math.max(1, control.rowSpan);
  const columnSpan = Math.max(1, control.columnSpan);

  ensureGridSize(table, rowIndex + rowSpan - 1, columnIndex + columnSpan - 1);

  const cell = getGridCell(table, rowIndex, columnIndex);
  cell.row = rowIndex;
  cell.column = columnIndex;
  cell.rowSpan = rowSpan;
  cell.columnSpan = columnSpan;
  cell.spanPlaceholder = "";
  applyGridCellAlignment(cell, control);
  cell.children.push(control);

  markSpanPlaceholders(table, rowIndex, columnIndex, rowSpan, columnSpan);
}

function applyGridCellAlignment(cell: Control, control: Control): void {
  const horizontalAlignment = mapFlexAlignment(control.horizontalAlignment);
  if (horizontalAlignment && horizontalAlignment !== "stretch") {
    setParam(cell, "justify-content", horizontalAlignment);
  } else if (!horizontalAlignment && control.hasExplicitWidth) {
    setParam(cell, "justify-content", "center");
  }

  const verticalAlignment = mapFlexAlignment(control.verticalAlignment);
  if (verticalAlignment) {
    setParam(cell, "align-items", verticalAlignment);
  } else if (control.hasExplicitHeight) {
    setParam(cell, "align-items", "center");
  }
}

function mapFlexAlignment(value: string | undefined): string | undefined {
  return (
    {
      Left: "flex-start",
      Top: "flex-start",
      Center: "center",
      Right: "flex-end",
      Bottom: "flex-end",
      Stretch: "stretch",
    }[value ?? ""] ?? undefined
  );
}

function setParam(control: Control, name: string, value: string): void {
  const param = control.params.find((p) => p.name === name);
  if (param) {
    param.value = value;
    return;
  }

  control.params.push(new Param(name, value));
}

function markSpanPlaceholders(
  table: Control,
  rowIndex: number,
  columnIndex: number,
  rowSpan: number,
  columnSpan: number,
): void {
  for (let row = rowIndex; row < rowIndex + rowSpan; row++) {
    for (
      let column = columnIndex;
      column < columnIndex + columnSpan;
      column++
    ) {
      if (row === rowIndex && column === columnIndex) {
        continue;
      }

      const cell = getGridCell(table, row, column);
      if (cell.children.length === 0) {
        cell.spanPlaceholder = row === rowIndex ? "column" : "row";
      }
    }
  }
}

function ensureGridSize(
  table: Control,
  lastRowIndex: number,
  lastColumnIndex: number,
): void {
  for (let row = 0; row <= lastRowIndex; row++) {
    ensureGridRow(table, row);
  }

  for (let column = 0; column <= lastColumnIndex; column++) {
    ensureGridColumn(table, column);
  }
}

function ensureGridRow(table: Control, rowIndex: number): Control {
  let rows = getGridRows(table);
  while (rows.length <= rowIndex) {
    const row = createGridRow(rows.length);
    getColumnTemplates(table).forEach((cell, index) => {
      row.children.push(createGridCell(index, cell));
    });
    table.children.push(row);
    rows = getGridRows(table);
  }

  return rows[rowIndex];
}

function ensureGridColumn(table: Control, columnIndex: number): void {
  getGridRows(table).forEach((row) => {
    const cells = getGridCells(row);
    while (cells.length <= columnIndex) {
      const cell = createGridCell(
        cells.length,
        getColumnTemplate(table, cells.length),
      );
      row.children.push(cell);
      cells.push(cell);
    }
  });
}

function getGridCell(
  table: Control,
  rowIndex: number,
  columnIndex: number,
): Control {
  const row = ensureGridRow(table, rowIndex);
  ensureGridColumn(table, columnIndex);
  return getGridCells(row)[columnIndex];
}

function createGridRow(position: number): Control {
  return new Control('div class="wpf-grid-row tr"', "div", position);
}

function createGridCell(column: number, template?: Control): Control {
  const cell = template
    ? Control.copy(template)
    : new Control('div class="wpf-grid-cell td"', "div", 0);
  cell.children = [];
  cell.column = column;
  cell.rowSpan = 1;
  cell.columnSpan = 1;
  cell.spanPlaceholder = "";
  cell.hasExplicitWidth = false;
  cell.hasExplicitHeight = false;
  cell.horizontalAlignment = undefined;
  cell.verticalAlignment = undefined;
  return cell;
}

function getGridRows(table: Control): Control[] {
  return table.children.filter((child) => isGridRow(child));
}

function getGridCells(row: Control): Control[] {
  return row.children.filter((child) => isGridCell(child));
}

function getColumnTemplates(table: Control): Control[] {
  const templates: Control[] = [];
  getGridRows(table).forEach((row) => {
    getGridCells(row).forEach((cell, index) => {
      const column = cell.column ?? index;
      templates[column] ??= cell;
    });
  });
  return templates;
}

function getColumnTemplate(
  table: Control,
  columnIndex: number,
): Control | undefined {
  return getColumnTemplates(table)[columnIndex];
}

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

class XamlPreviewProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.onDidReceiveMessage(
      (message: { position: number }) => {
        try {
          const substring = [...document.getText().matchAll(/</g)][
            message.position
          ];

          const index = substring.index;

          const position = document.positionAt(index);
          const range = new vscode.Range(position, position);

          vscode.window.showTextDocument(document, {
            viewColumn: vscode.ViewColumn.One,
            selection: range,
          });
        } catch (err) { 
          const message = err;
        }
      },
    );
    webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

    // 🔁 Update preview on text change
    const update = () => {
      try {
        const s = document.getText();

        const arr = s
          .split("<")
          .filter((el) => el !== null && el.length > 0)
          .map((el, index) => ({
            text: el.trim(),
            position: index,
          }));

        const { controls, styles } = parseArray(arr);

        const xaml = controls.map((c) => c.show()).join("\n");
        const css = styles.map((style) => style.toString(styles)).join("\n");
        webviewPanel.webview.postMessage({
          xaml,
          styles: css,
        });
      } catch (error) {
        if (typeof error === "string") {
          webviewPanel.webview.postMessage({
            xaml: error,
          });
        } else if (error instanceof Error) {
          const message = error.message;
          webviewPanel.webview.postMessage({
            xaml: message,
          });
          error.message;
        }
      }
    };

    update();

    const changeSub = vscode.workspace.onDidSaveTextDocument((e) => {
      if (e.uri.toString() === document.uri.toString()) {
        update();
      }
    });
    const changeEditorSub = vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        if (editor?.document.uri.toString() === document.uri.toString()) {
          update();
        }
      },
    );
    webviewPanel.onDidDispose(() => {
      changeSub.dispose();
      changeEditorSub.dispose();
    });
  }

  private getHtml(webview: vscode.Webview): string {
    // add css for the components
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(join(__dirname, "..", "styles", "components.css")),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(join(__dirname, "..", "scripts", "document.js")),
    );
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
      <link rel = "stylesheet" href = "${styleUri}">
      <style id="xaml-styles"></style>
      </head>
      <body>Waiting for XAML...
        <script src = "${scriptUri}"></script>
      </body>
      </html>
    `;
    return htmlTemplate;
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const commandHandler = () => {
    vscode.commands.executeCommand(
      "vscode.openWith",
      vscode.window.activeTextEditor?.document.uri,
      "xamlPreview.editor",
      vscode.ViewColumn.Beside,
    );
  };
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "xamlPreview.editor",
      new XamlPreviewProvider(context),
      {
        supportsMultipleEditorsPerDocument: false,
      },
    ),
  );
  const disposable = vscode.commands.registerCommand(
    "xamlRenderer.render",
    commandHandler,
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
