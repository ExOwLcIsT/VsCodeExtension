const vsCodeAPI = acquireVsCodeApi();
window.addEventListener("message", (event) => {
  const xaml = event.data.xaml ?? "";
  document.body.innerHTML = `<main class="preview-root">${xaml}</main>`;
  syncAutoGridColumns();
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
