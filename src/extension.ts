// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Control } from "./classes/Control";
import { join } from "path";
/**
 *
 * Parses array of strings (original tags spitted by '<')
 * into array of Controls
 *
 * */

function parseArray(arr: { text: string; position: number }[]): Control[] {
  const controls: Control[] = [];
  const controlStack: Control[] = []; // Control stack
  // Keeps track on unclosed tags
  // on pop pushes children of previous tag
  // or if it`s first element of stack, the control is pushed to controls array

  for (let i = 0; i < arr.length; i++) {
    // self-closing tag
    if (arr[i].text.endsWith("/>")) {
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
        const rows = table.children.filter((c) => isGridRow(c));
        if (rows.length > 0) {
          control.children = rows[0].children.map((c) => Control.copy(c));
        }
        if (rows.length === 1 && rows[0].position === -1) {
          const index = table.children.indexOf(rows[0]);
          table.children.splice(index, 1);
        }
        table?.children.push(control);
        continue;
      }
      // if ColumnDefinition, table rows are filled with td
      if (isGridCell(control)) {
        const table = controlStack[controlStack.length - 1];
        if (!isGrid(table)) {
          controlStack.at(controlStack.length - 1)?.children.push(control);
          continue;
        }
        const rows = table.children.filter((c) => isGridRow(c));
        if (rows.length === 0) {
          const row = new Control('div class="wpf-grid-row tr"', "div", -1);
          table.children.push(row);
        }
        table.children.forEach((c) => {
          if (isGridRow(c)) {
            c.children.push(Control.copy(control));
          }
        });
        continue;
      }
      if (controlStack.length > 1) {
        const table = controlStack[controlStack.length - 1];

        //If the element with either Grid.Row or Grid.Column is not in grid, it is put as a child in the container
        if (isGrid(table)) {
          const rows = table.children.filter((c) => isGridRow(c));
          if (rows.length === 0) {
            const row = new Control('div class="wpf-grid-row tr"', "div", 0);
            rows.push(row);
            table.children.push(rows[0]);
          }
          let row: Control;
          if (control.row === undefined) {
            const emptyRow = rows.find((r) => r.children.length === 0);
            row = emptyRow ? emptyRow : rows[0];
          } else {
            control.row = Math.min(rows.length - 1, Math.max(0, control.row));
            row = rows[control.row];
          }

          const columns = row.children.filter((c) => isGridCell(c));
          if (columns.length === 0) {
            const column = new Control(
              'div class="wpf-grid-cell td"',
              "div",
              0,
            );
            columns.push(column);
            row.children.push(columns[0]);
          }
          let column: Control;
          if (control.column === undefined) {
            const emptyColumn = columns.find((r) => r.children.length === 0);
            column = emptyColumn ? emptyColumn : columns[0];
          } else {
            control.column = Math.min(
              columns.length - 1,
              Math.max(0, control.column),
            );
            column = columns[control.column];
          }
          column.children.push(control);
          continue;
        }
      }

      controlStack.at(controlStack.length - 1)?.children.push(control);
    } else if (arr[i].text.startsWith("/")) {
      // closing tag
      const closingControl = Control.parse(arr[i].text.slice(1), 0);
      if (!closingControl.open) {
        continue;
      }
      const openedControl = controlStack.pop();
      if (
        openedControl === undefined ||
        openedControl.open !== closingControl.open
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
        const rows = table.children.filter((c) => isGridRow(c));
        if (rows.length > 0) {
          openedControl.children = rows[0].children.map((c) => Control.copy(c));
        }
        if (rows.length === 1 && rows[0].position === -1) {
          const index = table.children.indexOf(rows[0]);
          table.children.splice(index, 1);
        }
        table?.children.push(openedControl);
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
        table.children.forEach((c) => {
          if (isGridRow(c)) {
            c.children.push(Control.copy(openedControl));
          }
        });
        continue;
      }
      if (controlStack.length > 1) {
        const table = controlStack[controlStack.length - 1];
        if (isGrid(table)) {
          const rows = table.children.filter((c) => isGridRow(c));
          if (rows.length === 0) {
            const row = new Control('div class="wpf-grid-row tr"', "div", 0);
            rows.push(row);
            table.children.push(rows[0]);
          }
          let row: Control;
          if (openedControl.row === undefined) {
            const emptyRow = rows.find((r) => r.children.length === 0);
            row = emptyRow ? emptyRow : rows[0];
          } else {
            openedControl.row = Math.min(
              rows.length - 1,
              Math.max(0, openedControl.row),
            );
            row = rows[openedControl.row];
          }
          const columns = row.children.filter((c) => isGridCell(c));
          if (columns.length === 0) {
            const column = new Control(
              'div class="wpf-grid-cell td"',
              "div",
              0,
            );
            columns.push(column);
            row.children.push(columns[0]);
          }
          let column: Control;
          if (openedControl.column === undefined) {
            const emptyColumn = columns.find((r) => r.children.length === 0);
            column = emptyColumn ? emptyColumn : columns[0];
          } else {
            openedControl.column = Math.min(
              columns.length - 1,
              Math.max(0, openedControl.column),
            );
            column = columns[openedControl.column];
          }
          column.children.push(openedControl);
          continue;
        }
      }

      controlStack.at(controlStack.length - 1)?.children.push(openedControl);
    } else if (arr[i].text.includes(">")) {
      // Opened tag
      const splitted = arr[i].text.split(">");
      const tagPart = splitted[0] + ">";
      const innerTextPart = splitted[1] ? splitted[1] : "";
      const control = Control.parse(tagPart, arr[i].position);
      if (!control.open) {
        continue;
      }
      control.innerText = innerTextPart;
      controlStack.push(control);
    } else // text in tag
    {
      controlStack[controlStack.length - 1].innerText = arr[i].text;
    }
  }
  return controls;
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

        const controls: Control[] = parseArray(arr);

        const xaml = controls.map((c) => c.show()).join("\n");
        webviewPanel.webview.postMessage({
          xaml: `${xaml}<xmp>${xaml}</xmp>`,
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
    "winforms-cs.render",
    commandHandler,
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
