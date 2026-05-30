const vsCodeAPI = acquireVsCodeApi();

window.addEventListener("message", (event) => {
  const xaml = event.data.xaml ?? "";
  const styles = event.data.styles ?? "";
  const styleElement = document.getElementById("xaml-styles");
  if (styleElement) {
    styleElement.textContent = styles;
  }

  let root = document.querySelector(".preview-root");
  if (!root) {
    document.body.innerHTML = '<main class="preview-root"></main>';
    root = document.querySelector(".preview-root");
  }

  if (root) {
    root.innerHTML = xaml;
  }
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
