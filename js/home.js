let allSongs = [],
  visibleSongs = [],
  favorites = new Set(
    JSON.parse(localStorage.getItem("utubeMusic_favorites") || "[]"),
  ),
  toastTimer;
const songGrid = document.getElementById("songGrid"),
  emptyState = document.getElementById("emptyState"),
  toast = document.getElementById("toast");
document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    location.href = "login.html";
    return;
  }
  document.getElementById("currentUser").textContent = user.username;
  document.getElementById("avatarInitial").textContent = (user.username ||
    "U")[0].toUpperCase();
  document.getElementById("profileName").textContent = user.username;
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document
    .getElementById("profileButton")
    .addEventListener("click", () =>
      document.getElementById("profileMenu").classList.toggle("hidden"),
    );
  document.addEventListener("click", (e) => {
    if (!document.querySelector(".profile-wrap").contains(e.target))
      document.getElementById("profileMenu").classList.add("hidden");
  });
  document
    .getElementById("menuToggle")
    .addEventListener("click", () =>
      document.getElementById("sidebar").classList.toggle("sidebar-open"),
    );
  ["aiOpenBtn", "heroAiBtn", "sidebarAiBtn", "bannerAiBtn"].forEach((id) =>
    document.getElementById(id).addEventListener("click", openAi),
  );
  try {
    const response = await fetch("data/songs.json");
    if (!response.ok) throw Error("Fetch failed");
    allSongs = await response.json();
    visibleSongs = [...allSongs];
    document.getElementById("dataNotice").textContent =
      `Đã tải ${allSongs.length} bài hát từ nguồn JSON demo.`;
    renderSongs(visibleSongs);
  } catch {
    songGrid.innerHTML =
      '<p class="load-error">Không tải được dữ liệu. Hãy chạy bằng VS Code Live Server.</p>';
    document.getElementById("dataNotice").textContent =
      "Nguồn dữ liệu: data/songs.json";
  }
  document.getElementById("searchInput").addEventListener("input", (e) => {
    let q = e.target.value.trim().toLowerCase();
    visibleSongs = allSongs.filter((s) =>
      `${s.title} ${s.artist} ${s.genre} ${s.mood}`.toLowerCase().includes(q),
    );
    renderSongs(visibleSongs);
  });
  const moodWords = {
    chill: ["chill", "calm"],
    energy: ["energy", "upbeat"],
    focus: ["focus", "instrumental"],
    night: ["night", "dreamy"],
  };
  document.querySelectorAll("[data-mood]").forEach((b) =>
    b.addEventListener("click", () => {
      visibleSongs = allSongs.filter((s) =>
        moodWords[b.dataset.mood].some((w) =>
          `${s.mood} ${s.genre}`.toLowerCase().includes(w),
        ),
      );
      renderSongs(visibleSongs);
      document
        .getElementById("discover")
        .scrollIntoView({ behavior: "smooth" });
      toastMessage("Đã lọc nhạc theo tâm trạng.");
    }),
  );
  document.getElementById("favoritesFilter").addEventListener("click", () => {
    visibleSongs = allSongs.filter((s) => favorites.has(s.id));
    renderSongs(visibleSongs);
    document.getElementById("discover").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("allSongsButton").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    visibleSongs = [...allSongs];
    renderSongs(visibleSongs);
    document.getElementById("discover").scrollIntoView({ behavior: "smooth" });
  });
  document
    .getElementById("prevSongs")
    .addEventListener("click", () =>
      songGrid.scrollBy({ left: -300, behavior: "smooth" }),
    );
  document
    .getElementById("nextSongs")
    .addEventListener("click", () =>
      songGrid.scrollBy({ left: 300, behavior: "smooth" }),
    );
  document.getElementById("aiCloseBtn").addEventListener("click", closeAi);
  document.getElementById("aiModal").addEventListener("click", (e) => {
    if (e.target.id === "aiModal") closeAi();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAi();
  });
  document
    .querySelectorAll("[data-prompt]")
    .forEach((b) => b.addEventListener("click", () => runAI(b.dataset.prompt)));
  document.getElementById("aiForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let input = document.getElementById("aiInput");
    if (input.value.trim()) runAI(input.value.trim());
  });
  updateFavoriteCount();
});
function renderSongs(list) {
  songGrid.innerHTML = "";
  emptyState.classList.toggle("hidden", list.length > 0);
  list.forEach((s) => {
    let card = document.createElement("article");
    card.className = "song-card";
    card.innerHTML = `<div class="cover-art cover-${safeClass(s.cover)}"><span class="cover-index">${String(s.id).padStart(2, "0")}</span><span class="cover-symbol">${s.symbol}</span><button class="favorite-button ${favorites.has(s.id) ? "is-favorite" : ""}" data-favorite="${s.id}" aria-label="Yêu thích ${esc(s.title)}">${favorites.has(s.id) ? "♥" : "♡"}</button></div><div class="song-details"><div><h3>${esc(s.title)}</h3><p>${esc(s.artist)}</p></div><span class="song-menu" title="${esc(s.genre)}">•••</span></div><div class="song-meta"><span>${esc(s.genre)}</span><span>${esc(s.mood.split(" ")[0])}</span></div>`;
    songGrid.appendChild(card);
  });
  songGrid.querySelectorAll("[data-favorite]").forEach((b) =>
    b.addEventListener("click", () => {
      let id = Number(b.dataset.favorite);
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      localStorage.setItem(
        "utubeMusic_favorites",
        JSON.stringify([...favorites]),
      );
      renderSongs(visibleSongs);
      updateFavoriteCount();
      toastMessage(
        favorites.has(id) ? "Đã thêm vào yêu thích." : "Đã bỏ khỏi yêu thích.",
      );
    }),
  );
}
function safeClass(s) {
  return String(s).replace(/[^a-z0-9_-]/gi, "");
}
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function updateFavoriteCount() {
  document.getElementById("favoriteCount").textContent = favorites.size;
}
function toastMessage(msg) {
  toast.textContent = msg;
  toast.classList.add("toast-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("toast-visible"), 2300);
}
function openAi() {
  document.getElementById("aiModal").classList.remove("hidden");
  document.getElementById("aiInput").focus();
}
function closeAi() {
  document.getElementById("aiModal").classList.add("hidden");
}
function runAI(text) {
  let q = text.toLowerCase(),
    tags,
    intro;
  if (/năng lượng|tỉnh|vui|gym|động lực|energy|upbeat|sôi động/.test(q)) {
    tags = ["energy", "upbeat", "pop", "electronic"];
    intro =
      "Bạn cần thêm năng lượng — thử những bản nhạc có nhịp điệu sáng và nhanh hơn.";
  } else if (/tập trung|học|làm việc|focus|đọc sách/.test(q)) {
    tags = ["focus", "instrumental", "ambient"];
    intro =
      "Để tập trung, tôi ưu tiên các bản ít gây xao nhãng và có không khí ổn định.";
  } else if (/đêm|buồn|cô đơn|suy nghĩ|night|dreamy|mệt/.test(q)) {
    tags = ["night", "dreamy", "r&b", "indie"];
    intro =
      "Có vẻ bạn muốn một không gian trầm hơn. Đây là vài gợi ý để nghe chậm lại.";
  } else {
    tags = ["chill", "calm", "lo-fi", "ambient"];
    intro = "Tôi chọn hướng nhẹ nhàng để bạn thư giãn và thả lỏng một chút.";
  }
  let rec = allSongs
    .filter((s) =>
      tags.some((t) => `${s.mood} ${s.genre}`.toLowerCase().includes(t)),
    )
    .slice(0, 3);
  if (!rec.length) rec = allSongs.slice(0, 3);
  document.getElementById("aiResponse").innerHTML =
    `<span class="ai-response-mark">✦</span><p>${esc(intro)}</p><div class="ai-recommendations">${rec.map((s) => `<div class="ai-rec"><span class="ai-rec-cover cover-${safeClass(s.cover)}">♫</span><div><b>${esc(s.title)}</b><small>${esc(s.artist)} · ${esc(s.genre)}</small></div></div>`).join("")}</div><p class="ai-small-note">Gợi ý demo dựa trên từ khóa, không phải mô hình AI trực tuyến.</p>`;
  document.getElementById("aiInput").value = "";
}
