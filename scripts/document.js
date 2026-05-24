const vsCodeAPI = acquireVsCodeApi();
window.addEventListener("message", (event) => {
  const xaml = event.data.xaml ?? "";
  const styles = event.data.styles ?? "";
  const styleElement = document.getElementById("xaml-styles");
  if (styleElement) {
    styleElement.textContent = styles;
  }
  document.body.innerHTML = `<main class="preview-root">${xaml}</main>`;
  syncAutoGridColumns();
  syncGridColumnSpans();
  syncGridRowSpans();
});

function syncAutoGridColumns() {
  const grids = document.querySelectorAll(".wpf-grid, .table");
  grids.forEach((grid) => {
    const rows = Array.from(grid.children).filter((child) =>
      child.matches(".wpf-grid-row, .tr"),
    );
    const autoCellsByColumn = [];

    rows.forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (!cell.matches(".wpf-grid-cell, .td")) {
          return;
        }
        if (Number(cell.dataset.columnSpan ?? "1") > 1) {
          return;
        }
        if (cell.dataset.spanPlaceholder) {
          return;
        }
        if (cell.style.width !== "auto" && cell.style.width !== "fit-content") {
          return;
        }
        autoCellsByColumn[index] ??= [];
        autoCellsByColumn[index].push(cell);
      });
    });

    autoCellsByColumn.forEach((cells) => {
      if (!cells || cells.length === 0) {
        return;
      }

      cells.forEach((cell) => {
        cell.style.flexBasis = "auto";
        cell.style.width = "max-content";
      });

      const width = Math.max(
        ...cells.map((cell) => cell.getBoundingClientRect().width),
      );

      cells.forEach((cell) => {
        cell.style.width = `${width}px`;
        cell.style.flex = `0 0 ${width}px`;
      });
    });
  });
}

function syncGridColumnSpans() {
  const grids = document.querySelectorAll(".wpf-grid, .table");
  grids.forEach((grid) => {
    const rows = Array.from(grid.children).filter((child) =>
      child.matches(".wpf-grid-row, .tr"),
    );
    const columnMetrics = getGridColumnMetrics(rows);

    rows.forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        const columnSpan = Number(cell.dataset.columnSpan ?? "1");
        if (columnSpan <= 1) {
          return;
        }

        const column = Number(cell.dataset.gridColumn ?? index);
        const metrics = columnMetrics
          .slice(column, column + columnSpan)
          .reduce(
            (acc, metric) => ({
              fixed: acc.fixed + metric.fixed,
              flex: acc.flex + metric.flex,
            }),
            { fixed: 0, flex: 0 },
          );

        if (metrics.flex > 0) {
          cell.style.width = "";
          cell.style.flex = `${metrics.flex} 1 ${metrics.fixed}px`;
          cell.style.minWidth = `${metrics.fixed}px`;
          return;
        }

        cell.style.width = `${metrics.fixed}px`;
        cell.style.flex = `0 0 ${metrics.fixed}px`;
      });
    });
  });
}

function getGridColumnMetrics(rows) {
  const metrics = [];

  rows.forEach((row) => {
    Array.from(row.children).forEach((cell, index) => {
      if (!cell.matches(".wpf-grid-cell, .td")) {
        return;
      }
      if (cell.dataset.spanPlaceholder) {
        return;
      }
      if (Number(cell.dataset.columnSpan ?? "1") > 1) {
        return;
      }

      const column = Number(cell.dataset.gridColumn ?? index);
      metrics[column] ??= { fixed: 0, flex: 0 };

      const width = parsePixelValue(cell.style.width);
      const flexBasis = parseFlexBasis(cell.style.flex);
      const flexGrow = parseFlexGrow(cell.style.flex);

      if (width !== undefined) {
        metrics[column].fixed = Math.max(metrics[column].fixed, width);
      } else if (flexBasis !== undefined) {
        metrics[column].fixed = Math.max(metrics[column].fixed, flexBasis);
      } else if (cell.style.width === "auto" || cell.style.width === "fit-content") {
        metrics[column].fixed = Math.max(
          metrics[column].fixed,
          cell.getBoundingClientRect().width,
        );
      }

      if (flexGrow > 0) {
        metrics[column].flex = Math.max(metrics[column].flex, flexGrow);
      }
    });
  });

  return Array.from(
    { length: metrics.length },
    (_, index) => metrics[index] ?? { fixed: 0, flex: 1 },
  );
}

function parseFlexGrow(value) {
  const flexGrow = Number.parseFloat(value.split(/\s+/)[0]);
  return Number.isNaN(flexGrow) ? 0 : flexGrow;
}

function parseFlexBasis(value) {
  const parts = value.split(/\s+/);
  return parsePixelValue(parts[2] ?? "");
}

function parsePixelValue(value) {
  if (!value.endsWith("px")) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function syncGridRowSpans() {
  const grids = document.querySelectorAll(".wpf-grid, .table");
  grids.forEach((grid) => {
    const rows = Array.from(grid.children).filter((child) =>
      child.matches(".wpf-grid-row, .tr"),
    );

    rows.forEach((row, rowIndex) => {
      Array.from(row.children).forEach((cell) => {
        const rowSpan = Number(cell.dataset.rowSpan ?? "1");
        if (rowSpan <= 1) {
          return;
        }
        const child = Array.from(cell.children).find((currentChild) =>
          currentChild.matches("[data-position]"),
        );
        if (!child) {
          return;
        }
        if (child?.dataset.explicitHeight === "true") {
          return;
        }
        if (
          child?.dataset.wpfVerticalAlignment &&
          child.dataset.wpfVerticalAlignment !== "stretch"
        ) {
          return;
        }

        const height = rows
          .slice(rowIndex, rowIndex + rowSpan)
          .reduce((sum, currentRow) => {
            return sum + currentRow.getBoundingClientRect().height;
          }, 0);

        const childHeight = child.getBoundingClientRect().height;
        const childStyle = window.getComputedStyle(child);
        const marginTop = parsePixelValue(childStyle.marginTop) ?? 0;
        const marginRight = parsePixelValue(childStyle.marginRight) ?? 0;
        const marginBottom = parsePixelValue(childStyle.marginBottom) ?? 0;
        const marginLeft = parsePixelValue(childStyle.marginLeft) ?? 0;
        const stretchedHeight = Math.max(0, height - marginTop - marginBottom);
        cell.style.minHeight = `${childHeight}px`;
        cell.style.height = "";
        cell.style.overflow = "visible";
        cell.style.zIndex = "1";
        child.style.position = "absolute";
        child.style.top = `${marginTop}px`;
        child.style.left = `${marginLeft}px`;
        child.style.right = `${marginRight}px`;
        child.style.margin = "0";
        child.style.width = "auto";
        child.style.maxWidth = "none";
        child.style.height = `${stretchedHeight}px`;
        child.style.boxSizing = "border-box";
        child.style.zIndex = "1";
        if (child.matches(".wpf-text-box")) {
          child.style.paddingTop = child.style.paddingTop || "3px";
          child.style.paddingBottom = "0";
          child.style.lineHeight = "1.2";
        }
      });
    });
  });
}
document.addEventListener("dblclick", (e) => {
  const target = e.target.closest("[data-position]");
  if (!target) {
    return;
  }
  const position = Number(target.dataset.position);
  vsCodeAPI.postMessage({ position });
});
document.addEventListener("click", (e) => {
  const target = e.target;
  if (!target) {
    return;
  }
  target.classList.add("hovered");
});
document.addEventListener("mouseout", (e) => {
  const target = e.target;
  if (!target) {
    return;
  }
  target.classList.remove("hovered");
});
