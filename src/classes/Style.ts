import { Param } from "./Param";

export class Style {
  selector: string;
  properties: Param[] = [];
  constructor(selector: string) {
    this.selector = selector;
  }

  addSetter(property: string, value: string): void {
    const propertyName = property.split(".").at(-1) ?? property;
    this.properties.push(new Param(propertyName, value));
  }

  toString() {
    if (this.properties.length === 0) {
      return "";
    }

    return `${this.selector} {\n${this.properties
      .map((property) => `  ${property.show()}`)
      .join("\n")}\n}\n`;
  }

  static parse(tag: string): Style {
    const attributes = parseAttributes(tag);
    const targetType = attributes.TargetType;
    const key = attributes["x:Key"] ?? attributes.Key;
    const selector = key
      ? `.${styleKeyToClassName(key)}`
      : targetType
        ? targetTypeToSelector(targetType)
        : ".wpf-unknown";

    return new Style(selector);
  }

  static parseSetter(tag: string): Param | undefined {
    const attributes = parseAttributes(tag);
    const property = attributes.Property;
    const value = attributes.Value;

    if (!property || value === undefined) {
      return undefined;
    }

    const propertyName = property.split(".").at(-1) ?? property;
    return new Param(propertyName, value);
  }
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

function targetTypeToSelector(value: string): string {
  const targetType = normalizeTargetType(value);
  return `.wpf-${toKebabCase(targetType)}`;
}

export function styleKeyToClassName(value: string): string {
  return `wpf-style-${toKebabCase(value).replace(/[^a-z0-9-]/g, "-")}`;
}

function normalizeTargetType(value: string): string {
  const typeMarkup = value.match(/^\{x:Type\s+([^}]+)\}$/);
  const normalized = (typeMarkup?.[1] ?? value).trim();
  const withoutNamespace = normalized.split(":").at(-1) ?? normalized;
  return withoutNamespace.split(".").at(-1) ?? withoutNamespace;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}
