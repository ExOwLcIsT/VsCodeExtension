export function wpfSizeToCss(value: string): string {
  const trimmed = value.trim();

  if (trimmed === "Auto") {
    return "auto";
  }

  if (trimmed.endsWith("*")) {
    const starValue = trimmed.slice(0, -1).trim();
    return `${starValue ? Number(starValue) : 1}fr`;
  }

  if (!Number.isNaN(Number(trimmed))) {
    return `${trimmed}px`;
  }

  return trimmed;
}

export function wpfThicknessToCss(value: string): string {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(wpfSizeToCss);

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    const [horizontal, vertical] = parts;
    return `${vertical} ${horizontal}`;
  }

  if (parts.length === 4) {
    const [left, top, right, bottom] = parts;
    return `${top} ${right} ${bottom} ${left}`;
  }

  return value;
}

export function wpfCornerRadiusToCss(value: string): string {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(wpfSizeToCss);

  return parts.length > 0 ? parts.join(" ") : value;
}
