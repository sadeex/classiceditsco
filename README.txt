Classic Creative Co - Static HTML Website with Firebase

Files:
- index.html               -> Home page
- post.html                -> Single post detail page
- admin.html               -> Admin panel login + post editor
- assets/classic-co-logo.png -> Real logo + favicon image
- assets/styles.css        -> Styling
- assets/firebase-config.js -> Firebase app config
- assets/site-core.js      -> Shared site logic
- assets/common.js         -> Home + post page Firebase rendering
- assets/admin.js          -> Firebase admin dashboard logic
- GITHUB-HOSTING.txt       -> GitHub Pages guide
- FIREBASE-SETUP.txt       -> Firebase auth/firestore/storage setup

Important notes:
1. This is still a static HTML/CSS/JS website, but it now connects to Firebase.
2. Admin login uses Firebase Authentication.
3. Posts are stored in Cloud Firestore and therefore can appear on all devices.
4. Image upload can use direct URL or Firebase Storage upload.
5. Unique post URLs are generated as: post.html?slug=your-post-name
6. Ad units are already placed, but Arena preview can block external network requests.
7. Live Firebase functions work best on real hosting such as GitHub Pages.
