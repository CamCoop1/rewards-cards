const STORAGE_KEY = "rewardsCards";

let cards = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let activeCardId = null;

const views = {
  list: document.getElementById("listView"),
  form: document.getElementById("formView"),
  detail: document.getElementById("detailView"),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.remove("active"));
  views[name].classList.add("active");
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function renderList() {
  const list = document.getElementById("cardList");
  const empty = document.getElementById("emptyMsg");
  list.innerHTML = "";
  empty.style.display = cards.length ? "none" : "block";

  cards.forEach(card => {
    const item = document.createElement("div");
    item.className = "card-item";
    item.style.borderLeftColor = card.color || "#3b82f6";
    item.innerHTML = `
      <div>
        <div class="name">${escapeHtml(card.label)}</div>
        <div class="type">${card.format}</div>
      </div>
      <div>›</div>
    `;
    item.addEventListener("click", () => openDetail(card.id));
    list.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function openDetail(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;
  activeCardId = id;
  document.getElementById("detailLabel").textContent = card.label;
  document.getElementById("detailValue").textContent = card.value;

  const wrap = document.getElementById("barcodeWrap");
  wrap.innerHTML = "";

  if (card.format === "QR") {
    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    QRCode.toCanvas(canvas, card.value, { width: 240 });
  } else {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    wrap.appendChild(svg);
    try {
      JsBarcode(svg, card.value, {
        format: card.format,
        lineColor: "#000",
        width: 3,
        height: 120,
        displayValue: false,
      });
    } catch (e) {
      wrap.innerHTML = `<p style="color:red">Couldn't render: ${e.message}</p>`;
    }
  }

  showView("detail");
}

document.getElementById("addBtn").addEventListener("click", () => {
  document.getElementById("cardForm").reset();
  showView("form");
});

document.getElementById("cancelBtn").addEventListener("click", () => showView("list"));

document.getElementById("saveBtn").addEventListener("click", () => {
  const label = document.getElementById("fLabel").value.trim();
  const value = document.getElementById("fValue").value.trim();
  const format = document.getElementById("fFormat").value;
  const color = document.getElementById("fColor").value;

  if (!label || !value) return;

  cards.push({
    id: crypto.randomUUID(),
    label, value, format, color,
  });
  save();
  renderList();
  showView("list");
});

document.getElementById("backBtn").addEventListener("click", () => showView("list"));

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (!activeCardId) return;
  if (!confirm("Delete this card?")) return;
  cards = cards.filter(c => c.id !== activeCardId);
  save();
  renderList();
  showView("list");
});

// register service worker for offline/installable use
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

renderList();
