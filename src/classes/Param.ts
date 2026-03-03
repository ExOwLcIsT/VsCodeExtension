export class Param {
  name: string;
  value: string;
  unit: string;
  constructor(name: string, value: string, unit: string) {
    this.name = name;
    this.value = value;
    this.unit = unit;
  }
  show() {
    return `${this.name}="${this.value}${this.unit}"`;
  }
}
