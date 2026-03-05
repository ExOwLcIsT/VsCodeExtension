// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Control } from "./classes/Control";

/**
 *
 * Parses array of strings (original tags spitted by '<')
 * into array of Controls
 *
 * */
function parseArray(arr: string[]): Control[] {
  const controls: Control[] = [];
  const controlStack: Control[] = []; // Control stack
  // Keeps track on unclosed tags
  // on pop pushes children of previous tag
  // or if it`s first element of stack, the control is pushed to controls array

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].endsWith("/>")) {
      // non-pair tag
      const control = Control.parse(arr[i]);
      if (controlStack.length === 0) {
        controls.push(control);
      } else {
        controlStack.at(controlStack.length - 1)?.children.push(control);
      }
    } else if (arr[i][0] === "/") {
      // closed tag
      const closedTag = controlStack.pop();
      if (closedTag === undefined) {
        throw Error(`Closed unopened tag${arr[i]}`);
      }
      if (controlStack.length === 0) {
        controls.push(closedTag);
      } else {
        controlStack.at(controlStack.length - 1)?.children.push(closedTag);
      }
    } else if (arr[i].includes(">")) {
      // Opened tag
      const splitted = arr[i].split(">");
      const tagPart = splitted[0] + ">";
      const innerTextPart = splitted[1] ? splitted[1] : "";
      const control = Control.parse(tagPart);
      control.innerText = innerTextPart;
      controlStack.push(control);
    } else // text in tag
    {
      controlStack[controlStack.length - 1].innerText = arr[i];
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

    webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

    // 🔁 Update preview on text change
    const update = () => {
      const s = document.getText();
      const arr = s
        .split("<")
        .filter((el) => el !== null && el.length > 0)
        .map((el) => el.trim());

      const controls: Control[] = parseArray(arr);

      // for (let i = 0; i < arr.length; i++) {
      //   const id = arr[i].split(" ")[0];

      //   controls.push(parseTag(arr[i]));
      //   while (arr[i].replace("/>", "").split(" ")[0] !== id) {
      //     i++;
      //   }
      // }
      const xaml = controls.map((c) => c.show()).join("");
      webviewPanel.webview.postMessage({
        xaml,
      });
    };

    update();

    const changeSub = vscode.workspace.onDidSaveTextDocument((e) => {
      if (e.uri.toString() === document.uri.toString()) {
        update();
      }
    });

    webviewPanel.onDidDispose(() => changeSub.dispose());
  }

  private getHtml(webview: vscode.Webview): string {
    //TODO
    // add css for the components
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="root">Waiting for XAML...</div>

        <script>
          window.addEventListener('message', event => {
            const xaml = event.data.xaml;
            document.getElementById('root').innerHTML = \`<pre> \${xaml}</pre>\`;
          });
        </script>
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
