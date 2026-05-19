import { Control } from "./Control";

class GridRowColumn {
  param: number; // Height for rows and Width for columns
  constructor(param: number) {
    this.param = param;
  }
}

export class GridControl extends Control {
  rows: GridRowColumn[];
  columns: GridRowColumn[];
  constructor(
    open: string,
    close: string,
    position: number,
    rows: GridRowColumn[],
    columns: GridRowColumn[],
  ) {
    super(open, close, position);
    this.rows = rows;
    this.columns = columns;
  }
  addChild(child: Control): void {
    const childMargin = child.params.find((p) => p.name === "margin");
    super.addChild(child);
  }
}
