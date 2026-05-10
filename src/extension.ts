// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Control } from "./classes/Control";
import { join } from "path-ts";

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

      if (control.tagName === "") {
        continue;
      }
      if (controlStack.length === 0) {
        controls.push(control);
        continue;
      }
      // if control belongs to Grid
      if (control.row !== undefined || control.column !== undefined) {
        // //moving through stack to find opened Grid (parent)
        // for (let j = controlStack.length - 1; j >= 0; j--) {

        // }

        const table = controlStack[controlStack.length - 1];
        if (table.tagName !== "table") {
          controlStack.at(controlStack.length - 1)?.children.push(control);
          continue;
        }
        const rows = table.children.filter((c) => c.tagName === "tr");
        if (rows.length === 0) {
          const row = new Control("tr", true, 0);
          rows.push(row);
          table.children.push(rows[0]);
        }
        const row =
          rows[
            Math.min(
              control.row !== undefined ? control.row : rows.length - 1,
              rows.length - 1,
            )
          ];
        const columns = row.children.filter((c) => c.tagName === "td");
        if (columns.length === 0) {
          const column = new Control("td", true, 0);
          columns.push(column);
          row.children.push(columns[0]);
        }
        const column =
          columns[
            Math.min(
              control.column !== undefined
                ? control.column
                : columns.length - 1,
              columns.length - 1,
            )
          ];
        column.children.push(control);
        continue;
      }
      // if ColumnDefinition, table rows are filled with td
      if (control.tagName === "td") {
        const table = controlStack[controlStack.length - 1];
        if (table.tagName !== "table") {
          controlStack.at(controlStack.length - 1)?.children.push(control);
          continue;
        }
        table.children.forEach((c) => {
          if (c.tagName === "tr") {
            c.children.push(new Control(
                control.tagName,
                control.isPair,
                control.position,
              ),);
          }
        });
        continue;
      }
      controlStack.at(controlStack.length - 1)?.children.push(control);
    } else if (arr[i].text.startsWith("/")) {
      // closing tag
      const closingControl = Control.parse(arr[i].text.slice(1), 0);
      if (!closingControl.tagName) {
        continue;
      }
      const openedControl = controlStack.pop();
      if (
        openedControl === undefined ||
        openedControl.tagName !== closingControl.tagName
      ) {
        throw Error(`Closed unopened tag${arr[i].text}`);
      }
      if (controlStack.length === 0) {
        controls.push(openedControl);
        continue;
      }
      // if control belongs to Grid
      if (
        openedControl.row !== undefined ||
        openedControl.column !== undefined
      ) {
        // //moving through stack to find opened Grid (parent)
        // for (let j = controlStack.length - 1; j >= 0; j--) {

        // }

        const table = controlStack[controlStack.length - 1];
        if (table.tagName !== "table") {
          controlStack
            .at(controlStack.length - 1)
            ?.children.push(openedControl);
          continue;
        }
        const rows = table.children.filter((c) => c.tagName === "tr");
        if (rows.length === 0) {
          const row = new Control("tr", true, 0);
          rows.push(row);
          table.children.push(rows[0]);
        }
        const row =
          rows[
            Math.min(
              openedControl.row !== undefined
                ? openedControl.row
                : rows.length - 1,
              rows.length - 1,
            )
          ];
        const columns = row.children.filter((c) => c.tagName === "td");
        if (columns.length === 0) {
          const column = new Control("td", true, 0);
          columns.push(column);
          row.children.push(columns[0]);
        }
        const column =
          columns[
            Math.min(
              openedControl.column !== undefined
                ? openedControl.column
                : columns.length - 1,
              columns.length - 1,
            )
          ];
        column.children.push(openedControl);
        continue;
      }
      // if ColumnDefinition, table rows are filled with td
      //TODO
      // change to filling with copies
      if (openedControl.tagName === "td") {
        const table = controlStack[controlStack.length - 1];
        if (table.tagName !== "table") {
          controlStack
            .at(controlStack.length - 1)
            ?.children.push(openedControl);
          continue;
        }
        table.children.forEach((c) => {
          if (c.tagName === "tr") {
            c.children.push(
              new Control(
                openedControl.tagName,
                openedControl.isPair,
                openedControl.position,
              ),
            );
          }
        });
        continue;
      }
      controlStack.at(controlStack.length - 1)?.children.push(openedControl);
    } else if (arr[i].text.includes(">")) {
      // Opened tag
      const splitted = arr[i].text.split(">");
      const tagPart = splitted[0] + ">";
      const innerTextPart = splitted[1] ? splitted[1] : "";
      const control = Control.parse(tagPart, arr[i].position);
      if (!control.tagName) {
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

        const xaml = controls.map((c) => c.show()).join("");
        webviewPanel.webview.postMessage({
          xaml,
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
    //TODO
    // add css for the components
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(join(__dirname, "..", "styles", "components.css")),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(join(__dirname, "..", "scripts", "document.js")),
    );
    return `
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
