import { Param } from "./Param";




const blanks: { [id: string]: string } = {
  Border: `div class="border"`,

  BulletDecorator: "div",

  Canvas: "div class=canvas", // all elements inside are absolute

  DockPanel: "div", //top, left, right, center, bottom

  Expander: "div", // expands like select, but with content

  Grid: "table", // table (need to decide what to do with Grid.Row=0 ... )

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
  TextBlock: "p", // div is okay too
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







export class Control {
  tagName: string = "div";
  isPair: boolean;
  children: Control[] = [];
  params: Param[] = [];
  constructor(tagName: string, isPair: boolean) {
    this.tagName = tagName;
    this.isPair = isPair;
  }
  show(): string {
    return `<${this.tagName} ${this.params.map((p) => p.show()).join(" ")} ${this.isPair ? `>${this.children.map((p) => p.show()).join()}</${this.tagName}` : "/"}> `;
  }
  static parse(s: string): Control {
    // Parses string into Control object
    s = s.replace("<", "").replace(">", "").replace("/", "");
    const block = s.split(" ")[0];
    let tag = blanks[block];
    s = s.toLowerCase();
    return new Control(tag, true);
  }
}
