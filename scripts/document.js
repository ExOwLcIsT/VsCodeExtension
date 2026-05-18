const vsCodeAPI = acquireVsCodeApi();
window.addEventListener("message", (event) => {
  const xaml = event.data.xaml ?? "";
  document.body.innerHTML = `<main class="preview-root">${xaml}</main>`;
});
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
