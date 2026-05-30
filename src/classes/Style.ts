import { Param } from "./Param";

export class Style {
  selector: string;
  key?: string;
  targetType?: string;
  basedOn?: string;
  properties: Param[] = [];
  constructor(
    selector: string,
    key?: string,
    targetType?: string,
    basedOn?: string,
  ) {
    this.selector = selector;
    this.key = key;
    this.targetType = targetType;
    this.basedOn = basedOn;
  }

  addSetter(property: string, value: string): void {
    const propertyName = property.split(".").at(-1) ?? property;
    this.properties.push(new Param(propertyName, value));
  }

  resolve(allStyles: Style[], seen: Set<Style> = new Set()): Param[] {
    if (!this.basedOn || seen.has(this)) {
      return this.properties;
    }

    seen.add(this);
    const parent = allStyles.find((style) => style.key === this.basedOn);
    if (!parent) {
      return this.properties;
    }

    return [...parent.resolve(allStyles, seen), ...this.properties];
  }

  toString(allStyles: Style[] = [this]) {
    const properties = this.resolve(allStyles);

    if (properties.length === 0) {
      return "";
    }

    return `${this.selector} {\n${properties
      .map((property) => `  ${property.show()}`)
      .join("\n")}\n}\n`;
  }

  static parse(tag: string): Style {
    const attributes = parseAttributes(tag);
    const targetType = attributes.TargetType;
    const key = attributes["x:Key"] ?? attributes.Key;
    const basedOn = getStyleResourceKey(attributes.BasedOn);
    const selector = key
      ? `.${styleKeyToClassName(key)}`
      : targetType
        ? targetTypeToSelector(targetType)
        : ".wpf-unknown";

    return new Style(selector, key, targetType, basedOn);
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

function getStyleResourceKey(value: string | undefined): string | undefined {
  const match = value?.match(/^\{(?:StaticResource|DynamicResource)\s+([^}]+)\}$/);
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
