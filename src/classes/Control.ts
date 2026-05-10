import { Param } from "./Param";

/**Blanks to convert WPF Controls into HTML elements*/
const blanks: { [id: string]: string } = {
  Border: `div class="border"`,

  BulletDecorator: "div",

  Canvas: "div class=canvas", // all elements inside are absolute

  DockPanel: "div", //top, left, right, center, bottom

  Expander: "div", // expands like select, but with content

  Grid: "table",

  GridSplitter: "",
  "Grid.ColumnDefinitions": "",
  ColumnDefinition: "td",
  RowDefinition: "tr",
  GroupBox: "fieldset",

  Panel: "div",

  ResizeGrip: "", // no equivalent

  Separator: "hr",

  ScrollBar: "", // styled input[type=range] or custom

  ScrollViewer: "", // overflow: auto

  StackPanel: `div class="stackpanel"`, // flexbox column/row

  Thumb: `div class = "thumb"`, // draggable div

  Viewbox: "", // CSS transform/scale

  VirtualizingStackPanel: "", // virtual scroll lib

  Window: `div class="window"`, // modal or main container

  WrapPanel: "", // flex-wrap
  Button: "button",

  RepeatButton: "button", // JS hold behavior
  DataGrid: "table",

  ListView: "ul",

  TreeView: "ul",
  Calendar: `input type="date"`,

  DatePicker: `input type="date"`,
  ContextMenu: "ul",

  Menu: "nav",

  ToolBar: "",
  CheckBox: `input type="checkbox"`,

  ComboBox: "select",

  ListBox: "select",

  RadioButton: `input type="radio"`,

  Slider: `input type="range"`,

  Frame: "iframe",
  Hyperlink: "a",
  Page: "div", // or main/section
  NavigationWindow: "", // browser itself
  TabControl: "div", // tab pattern, no native

  OpenFileDialog: `input type="file"`,
  PrintDialog: "", // window.print()
  SaveFileDialog: "", // no direct equivalent

  AccessText: "label", // with accesskey attr
  Label: "label",
  Popup: "div", // absolute/fixed positioned
  ProgressBar: "progress",
  StatusBar: "footer", // or div role="status"
  TextBlock: `div class="text-block"`, // div is okay too
  ToolTip: "", // title attr or custom div

  DocumentViewer: "div", // PDF.js or iframe
  FlowDocumentPageViewer: "div",
  FlowDocumentReader: "div", // article
  FlowDocumentScrollViewer: "div", // overflow-y: scroll
  StickyNoteControl: "div", // draggable div

  TextBox: `input type="text"`,
  RichTextBox: "div", // contenteditable or textarea
  PasswordBox: `input type="password"`,
  Image: "img",

  MediaElement: "video",

  SoundPlayerAction: "",
  InkCanvas: "",

  InkPresenter: "",
};
/**Class for WPF Control converted into HTML element */
export class Control {
  tagName: string = "div";
  isPair: boolean;
  children: Control[] = [];
  params: Param[] = [];
  innerText: string = "";
  position: number;
  row?: number;
  column?: number;
  constructor(tagName: string, isPair: boolean, position: number) {
    this.tagName = tagName;
    this.isPair = isPair;
    this.position = position;
  }
  /**Stringify Control and it`s children elements */
  show(): string {
    if (this.tagName === "") {
      return "";
    }
    const styles =
      this.params.length === 0
        ? ""
        : `style="${this.params.map((p) => p.show()).join(" ")}"`;
    if (this.tagName === "table") {
      let defined: number = 0;
      let stars: number = 0;
      this.children.forEach((child) => {
        const height: Param | undefined = child.params.find(
          (p) => p.name === "height",
        );
        if (!height) {
          stars++;
        } else {
          if (height.value.includes("*")) {
            const numberBeforeStar: string = height.value.substring(
              0,
              height.value.indexOf("*"),
            );
            if (!numberBeforeStar) {
              stars++;
            } else {
              stars += Number.parseFloat(numberBeforeStar);
            }
          } else {
            defined += Number.parseInt(height.value.replace("px", ""));
          }
        }
      });
      this.children.forEach((child) => {
        const height: Param | undefined = child.params.find(
          (p) => p.name === "height",
        );
        if (!height) {
          child.params.push(
            new Param("height", `calc((100% - ${defined}px)/${stars})`),
          );
        } else {
          if (height.value.includes("*")) {
            let numberBeforeStar: string = height.value.substring(
              0,
              height.value.indexOf("*"),
            );
            if (!numberBeforeStar) {
              numberBeforeStar = "1";
            }
            height.value = `calc((100% - ${defined}px)/${stars} * ${numberBeforeStar})`;
          }
        }
      });
    }
    if (this.tagName === "tr") {
      let defined: number = 0;
      let stars: number = 0;
      this.children.forEach((child) => {
        const width: Param | undefined = child.params.find(
          (p) => p.name === "width",
        );
        if (!width) {
          stars++;
        } else {
          if (width.value.includes("*")) {
            const numberBeforeStar: string = width.value.substring(
              0,
              width.value.indexOf("*"),
            );
            if (!numberBeforeStar) {
              stars++;
            } else {
              stars += Number.parseFloat(numberBeforeStar);
            }
          } else {
            defined += Number.parseInt(width.value);
          }
        }
      });
      this.children.forEach((child) => {
        const width: Param | undefined = child.params.find(
          (p) => p.name === "width",
        );
        if (!width) {
          child.params.push(
            new Param("width", `calc((100% - ${defined}px)/${stars})`),
          );
        } else {
          if (width.value.includes("*")) {
            let numberBeforeStar: string = width.value.substring(
              0,
              width.value.indexOf("*"),
            );
            if (!numberBeforeStar) {
              numberBeforeStar = "1";
            }
            width.value = `calc((100% - ${defined}px)/${stars} * ${numberBeforeStar})`;
          }
        }
      });
    }
    const result = `<${this.tagName} data-position="${this.position}" ${styles}${this.isPair ? `>${this.innerText}${this.children.map((p) => p.show()).join("")}</${this.tagName.split(" ")[0]}` : "/"}>`;
    return result;
  }

  /**
   * Parses string into Control object
   * */
  static parse(s: string, position: number): Control {
    //TODO
    // if it`s TR or TD, need to make copies
    //TODO
    // Check Grid.Row and Grid.Column,
    // Think how to wrap in <tr><td></td></tr>

    s = s.replace("<", "").replace(">", "").replace("/", "");
    const splitted = s.split(" ").map((x) => x.trim());
    const block = splitted[0];
    let tag = blanks[block];
    const control: Control = new Control(tag, true, position);
    for (let i = 1; i < splitted.length; i++) {
      if (!splitted[i]) {
        continue;
      }

      const paramName = splitted[i].split("=")[0];
      const paramValue = splitted[i].split("=")[1].split('"')[1];
      if (paramName === "Content") {
        control.innerText = paramValue;
        continue;
      }
      if (paramName === "Grid.Row") {
        control.row = Number.parseInt(paramValue);
        continue;
      }
      if (paramName === "Grid.Column") {
        control.column = Number.parseInt(paramValue);
        continue;
      }
      const param: Param = new Param(paramName, paramValue);
      control.params.push(param);
    }
    return control;
  }
}
