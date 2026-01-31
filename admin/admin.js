// ADMIN PANEL LOGIC

// --- CONFIGURATION ---
let firebaseApp = null;
let db = null;

// --- STATE ---
let currentContent = {}; // Holds the full JSON object

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  initFirebase();
  loadContent();
  
  document.getElementById('login-form').addEventListener('submit', handleLogin);
});

// --- LOGIN / AUTH ---
function checkLogin() {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
  } else {
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('password').value;
  // Simple hardcoded password for the requested "Session-based access"
  if (password === 'admin123') {
    sessionStorage.setItem('isLoggedIn', 'true');
    checkLogin();
  } else {
    document.getElementById('login-error').textContent = 'Invalid password';
  }
}

function logout() {
  sessionStorage.removeItem('isLoggedIn');
  window.location.reload();
}

// --- FIREBASE SETUP ---
function initFirebase() {
  if (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG) {
    try {
      if (firebase && firebase.apps.length === 0) {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.database();
        document.getElementById('connection-status').textContent = 'Online (Firebase)';
        document.getElementById('connection-status').style.color = 'green';
      }
    } catch (e) {
      console.error('Firebase init error', e);
    }
  }
}

// --- DATA LOADING ---
async function loadContent() {
  try {
    // 1. Try fetching from Firebase first if connected
    if (db) {
      const snapshot = await db.ref('content').once('value');
      const val = snapshot.val();
      if (val) {
        currentContent = val;
        renderEditors();
        return;
      }
    }

    // 2. Fallback to local content.json
    const response = await fetch('../content.json');
    if (!response.ok) throw new Error('Failed to load local JSON');
    currentContent = await response.json();
    renderEditors();

  } catch (error) {
    console.error('Error loading content:', error);
    alert('Could not load content. Check console.');
  }
}

// --- UI RENDERING ---
function renderEditors() {
  const container = document.getElementById('editors-container');
  container.innerHTML = '';

  // Render sections
  renderHeroEditor(container);
  renderExperiencesEditor(container);
  renderAmenitiesEditor(container);
  renderReviewsEditor(container);
  renderContactEditor(container);
  renderFooterEditor(container);
  renderSetupEditor(container); // Special setup tab

  // Show the first section by default
  showSection('hero');
}

function showSection(sectionId) {
  // Update sidebar
  document.querySelectorAll('aside li').forEach(li => li.classList.remove('active'));
  const activeLi = Array.from(document.querySelectorAll('aside li')).find(li => li.textContent.toLowerCase().includes(sectionId) || (sectionId === 'firebase-setup' && li.textContent.includes('Setup')));
  if (activeLi) activeLi.classList.add('active');

  // Update main area
  document.querySelectorAll('.section-editor').forEach(el => el.classList.remove('active'));
  const activeEditor = document.getElementById(`editor-${sectionId}`);
  if (activeEditor) activeEditor.classList.add('active');
}

// --- EDITOR GENERATORS ---

function createSection(id, title) {
  const div = document.createElement('div');
  div.id = `editor-${id}`;
  div.className = 'section-editor';
  div.innerHTML = `<h2>${title}</h2>`;
  return div;
}

function createInput(label, key, value, type = 'text', help = '') {
  return `
    <div class="form-group">
      <label>${label}</label>
      <input type="${type}" value="${escapeHtml(value || '')}" onchange="updateField('${key}', this.value)">
      ${help ? `<div class="help-text">${help}</div>` : ''}
    </div>
  `;
}

function createTextarea(label, key, value) {
  return `
    <div class="form-group">
      <label>${label}</label>
      <textarea onchange="updateField('${key}', this.value)">${escapeHtml(value || '')}</textarea>
    </div>
  `;
}

// 1. HERO
function renderHeroEditor(container) {
  const div = createSection('hero', 'Hero Section');
  const data = currentContent.hero || {};
  
  div.innerHTML += createInput('Main Title', 'hero.title', data.title);
  div.innerHTML += createInput('Subtitle', 'hero.subtitle', data.subtitle);
  div.innerHTML += createInput('Trust Text', 'hero.trustText', data.trustText);
  div.innerHTML += createInput('Background Image URL', 'hero.backgroundImage', data.backgroundImage, 'text', 'Paste a link to your image');
  
  container.appendChild(div);
}

// 2. EXPERIENCES
function renderExperiencesEditor(container) {
  const div = createSection('experiences', 'Experiences Section');
  const data = currentContent.experiences || {};
  div.innerHTML += createInput('Authority Line', 'experiences.authorityLine', data.authorityLine, 'text', 'e.g. "150+ Weddings Hosted"');
  container.appendChild(div);
}

