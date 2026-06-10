import { auth, db, storage } from "./firebase-config.js";
import { PLACEHOLDER, slugify, money, shareUrl } from "./site-core.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginView = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const postForm = document.getElementById("postForm");
  const postsList = document.getElementById("postsList");
  const imageUrlInput = document.getElementById("imageUrl");
  const imageFileInput = document.getElementById("imageFile");
  const imagePreview = document.getElementById("imagePreview");
  const shareLinkField = document.getElementById("shareLink");
  const loginStatus = document.getElementById("loginStatus");
  const formStatus = document.getElementById("formStatus");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const editorHeading = document.getElementById("editorHeading");
  const oldSlugInput = document.getElementById("oldSlug");
  const existingImageInput = document.getElementById("existingImage");
  const existingImagePathInput = document.getElementById("existingImagePath");
  const loadingNote = document.getElementById("postsLoadingNote");

  let postsUnsubscribe = null;

  const show = (el) => el?.classList.remove("hide");
  const hide = (el) => el?.classList.add("hide");

  const setStatus = (mount, message, type = "success") => {
    if (!mount) return;
    mount.textContent = message;
    mount.className = `status-message ${type}`;
    show(mount);
  };

  const clearStatus = (mount) => {
    if (!mount) return;
    mount.textContent = "";
    mount.className = "status-message hide";
  };

  const getFileDataUrl = async () => {
    const file = imageFileInput?.files?.[0];
    if (!file) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Image preview hadanna bari una."));
      reader.readAsDataURL(file);
    });
  };

  const updatePreview = async () => {
    try {
      const previewData = await getFileDataUrl();
      const src = previewData || imageUrlInput.value.trim() || existingImageInput.value || PLACEHOLDER;
      imagePreview.innerHTML = `<img src="${src}" alt="Preview">`;
    } catch {
      imagePreview.innerHTML = `<img src="${PLACEHOLDER}" alt="Preview">`;
    }
  };

  const resetForm = () => {
    postForm.reset();
    oldSlugInput.value = "";
    existingImageInput.value = "";
    existingImagePathInput.value = "";
    editorHeading.textContent = "Create New Post";
    shareLinkField.value = "";
    imagePreview.innerHTML = `<img src="${PLACEHOLDER}" alt="Preview">`;
    clearStatus(formStatus);
  };

  const fillForm = (post) => {
    oldSlugInput.value = post.slug || "";
    existingImageInput.value = post.image || "";
    existingImagePathInput.value = post.imagePath || "";
    editorHeading.textContent = "Edit Existing Post";
    document.getElementById("title").value = post.title || "";
    document.getElementById("slug").value = post.slug || "";
    document.getElementById("category").value = post.category || "";
    document.getElementById("price").value = post.price || "";
    document.getElementById("description").value = post.description || "";
    imageUrlInput.value = post.image?.startsWith("http") ? post.image : "";
    document.getElementById("orderLink").value = post.orderLink || "";
    shareLinkField.value = shareUrl(post.slug);
    imagePreview.innerHTML = `<img src="${post.image || PLACEHOLDER}" alt="Preview">`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadImageIfNeeded = async (slug) => {
    const file = imageFileInput?.files?.[0];
    if (!file) {
      return {
        image: imageUrlInput.value.trim() || existingImageInput.value || PLACEHOLDER,
        imagePath: existingImagePathInput.value || "",
      };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storagePath = `posts/${slug}/${Date.now()}-${safeName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      image: downloadUrl,
      imagePath: storagePath,
    };
  };

  const renderPosts = () => {
    if (postsUnsubscribe) postsUnsubscribe();

    const postsRef = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    postsUnsubscribe = onSnapshot(postsRef, (snapshot) => {
      const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      if (loadingNote) loadingNote.textContent = posts.length ? "Live posts sync from Firebase." : "No posts found in Firebase yet.";

      if (!posts.length) {
        postsList.innerHTML = `
          <div class="empty-card">
            <h4>No posts yet</h4>
            <p>Firebase Firestore eke thawama post ekak save wela ne.</p>
          </div>
        `;
        return;
      }

      postsList.innerHTML = posts.map((post) => `
        <div class="mini-card" data-id="${post.slug}">
          <strong>${post.title}</strong>
          <p class="mt-0">${post.category || "General"} · ${money(post.price)}</p>
          <p class="mt-0 help-text">${shareUrl(post.slug)}</p>
          <div class="mini-card-actions">
            <button class="btn-outline" type="button" data-action="copy" data-slug="${post.slug}">Copy URL</button>
            <button class="btn-outline" type="button" data-action="edit" data-slug="${post.slug}">Edit</button>
            <button class="btn-danger" type="button" data-action="delete" data-slug="${post.slug}">Delete</button>
          </div>
        </div>
      `).join("");
    }, () => {
      if (loadingNote) loadingNote.textContent = "Firebase posts load karanna bari una. Rules / hosting / network check karanna.";
    });
  };

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus(loginStatus);

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus(loginStatus, "Login successful.", "success");
    } catch (error) {
      setStatus(loginStatus, error.message || "Login failed.", "error");
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
    resetForm();
  });

  imageUrlInput?.addEventListener("input", updatePreview);
  imageFileInput?.addEventListener("change", updatePreview);

  postForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus(formStatus);

    try {
      const title = document.getElementById("title").value.trim();
      const slugInput = document.getElementById("slug").value.trim();
      const slug = slugify(slugInput || title);
      const oldSlug = oldSlugInput.value.trim();
      const category = document.getElementById("category").value.trim();
      const price = Number(document.getElementById("price").value.trim() || 0);
      const description = document.getElementById("description").value.trim();
      const orderLink = document.getElementById("orderLink").value.trim();
      const currentDoc = await getDoc(doc(db, "posts", slug));

      if (currentDoc.exists() && oldSlug !== slug) {
        setStatus(formStatus, "Me slug eka already use wela thiyenawa. Wenas slug ekak denna.", "error");
        return;
      }

      const imageData = await uploadImageIfNeeded(slug);
      const timestamp = Date.now();
      const existingOld = oldSlug ? await getDoc(doc(db, "posts", oldSlug)) : null;
      const existingCreatedAt = existingOld?.exists() ? existingOld.data().createdAt : null;

      const payload = {
        slug,
        title,
        category,
        price,
        description,
        image: imageData.image,
        imagePath: imageData.imagePath,
        orderLink,
        createdAt: existingCreatedAt || timestamp,
        updatedAt: timestamp,
      };

      await setDoc(doc(db, "posts", slug), payload);
      if (oldSlug && oldSlug !== slug) {
        await deleteDoc(doc(db, "posts", oldSlug));
      }

      oldSlugInput.value = slug;
      existingImageInput.value = imageData.image;
      existingImagePathInput.value = imageData.imagePath;
      shareLinkField.value = shareUrl(slug);
      editorHeading.textContent = "Edit Existing Post";
      setStatus(formStatus, `Post saved to Firebase successfully. URL: ${shareUrl(slug)}`, "success");
      updatePreview();
    } catch (error) {
      setStatus(formStatus, error.message || "Post save karanna bari una.", "error");
    }
  });

  document.getElementById("resetBtn")?.addEventListener("click", resetForm);
  document.getElementById("copyShareBtn")?.addEventListener("click", async () => {
    if (!shareLinkField.value) return;
    try {
      await navigator.clipboard.writeText(shareLinkField.value);
      setStatus(formStatus, "Share URL copied.", "success");
    } catch {
      setStatus(formStatus, "Copy failed. URL eka manually copy karanna.", "error");
    }
  });

  postsList?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const slug = button.dataset.slug;
    if (!slug) return;

    if (action === "copy") {
      try {
        await navigator.clipboard.writeText(shareUrl(slug));
        setStatus(formStatus, "Post URL copied to clipboard.", "success");
      } catch {
        setStatus(formStatus, "Copy failed. URL eka manually copy karanna.", "error");
      }
      return;
    }

    const snap = await getDoc(doc(db, "posts", slug));
    if (!snap.exists()) return;
    const selected = { id: snap.id, ...snap.data() };

    if (action === "edit") {
      fillForm(selected);
      return;
    }

    if (action === "delete") {
      if (!confirm(`Delete \"${selected.title}\" ?`)) return;
      await deleteDoc(doc(db, "posts", slug));
      resetForm();
      setStatus(formStatus, "Post deleted from Firebase.", "success");
    }
  });

  exportBtn?.addEventListener("click", async () => {
    const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
    const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    const blob = new Blob([JSON.stringify(posts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "classic-creative-co-posts.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  importInput?.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error("Invalid import JSON");

      const batch = writeBatch(db);
      items.forEach((item) => {
        const slug = slugify(item.slug || item.title || `post-${Date.now()}`);
        batch.set(doc(db, "posts", slug), {
          slug,
          title: item.title || "Untitled Post",
          category: item.category || "General",
          price: Number(item.price || 0),
          description: item.description || "",
          image: item.image || PLACEHOLDER,
          imagePath: item.imagePath || "",
          orderLink: item.orderLink || "#",
          createdAt: Number(item.createdAt || Date.now()),
          updatedAt: Date.now(),
        });
      });
      await batch.commit();
      setStatus(formStatus, "Posts imported to Firebase successfully.", "success");
    } catch (error) {
      setStatus(formStatus, error.message || "Import failed.", "error");
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      hide(loginView);
      show(dashboardView);
      renderPosts();
    } else {
      show(loginView);
      hide(dashboardView);
      if (postsUnsubscribe) postsUnsubscribe();
    }
  });

  updatePreview();
});
