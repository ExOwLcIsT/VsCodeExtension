// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Control } from "./classes/Control";

const enum TYPES {
  closedTag,
  tag,
  content,
}

/**
 * Recursion method for parsing whole document to get controls array
 */
// TODO
// implement stack (in notes)
function parseArray(arr: string[], currentIndex: number = 0): Control[] {
  const controls: Control[] = [];
  const controlStack: Control[] = []; // Control stack
  // Keeps track on unclosed tags
  // on pop pushes children of previous tag
  // or if it`s first element of stack, the control is pushed to controls array

  for (let i = currentIndex; i < arr.length; i++) {
    if (arr[i].includes("/>", arr[i].length - 2)) {
      //TODO
    }
    if (!arr[i].includes(">", arr[i].length - 1)) {
      //TODO
      const control = Control.parse(arr[i]);
      control.children = parseArray(arr, i + 1);
    }
    if (arr[i][0] === "/") {
      const closedTag = controlStack.pop();
      if (closedTag === undefined) {
        throw Error("Closed unopened tag");
      }
      if (controlStack.length === 0) {
        controls.push(closedTag);
      } else {
        controlStack.at(controlStack.length - 1)?.children.push(closedTag);
      }
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

      // TODO
      // XAML is controls list foreach.show()
      webviewPanel.webview.postMessage({
        xaml: controls.map((c) => c.show()).join(),
      });
    };

    update();

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        update();
      }
    });

    webviewPanel.onDidDispose(() => changeSub.dispose());
  }

  private getHtml(webview: vscode.Webview): string {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="root">Waiting for XAML...</div>

        <script>
          window.addEventListener('message', event => {
            const xaml = event.data.xaml;
            document.getElementById('root').innerHTML = xaml;
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