// 3. AMENITIES (Array)
function renderAmenitiesEditor(container) {
  const div = createSection('amenities', 'Amenities');
  const list = currentContent.amenities || [];
  
  let html = '<div id="amenities-list">';
  list.forEach((item, index) => {
    html += `
      <div class="array-item">
        <div class="form-group">
          <label>Title</label>
          <input type="text" value="${escapeHtml(item.text)}" onchange="updateArrayItem('amenities', ${index}, 'text', this.value)">
        </div>
        <div class="form-group">
          <label>Tooltip (Hover Text)</label>
          <input type="text" value="${escapeHtml(item.tooltip)}" onchange="updateArrayItem('amenities', ${index}, 'tooltip', this.value)">
        </div>
        <div class="form-group">
          <label>SVG Icon Code</label>
          <textarea style="height:60px; font-family:monospace; font-size:12px;" onchange="updateArrayItem('amenities', ${index}, 'icon', this.value)">${escapeHtml(item.icon)}</textarea>
        </div>
      </div>
    `;
  });
  html += '</div>';
  html += '<p style="color:#666; font-size:0.9rem;">To add/remove amenities, advanced mode is needed. For now, edit existing ones.</p>';
  
  div.innerHTML += html;
  container.appendChild(div);
}

// 4. REVIEWS (Array)
function renderReviewsEditor(container) {
  const div = createSection('reviews', 'Reviews');
  const list = currentContent.reviews || [];
  
  let html = '<div id="reviews-list">';
  list.forEach((item, index) => {
    html += `
      <div class="array-item">
        <div class="form-group">
          <label>Review Text</label>
          <textarea onchange="updateArrayItem('reviews', ${index}, 'text', this.value)">${escapeHtml(item.text)}</textarea>
        </div>
        <div class="form-group">
          <label>Author</label>
          <input type="text" value="${escapeHtml(item.author)}" onchange="updateArrayItem('reviews', ${index}, 'author', this.value)">
        </div>
        <div class="form-group">
          <label>Stars (1-5)</label>
          <input type="number" min="1" max="5" value="${item.stars}" onchange="updateArrayItem('reviews', ${index}, 'stars', parseInt(this.value))">
        </div>
      </div>
    `;
  });
  html += '</div>';
  
  div.innerHTML += html;
  container.appendChild(div);
}

// 5. CONTACT
function renderContactEditor(container) {
  const div = createSection('contact', 'Contact Info');
  const data = currentContent.contact || {};
  
  div.innerHTML += createInput('Phone Number', 'contact.phone', data.phone);
  div.innerHTML += createInput('WhatsApp Link', 'contact.whatsappLink', data.whatsappLink);
  div.innerHTML += createInput('Address Line 1', 'contact.addressLine1', data.addressLine1);
  div.innerHTML += createInput('Address Line 2', 'contact.addressLine2', data.addressLine2);
  div.innerHTML += createInput('Google Maps Link', 'contact.mapLink', data.mapLink);
  
  container.appendChild(div);
}

// 6. FOOTER
function renderFooterEditor(container) {
  const div = createSection('footer', 'Footer');
  const data = currentContent.footer || {};
  div.innerHTML += createInput('Tagline', 'footer.tagline', data.tagline);
  div.innerHTML += createInput('Copyright Text', 'footer.copyright', data.copyright);
  container.appendChild(div);
}

// 7. SETUP (Firebase Config)
function renderSetupEditor(container) {
  const div = createSection('firebase-setup', 'Setup & Connection');
  
  div.innerHTML += `
    <p>To enable <strong>Instant Updates</strong>, you need to connect a free Firebase database.</p>
    <ol style="font-size:0.9rem; line-height:1.6; margin-bottom:20px;">
      <li>Go to <a href="https://console.firebase.google.com/" target="_blank">Firebase Console</a>.</li>
      <li>Create a new project.</li>
      <li>Go to "Realtime Database" and create a database (start in <strong>Test Mode</strong>).</li>
      <li>Go to Project Settings > General > "Your apps" > Web App.</li>
      <li>Copy the \`firebaseConfig\` object code.</li>
      <li><strong>Open the file \`js/firebase-config.js\` in your project folder.</strong></li>
      <li>Paste the config object into the \`FIREBASE_CONFIG\` variable.</li>
      <li>Save the file and reload this page.</li>
    </ol>
    
    <div style="background:#f0f0f0; padding:15px; border-radius:4px;">
      <strong>Current Status:</strong> 
      ${db ? '<span style="color:green">Connected ✅</span>' : '<span style="color:orange">Not Configured (Using content.json)</span>'}
    </div>
  `;
  
  container.appendChild(div);
}

// --- DATA HANDLING HELPERS ---

function updateField(path, value) {
  const keys = path.split('.');
  let obj = currentContent;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
}

function updateArrayItem(arrayName, index, field, value) {
  if (currentContent[arrayName] && currentContent[arrayName][index]) {
    currentContent[arrayName][index][field] = value;
  }
}

async function saveChanges() {
  const btn = document.querySelector('.save-bar .btn');
  const originalText = btn.textContent;
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    if (db) {
      // Option A: Save to Firebase
      await db.ref('content').set(currentContent);
      showToast('Changes published live!', 'success');
    } else {
      // Option B: Download JSON (Fallback)
      downloadJSON(currentContent, 'content.json');
      showToast('Downloaded content.json. Please upload to GitHub.', 'success');
      alert('Since Firebase is not connected, you must manually replace "content.json" in your website folder with this downloaded file.');
    }
  } catch (error) {
    console.error(error);
    showToast('Error saving changes', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = type;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
