import {
  wpfCornerRadiusToCss,
  wpfSizeToCss,
  wpfThicknessToCss,
} from "./wpfValues";

export class Param {
  name: string;
  value: string;
  unit: string;
  constructor(name: string, value: string) {
    const mapping = paramMappings[name];
    this.name = mapping?.cssName ?? name.toLowerCase();
    this.unit = mapping?.unit ?? "";
    this.value = mapping?.transform ? mapping.transform(value) : value;
  }
  show() {
    return `${this.name}:${this.value}${this.unit};`;
  }
}
interface ParamMapping {
  cssName: string;
  unit: string;
  transform?: (value: string) => string;
}
function wpfColorToCss(value: string): string {
  // Named colors: "Red" -> "red"
  if (!value.startsWith("#")) {
    return value.toLowerCase();
  }

  // #AARRGGBB -> rgba(r,g,b,a)
  if (value.length === 9) {
    const a = parseInt(value.slice(1, 3), 16) / 255;
    const r = parseInt(value.slice(3, 5), 16);
    const g = parseInt(value.slice(5, 7), 16);
    const b = parseInt(value.slice(7, 9), 16);
    return `rgba(${r},${g},${b},${a.toFixed(2)})`;
  }

  // #RRGGBB -> pass through
  return value;
}
const paramMappings: { [wpfProp: string]: ParamMapping } = {
  // Layout & Spacing
  Width: {
    cssName: "width",
    unit: "",

    transform: wpfSizeToCss,
  },
  Height: {
    cssName: "height",
    unit: "",

    transform: wpfSizeToCss,
  },
  MinWidth: {
    cssName: "min-width",
    unit: "",
    transform: wpfSizeToCss,
  },
  MinHeight: {
    cssName: "min-height",
    unit: "",

    transform: wpfSizeToCss,
  },
  MaxWidth: {
    cssName: "max-width",
    unit: "",

    transform: wpfSizeToCss,
  },
  MaxHeight: {
    cssName: "max-height",
    unit: "",

    transform: wpfSizeToCss,
  },
  Margin: { cssName: "margin", unit: "", transform: wpfThicknessToCss },
  Padding: { cssName: "padding", unit: "", transform: wpfThicknessToCss },

  // Alignment
  HorizontalAlignment: {
    cssName: "align-self",
    unit: "",
    transform: (v) =>
      ({
        Left: "flex-start",
        Right: "flex-end",
        Center: "center",
        Stretch: "stretch",
      })[v] ?? v,
  },
  VerticalAlignment: {
    cssName: "align-self",
    unit: "",
    transform: (v) =>
      ({
        Top: "flex-start",
        Bottom: "flex-end",
        Center: "center",
        Stretch: "stretch",
      })[v] ?? v,
  },
  HorizontalContentAlignment: {
    cssName: "justify-content",
    unit: "",
    transform: (v) =>
      ({
        Left: "flex-start",
        Right: "flex-end",
        Center: "center",
        Stretch: "stretch",
      })[v] ?? v,
  },
  VerticalContentAlignment: {
    cssName: "align-items",
    unit: "",
    transform: (v) =>
      ({
        Top: "flex-start",
        Bottom: "flex-end",
        Center: "center",
        Stretch: "stretch",
      })[v] ?? v,
  },

  // Typography
  FontSize: { cssName: "font-size", unit: "", transform: wpfSizeToCss },
  FontWeight: {
    cssName: "font-weight",
    unit: "",
    transform: (v) =>
      ({
        Thin: "100",
        Light: "300",
        Normal: "400",
        Medium: "500",
        SemiBold: "600",
        Bold: "700",
        ExtraBold: "800",
        Black: "900",
      })[v] ?? v,
  },
  FontStyle: {
    cssName: "font-style",
    unit: "",
    transform: (v) =>
      ({ Italic: "italic", Normal: "normal", Oblique: "oblique" })[v] ?? v,
  },
  FontFamily: { cssName: "font-family", unit: "" },
  TextAlignment: {
    cssName: "text-align",
    unit: "",
    transform: (v) =>
      ({ Left: "left", Right: "right", Center: "center", Justify: "justify" })[
        v
      ] ?? v,
  },
  TextWrapping: {
    cssName: "white-space",
    unit: "",
    transform: (v) =>
      ({ Wrap: "normal", NoWrap: "nowrap", WrapWithOverflow: "pre-wrap" })[v] ??
      v,
  },
  TextDecorations: {
    cssName: "text-decoration",
    unit: "",
    transform: (v) =>
      ({ Underline: "underline", Strikethrough: "line-through", None: "none" })[
        v
      ] ?? v,
  },
  LineHeight: { cssName: "line-height", unit: "", transform: wpfSizeToCss },

  // Color
  Foreground: { cssName: "color", unit: "", transform: wpfColorToCss },
  Background: {
    cssName: "background-color",
    unit: "",
    transform: wpfColorToCss,
  },
  BorderBrush: { cssName: "border-color", unit: "", transform: wpfColorToCss },
  Fill: { cssName: "background-color", unit: "", transform: wpfColorToCss },
  Stroke: { cssName: "border-color", unit: "", transform: wpfColorToCss },

  // Border
  BorderThickness: {
    cssName: "border-width",
    unit: "",
    transform: wpfThicknessToCss,
  },
  CornerRadius: {
    cssName: "border-radius",
    unit: "",
    transform: wpfCornerRadiusToCss,
  },

  // Visibility & Opacity
  Opacity: { cssName: "opacity", unit: "" },
  Visibility: {
    cssName: "visibility",
    unit: "",
    transform: (v) =>
      ({ Visible: "visible", Hidden: "hidden", Collapsed: "hidden" })[v] ?? v,
  },

  // Positioning (Canvas)
  "Canvas.Left": { cssName: "left", unit: "", transform: wpfSizeToCss },
  "Canvas.Top": { cssName: "top", unit: "", transform: wpfSizeToCss },
  "Canvas.Right": { cssName: "right", unit: "", transform: wpfSizeToCss },
  "Canvas.Bottom": { cssName: "bottom", unit: "", transform: wpfSizeToCss },
  "Canvas.ZIndex": { cssName: "z-index", unit: "" },

  // Flex (StackPanel)
  Orientation: {
    cssName: "flex-direction",
    unit: "",
    transform: (v) => ({ Horizontal: "row", Vertical: "column" })[v] ?? v,
  },

  // Cursor
  Cursor: {
    cssName: "cursor",
    unit: "",
    transform: (v) =>
      ({
        Arrow: "default",
        Hand: "pointer",
        Wait: "wait",
        Cross: "crosshair",
        IBeam: "text",
        None: "none",
      })[v] ?? v,
  },

  // Misc
  IsEnabled: {
    cssName: "pointer-events",
    unit: "",
    transform: (v) => (v === "False" ? "none" : "auto"),
  },
  FlowDirection: {
    cssName: "direction",
    unit: "",
    transform: (v) => ({ LeftToRight: "ltr", RightToLeft: "rtl" })[v] ?? v,
  },
  ToolTip: { cssName: "title", unit: "" }, // attribute, not style
};
