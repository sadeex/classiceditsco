import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const BRAND = "Classic Creative Co";
const PLACEHOLDER = "assets/classic-co-logo.png";

const slugify = (value = "") => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 70) || `post-${Date.now()}`;

const money = (value) => {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "LKR 0";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(num);
};

const escapeHTML = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const getBaseUrl = () => {
  const current = window.location.href;
  if (current.includes("/admin.html")) return current.replace("/admin.html", "/");
  if (current.includes("/post.html")) return current.replace("/post.html", "/");
  if (current.includes("/index.html")) return current.replace("/index.html", "/");
  return current.endsWith("/") ? current : `${current.substring(0, current.lastIndexOf("/") + 1)}`;
};

const postUrl = (slug) => `post.html?slug=${encodeURIComponent(slug)}`;
const shareUrl = (slug) => `${getBaseUrl()}post.html?slug=${encodeURIComponent(slug)}`;

const normalizePost = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    slug: data.slug || docSnap.id,
    title: data.title || "Untitled Post",
    category: data.category || "General",
    price: data.price || 0,
    description: data.description || "",
    image: data.image || PLACEHOLDER,
    imagePath: data.imagePath || "",
    orderLink: data.orderLink || "#",
    createdAt: data.createdAt || 0,
    updatedAt: data.updatedAt || 0,
  };
};

const watchPosts = (onData, onError) => {
  const postsRef = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(postsRef, (snapshot) => {
    const posts = snapshot.docs.map(normalizePost);
    onData(posts);
  }, onError);
};

const loadPostBySlug = async (slug) => {
  if (!slug) return null;
  const ref = doc(db, "posts", slug);
  const snap = await getDoc(ref);
  return snap.exists() ? normalizePost(snap) : null;
};

const updateYear = () => {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
};

export {
  BRAND,
  PLACEHOLDER,
  slugify,
  money,
  escapeHTML,
  postUrl,
  shareUrl,
  watchPosts,
  loadPostBySlug,
  updateYear,
};
