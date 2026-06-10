import {
  BRAND,
  PLACEHOLDER,
  money,
  escapeHTML,
  postUrl,
  shareUrl,
  watchPosts,
  loadPostBySlug,
  updateYear,
} from "./site-core.js";

const renderFilters = (posts, activeCategory, mount, onChange) => {
  if (!mount) return;
  const categories = ["All", ...new Set(posts.map((post) => post.category).filter(Boolean))];
  mount.innerHTML = categories.map((category) => `
    <button class="filter-btn ${category === activeCategory ? "active" : ""}" type="button" data-category="${escapeHTML(category)}">
      ${escapeHTML(category)}
    </button>
  `).join("");

  mount.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => onChange(btn.dataset.category));
  });
};

const createCard = (post) => `
  <article class="post-card">
    <img class="post-cover" src="${escapeHTML(post.image || PLACEHOLDER)}" alt="${escapeHTML(post.title)}" loading="lazy">
    <div class="post-card-body">
      <div class="tag-row">
        <span class="tag">${escapeHTML(post.category || "General")}</span>
        <span class="price-tag">${escapeHTML(money(post.price))}</span>
      </div>
      <h4 class="mt-2">${escapeHTML(post.title)}</h4>
      <p>${escapeHTML(post.description || "")}</p>
      <div class="post-actions">
        <a class="btn-outline" href="${postUrl(post.slug)}">View Details</a>
        <a class="btn" href="${escapeHTML(post.orderLink || postUrl(post.slug))}" target="_blank" rel="noopener">Order Now</a>
      </div>
    </div>
  </article>
`;

const renderHomePosts = () => {
  const grid = document.getElementById("postsGrid");
  const filtersMount = document.getElementById("categoryFilters");
  const empty = document.getElementById("postsEmpty");
  const status = document.getElementById("postsStatus");
  if (!grid) return;

  let activeCategory = "All";
  let currentPosts = [];

  const refresh = () => {
    const categories = ["All", ...new Set(currentPosts.map((post) => post.category).filter(Boolean))];
    if (!categories.includes(activeCategory)) activeCategory = "All";

    const filtered = activeCategory === "All"
      ? currentPosts
      : currentPosts.filter((post) => post.category === activeCategory);

    renderFilters(currentPosts, activeCategory, filtersMount, (next) => {
      activeCategory = next;
      refresh();
    });

    if (!filtered.length) {
      grid.innerHTML = "";
      empty?.classList.remove("hide");
      return;
    }

    empty?.classList.add("hide");
    grid.innerHTML = filtered.map(createCard).join("");
  };

  status && (status.textContent = "Loading posts from Firebase...");

  watchPosts((posts) => {
    currentPosts = posts;
    if (status) status.textContent = posts.length ? "Live posts loaded from Firebase." : "No posts published yet.";
    refresh();
  }, () => {
    if (status) {
      status.textContent = "Firebase posts load wenne live hosting waladi. Preview eke network block wenna puluwan.";
    }
    grid.innerHTML = "";
    empty?.classList.remove("hide");
  });
};

const renderPostDetail = async () => {
  const mount = document.getElementById("postDetail");
  if (!mount) return;

  const shareField = document.getElementById("shareUrl");
  const quickMeta = document.getElementById("quickMeta");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    mount.innerHTML = `
      <section class="detail-card empty-card">
        <h4>Post not found</h4>
        <p>URL eke slug parameter eka nethi nisa post eka load karanna bari una.</p>
        <div class="post-actions center">
          <a class="btn-outline" href="index.html">Back to Home</a>
        </div>
      </section>
    `;
    return;
  }

  mount.innerHTML = `
    <section class="detail-card empty-card">
      <h4>Loading post...</h4>
      <p>Firebase eken post details load karamin.</p>
    </section>
  `;

  try {
    const post = await loadPostBySlug(slug);

    if (!post) {
      mount.innerHTML = `
        <section class="detail-card empty-card">
          <h4>Post not found</h4>
          <p>Me slug eka samaga Firebase database eke post ekak hambune ne.</p>
          <div class="post-actions center">
            <a class="btn-outline" href="index.html">Back to Home</a>
            <a class="btn" href="admin.html">Open Admin Panel</a>
          </div>
        </section>
      `;
      return;
    }

    document.title = `${post.title} | ${BRAND}`;
    mount.innerHTML = `
      <article class="detail-card">
        <img class="detail-cover" src="${escapeHTML(post.image || PLACEHOLDER)}" alt="${escapeHTML(post.title)}">
        <div class="detail-body">
          <div class="tag-row">
            <span class="tag">${escapeHTML(post.category || "General")}</span>
            <span class="price-tag">${escapeHTML(money(post.price))}</span>
          </div>
          <h1 class="mt-2">${escapeHTML(post.title)}</h1>
          <div class="detail-meta mt-1">
            <span class="meta-pill">Live from Firebase</span>
            <span class="meta-pill">Shareable URL</span>
            <span class="meta-pill">Published ${new Date(post.createdAt || Date.now()).toLocaleDateString("en-LK")}</span>
          </div>
          <p class="mt-3">${escapeHTML(post.description || "")}</p>
          <div class="post-actions mt-3">
            <a class="btn" href="${escapeHTML(post.orderLink || "#")}" target="_blank" rel="noopener">Order Now</a>
            <a class="btn-outline" href="index.html#latest-posts">Back to Posts</a>
          </div>
        </div>
      </article>
    `;

    if (shareField) shareField.value = shareUrl(post.slug);
    if (quickMeta) {
      quickMeta.innerHTML = `
        <div class="mini-card">
          <strong>Category</strong>
          <p class="mt-0">${escapeHTML(post.category || "General")}</p>
        </div>
        <div class="mini-card">
          <strong>Price</strong>
          <p class="mt-0">${escapeHTML(money(post.price))}</p>
        </div>
        <div class="mini-card">
          <strong>Order Link</strong>
          <p class="mt-0">${escapeHTML(post.orderLink || "Not provided")}</p>
        </div>
      `;
    }
  } catch {
    mount.innerHTML = `
      <section class="detail-card empty-card">
        <h4>Unable to load post</h4>
        <p>Firebase connection error ekak nisa post eka load karanna bari una. Live hosting eke auth/database setup check karanna.</p>
        <div class="post-actions center">
          <a class="btn-outline" href="index.html">Back to Home</a>
        </div>
      </section>
    `;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  updateYear();
  renderHomePosts();
  renderPostDetail();
});
