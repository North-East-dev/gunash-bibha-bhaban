
// admin/admin.js

// Auth State
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
const ADMIN_PASS = 'admin123'; // Simple protection as requested

// Current Content State
let currentContent = {};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginError = document.getElementById('loginError');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated) {
    showDashboard();
  } else {
    loginScreen.style.display = 'flex';
  }
});

function adminLogin() {
  const input = document.getElementById('passwordInput').value;
  if (input === ADMIN_PASS) {
    sessionStorage.setItem('adminAuth', 'true');
    isAuthenticated = true;
    showDashboard();
  } else {
    loginError.style.display = 'block';
  }
}

function logout() {
  sessionStorage.removeItem('adminAuth');
  location.reload();
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'block';
  loadContent();
}

// Navigation
function showSection(sectionId) {
  // Update sidebar
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
  
  // Update content area
  document.querySelectorAll('.section-editor').forEach(el => el.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
}

// Data Handling
async function loadContent() {
  try {
    // Try fetching from Firebase first (if configured)
    // const snapshot = await firebase.database().ref('content').once('value');
    // const data = snapshot.val();
    
    // Fallback to local JSON
    const response = await fetch('../content.json');
    const data = await response.json();
    
    currentContent = data;
    populateForms(data);
    
  } catch (error) {
    console.error('Error loading content:', error);
    alert('Error loading content. Check console.');
  }
}

function populateForms(data) {
  // Simple Text Inputs
  setVal('hero.title', data.hero.title);
  setVal('hero.subtitle', data.hero.subtitle);
  setVal('hero.trustText', data.hero.trustText);
  
  setVal('venue.title', data.venue.title);
  setVal('venue.description', data.venue.description);
  
  setVal('amenities.title', data.amenities.title);
  renderAmenitiesList(data.amenities.items);
  
  setVal('experiences.title', data.experiences.title);
  setVal('experiences.authorityLine', data.experiences.authorityLine);
  renderReviewsList(data.experiences.reviews);
  renderGalleryList(data.experiences.gallery);
  
  setVal('contact.phone', data.contact.phone);
  setVal('contact.whatsapp', data.contact.whatsapp);
  setVal('contact.address', data.contact.address);
  setVal('contact.mapLink', data.contact.mapLink);
  
  setVal('footer.tagline', data.footer.tagline);
  setVal('footer.copyright', data.footer.copyright);
}

// Helper to set values safely
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

// List Renderers
function renderAmenitiesList(items) {
  const container = document.getElementById('amenities-list');
  container.innerHTML = items.map((item, index) => `
    <div class="list-item">
      <div class="remove-btn" onclick="removeItem('amenities.items', ${index})">&times;</div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" value="${item.title}" onchange="updateItem('amenities.items', ${index}, 'title', this.value)">
      </div>
      <div class="form-group">
        <label>Tooltip</label>
        <input type="text" value="${item.tooltip}" onchange="updateItem('amenities.items', ${index}, 'tooltip', this.value)">
      </div>
      <div class="form-group">
        <label>SVG Icon Path (Advanced)</label>
        <input type="text" value="${item.icon}" onchange="updateItem('amenities.items', ${index}, 'icon', this.value)">
      </div>
    </div>
  `).join('');
  initSortable('amenities-list', 'amenities.items');
}

function renderReviewsList(items) {
  const container = document.getElementById('reviews-list');
  container.innerHTML = items.map((item, index) => `
    <div class="list-item">
      <div class="remove-btn" onclick="removeItem('experiences.reviews', ${index})">&times;</div>
      <div class="form-group">
        <label>Review Text</label>
        <textarea onchange="updateItem('experiences.reviews', ${index}, 'text', this.value)">${item.text}</textarea>
      </div>
      <div class="form-group">
        <label>Author (e.g. Wedding · 2024)</label>
        <input type="text" value="${item.author}" onchange="updateItem('experiences.reviews', ${index}, 'author', this.value)">
      </div>
    </div>
  `).join('');
  initSortable('reviews-list', 'experiences.reviews');
}

function renderGalleryList(items) {
  const container = document.getElementById('gallery-list');
  container.innerHTML = items.map((item, index) => `
    <div class="list-item">
      <div class="remove-btn" onclick="removeItem('experiences.gallery', ${index})">&times;</div>
      <div style="display:flex; gap:15px; align-items:center; margin-bottom:15px;">
        <img src="${item.src}" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">
        <div style="flex:1;">
          <div class="form-group" style="margin-bottom:10px;">
            <label>Image URL</label>
            <input type="text" value="${item.src}" onchange="updateItem('experiences.gallery', ${index}, 'src', this.value)">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label>Caption</label>
            <input type="text" value="${item.caption}" onchange="updateItem('experiences.gallery', ${index}, 'caption', this.value)">
          </div>
        </div>
      </div>
    </div>
  `).join('');
  initSortable('gallery-list', 'experiences.gallery');
}

// List Management
function updateItem(path, index, key, value) {
  const parts = path.split('.');
  currentContent[parts[0]][parts[1]][index][key] = value;
}

function removeItem(path, index) {
  if (!confirm('Are you sure you want to remove this item?')) return;
  const parts = path.split('.');
  currentContent[parts[0]][parts[1]].splice(index, 1);
  populateForms(currentContent); // Re-render
}

function addAmenity() {
  currentContent.amenities.items.push({ title: 'New Amenity', tooltip: '', icon: '' });
  populateForms(currentContent);
}

function addReview() {
  currentContent.experiences.reviews.push({ text: 'New review...', author: 'Event · Year' });
  populateForms(currentContent);
}

function addGalleryImage() {
  currentContent.experiences.gallery.push({ src: 'https://via.placeholder.com/1200x800', caption: 'New Image' });
  populateForms(currentContent);
}

// Helper to upload image (Convert to Base64)
function uploadImage(input, index) {
    const file = input.files[0];
    if (!file) return;
    
    // Size check (limit to ~500KB for Base64 performance)
    if (file.size > 500 * 1024) {
        alert('Image is too large for direct embedding (>500KB). Please use an external URL or compress it first.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        updateItem('experiences.gallery', index, 'src', base64);
        
        // Update UI
        // We need to re-render to show the new image preview
        // But re-rendering loses focus. So we just update the specific DOM elements if possible,
        // or just re-render. Re-render is safer.
        renderGalleryList(currentContent.experiences.gallery);
        
        logActivity('Image uploaded (Base64)');
    };
    reader.readAsDataURL(file);
}

// Saving
async function saveContent() {
  // Collect all non-list inputs
  currentContent.hero.title = document.getElementById('hero.title').value;
  currentContent.hero.subtitle = document.getElementById('hero.subtitle').value;
  currentContent.hero.trustText = document.getElementById('hero.trustText').value;
  
  currentContent.venue.title = document.getElementById('venue.title').value;
  currentContent.venue.description = document.getElementById('venue.description').value;
  
  currentContent.amenities.title = document.getElementById('amenities.title').value;
  
  currentContent.experiences.title = document.getElementById('experiences.title').value;
  currentContent.experiences.authorityLine = document.getElementById('experiences.authorityLine').value;
  
  currentContent.contact.phone = document.getElementById('contact.phone').value;
  currentContent.contact.whatsapp = document.getElementById('contact.whatsapp').value;
  currentContent.contact.address = document.getElementById('contact.address').value;
  currentContent.contact.mapLink = document.getElementById('contact.mapLink').value;
  
  currentContent.footer.tagline = document.getElementById('footer.tagline').value;
  currentContent.footer.copyright = document.getElementById('footer.copyright').value;

  try {
    // Firebase Save
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      await firebase.database().ref('content').set(currentContent);
      logActivity('Content saved to Firebase');
    } else {
      console.warn('Firebase not initialized. Local save only.');
    }
    
    console.log('Saved Content:', currentContent);
    alert('Changes saved successfully!');
    logActivity('Content saved locally');
    
  } catch (error) {
    console.error('Save Error:', error);
    alert('Failed to save changes: ' + error.message);
    logActivity('Error saving content: ' + error.message);
  }
}

// --- Tools & Settings ---

function logActivity(msg) {
  const log = JSON.parse(localStorage.getItem('adminActivityLog') || '[]');
  const entry = { time: new Date().toLocaleString(), msg };
  log.unshift(entry);
  if (log.length > 50) log.pop(); // Keep last 50
  localStorage.setItem('adminActivityLog', JSON.stringify(log));
  renderActivityLog();
}

function renderActivityLog() {
  const log = JSON.parse(localStorage.getItem('adminActivityLog') || '[]');
  const container = document.getElementById('activity-log');
  if (!container) return;
  
  if (log.length === 0) {
    container.innerHTML = '<li style="padding:8px 0; border-bottom:1px solid #eee;">No recent activity.</li>';
    return;
  }
  
  container.innerHTML = log.map(entry => `
    <li style="padding:8px 0; border-bottom:1px solid #eee;">
      <span style="color:#888; font-size:12px;">${entry.time}</span><br>
      ${entry.msg}
    </li>
  `).join('');
}

function downloadBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentContent, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "website-content-backup-" + new Date().toISOString().slice(0,10) + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  logActivity('Backup downloaded');
}

function restoreBackup(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      // Basic validation
      if (!data.hero || !data.venue) throw new Error('Invalid content format');
      
      currentContent = data;
      populateForms(data);
      alert('Backup restored successfully! Review and click Save Changes.');
      logActivity('Backup restored');
    } catch (err) {
      alert('Error parsing backup file: ' + err.message);
    }
  };
  reader.readAsText(file);
  input.value = ''; // Reset
}
