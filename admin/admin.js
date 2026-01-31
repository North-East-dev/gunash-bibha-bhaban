// admin/admin.js

// Auth State
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
const ADMIN_PASS = 'admin123'; // Simple protection as requested

// Current Content State
let currentContent = {};
let originalContent = {}; // For safety comparisons

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

// Status Indicator
function updateStatus(state, msg = '') {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const container = document.getElementById('connectionStatus');
  
  if (!dot || !text) return;

  if (state === 'connecting') {
    dot.style.background = '#ffeb3b'; // Yellow
    text.textContent = 'Connecting...';
    container.title = 'Attempting to load data...';
  } else if (state === 'success') {
    dot.style.background = '#4caf50'; // Green
    text.textContent = 'Connected';
    container.title = 'Data loaded successfully';
  } else if (state === 'error') {
    dot.style.background = '#f44336'; // Red
    text.textContent = 'Connection Failed';
    container.title = msg || 'Error loading data';
  } else if (state === 'partial') {
    dot.style.background = '#ff9800'; // Orange
    text.textContent = 'Partial Load';
    container.title = msg || 'Some sections failed to load';
  }
}

// Data Handling
async function loadContent() {
  updateStatus('connecting');
  try {
    // Try fetching from Firebase first (if configured)
    let data;
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      try {
        const snapshot = await firebase.database().ref('content').once('value');
        const fbData = snapshot.val();
        if (fbData) {
            data = fbData;
            console.log('Loaded from Firebase');
        }
      } catch (e) {
        console.warn('Firebase load failed, trying local JSON', e);
      }
    }
    
    // Fallback to local JSON
    if (!data) {
        const response = await fetch('../content.json');
        data = await response.json();
        console.log('Loaded from local JSON');
    }
    
    currentContent = data;
    originalContent = JSON.parse(JSON.stringify(data)); // Deep copy for safety reference
    
    // Validate Structure
    if (!currentContent.hero) currentContent.hero = {};
    if (!currentContent.venue) currentContent.venue = {};
    if (!currentContent.amenities) currentContent.amenities = { items: [] };
    if (!currentContent.experiences) currentContent.experiences = { reviews: [], gallery: [] };
    if (!currentContent.contact) currentContent.contact = {};
    if (!currentContent.footer) currentContent.footer = {};
    // Ensure slideshows array exists
    if (!currentContent.hero.slideshow) currentContent.hero.slideshow = [];
    // Ensure bookings exist
    if (!currentContent.bookings) currentContent.bookings = { bookedDates: [] };
    if (!Array.isArray(currentContent.bookings.bookedDates)) currentContent.bookings.bookedDates = [];

    // Ensure all items have IDs (migration for legacy data)
    ensureIds(currentContent.amenities.items);
    ensureIds(currentContent.experiences.reviews);
    ensureIds(currentContent.experiences.gallery);
    ensureIds(currentContent.hero.slideshow);

    populateForms(currentContent);
    
  } catch (error) {
    console.error('Error loading content:', error);
    updateStatus('error', error.message);
    alert('Error loading content. Check console for details.');
  }
}

function ensureIds(array) {
  if (!Array.isArray(array)) return;
  array.forEach(item => {
    if (!item.id) item.id = 'gen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  });
}

function populateForms(data) {
  let errors = [];

  // Robust Section Loading
  try {
    setVal('hero.title', data.hero.title);
    setVal('hero.subtitle', data.hero.subtitle);
    setVal('hero.trustText', data.hero.trustText);
  } catch (e) { errors.push('Hero: ' + e.message); console.error(e); }

  try {
    setVal('venue.title', data.venue.title);
    setVal('venue.description', data.venue.description);
  } catch (e) { errors.push('Venue: ' + e.message); console.error(e); }

  try {
    setVal('amenities.title', data.amenities.title);
    renderAmenitiesList(data.amenities.items || []);
  } catch (e) { errors.push('Amenities: ' + e.message); console.error(e); }

  try {
    setVal('experiences.title', data.experiences.title);
    setVal('experiences.authorityLine', data.experiences.authorityLine);
    renderReviewsList(data.experiences.reviews || []);
    renderGalleryList(data.experiences.gallery || []);
  } catch (e) { errors.push('Experiences: ' + e.message); console.error(e); }
  
  try {
      renderSlideshowList(data.hero.slideshow || [], 'hero.slideshow', 'hero-slideshow-list');
  } catch (e) { errors.push('Slideshows: ' + e.message); console.error(e); }

  try {
      renderBookingList(data.bookings.bookedDates || []);
  } catch (e) { errors.push('Bookings: ' + e.message); console.error(e); }

  try {
    setVal('contact.phone', data.contact.phone);
    setVal('contact.whatsapp', data.contact.whatsapp);
    setVal('contact.address', data.contact.address);
    setVal('contact.mapLink', data.contact.mapLink);
  } catch (e) { errors.push('Contact: ' + e.message); console.error(e); }

  try {
    setVal('footer.tagline', data.footer.tagline);
    setVal('footer.copyright', data.footer.copyright);
  } catch (e) { errors.push('Footer: ' + e.message); console.error(e); }

  if (errors.length > 0) {
    updateStatus('partial', 'Errors in: ' + errors.join(', '));
    console.warn('Partial load errors:', errors);
  } else {
    updateStatus('success');
  }
}

// Helper to set values safely
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

// List Renderers
function renderBookingList(items) {
  const container = document.getElementById('booking-list');
  if (!container) return;

  // Sort by date (newest first)
  const sortedItems = [...items].sort((a, b) => new Date(b.start) - new Date(a.start));

  container.innerHTML = sortedItems.map((item, index) => {
    const isRange = item.end && item.end !== item.start;
    const dateDisplay = isRange ? `${item.start} ➝ ${item.end}` : item.start;
    const statusColor = item.status === 'blocked' ? '#9e9e9e' : (item.status === 'tentative' ? '#ffc107' : '#f44336');
    const statusLabel = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Booked';

    return `
    <div class="list-item" style="border-left: 4px solid ${statusColor};">
      <div class="remove-btn" onclick="deleteBooking(${item.id})">&times;</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:bold; font-size:16px;">${dateDisplay}</div>
          <div style="color:#666; font-size:13px;">${item.note || 'No note'}</div>
        </div>
        <div style="text-align:right;">
          <span style="background:${statusColor}20; color:${statusColor}; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600;">
            ${statusLabel}
          </span>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function addBooking() {
  const startInput = document.getElementById('booking-start');
  const endInput = document.getElementById('booking-end');
  const statusInput = document.getElementById('booking-status');
  const noteInput = document.getElementById('booking-note');

  if (!startInput.value) {
    alert('Please select a start date');
    return;
  }

  const newBooking = {
    id: Date.now(),
    start: startInput.value,
    end: endInput.value || startInput.value,
    status: statusInput.value || 'booked',
    note: noteInput.value || ''
  };

  // Validate end date is after start date
  if (new Date(newBooking.end) < new Date(newBooking.start)) {
    alert('End date cannot be before start date');
    return;
  }

  if (!currentContent.bookings.bookedDates) currentContent.bookings.bookedDates = [];
  currentContent.bookings.bookedDates.push(newBooking);
  
  // Clear inputs
  startInput.value = '';
  endInput.value = '';
  noteInput.value = '';
  
  populateForms(currentContent);
  alert('Booking added! Don\'t forget to click "Save Changes".');
}

function deleteBooking(id) {
  if (!confirm('Are you sure you want to remove this booking?')) return;
  
  currentContent.bookings.bookedDates = currentContent.bookings.bookedDates.filter(b => b.id !== id);
  populateForms(currentContent);
}

function renderAmenitiesList(items) {
  const container = document.getElementById('amenities-list');
  if (!container) return;
  
  container.innerHTML = items.map((item, index) => `
    <div class="list-item" data-id="${item.id}">
      <div class="remove-btn" onclick="removeItem('amenities.items', '${item.id}')">&times;</div>
      <div style="cursor:move; float:right; margin-right:30px; color:#ccc;">☰</div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" value="${item.title}" onchange="updateItem('amenities.items', '${item.id}', 'title', this.value)">
      </div>
      <div class="form-group">
        <label>Tooltip</label>
        <input type="text" value="${item.tooltip}" onchange="updateItem('amenities.items', '${item.id}', 'tooltip', this.value)">
      </div>
      <div class="form-group">
        <label>SVG Icon Path (Advanced)</label>
        <input type="text" value="${item.icon}" onchange="updateItem('amenities.items', '${item.id}', 'icon', this.value)">
      </div>
    </div>
  `).join('');
  initSortable('amenities-list', 'amenities.items');
}

function renderReviewsList(items) {
  const container = document.getElementById('reviews-list');
  if (!container) return;

  container.innerHTML = items.map((item, index) => `
    <div class="list-item" data-id="${item.id}">
      <div class="remove-btn" onclick="removeItem('experiences.reviews', '${item.id}')">&times;</div>
      <div style="cursor:move; float:right; margin-right:30px; color:#ccc;">☰</div>
      <div class="form-group">
        <label>Review Text</label>
        <textarea onchange="updateItem('experiences.reviews', '${item.id}', 'text', this.value)">${item.text}</textarea>
      </div>
      <div class="form-group">
        <label>Author (e.g. Wedding · 2024)</label>
        <input type="text" value="${item.author}" onchange="updateItem('experiences.reviews', '${item.id}', 'author', this.value)">
      </div>
    </div>
  `).join('');
  initSortable('reviews-list', 'experiences.reviews');
}

function renderGalleryList(items) {
  const container = document.getElementById('gallery-list');
  if (!container) return;

  container.innerHTML = items.map((item, index) => `
    <div class="list-item" data-id="${item.id}">
      <div class="remove-btn" onclick="removeItem('experiences.gallery', '${item.id}')">&times;</div>
      <div style="cursor:move; float:right; margin-right:30px; color:#ccc;">☰</div>
      <div style="display:flex; gap:15px; align-items:center; margin-bottom:15px;">
        <img src="${item.src}" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">
        <div style="flex:1;">
          <div class="form-group" style="margin-bottom:10px;">
            <label>Image URL or Base64</label>
            <input type="text" value="${item.src}" onchange="updateItem('experiences.gallery', '${item.id}', 'src', this.value)">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label>Caption</label>
            <input type="text" value="${item.caption}" onchange="updateItem('experiences.gallery', '${item.id}', 'caption', this.value)">
          </div>
        </div>
      </div>
      <input type="file" accept="image/*" onchange="uploadImage(this, '${item.id}', 'experiences.gallery')">
    </div>
  `).join('');
  initSortable('gallery-list', 'experiences.gallery');
}

function renderSlideshowList(items, path, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
  
    container.innerHTML = items.map((item, index) => `
      <div class="list-item" data-id="${item.id}">
        <div class="remove-btn" onclick="removeItem('${path}', '${item.id}')">&times;</div>
        <div style="cursor:move; float:right; margin-right:30px; color:#ccc;">☰</div>
        <div style="display:flex; gap:15px; align-items:center; margin-bottom:15px;">
          <img src="${item.src}" style="width:100px; height:60px; object-fit:cover; border-radius:4px;">
          <div style="flex:1;">
            <div class="form-group" style="margin-bottom:10px;">
              <label>Image Source</label>
              <input type="text" value="${item.src}" onchange="updateItem('${path}', '${item.id}', 'src', this.value)">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label>Caption / Alt Text</label>
              <input type="text" value="${item.caption || ''}" onchange="updateItem('${path}', '${item.id}', 'caption', this.value)">
            </div>
          </div>
        </div>
        <input type="file" accept="image/*" onchange="uploadImage(this, '${item.id}', '${path}')">
      </div>
    `).join('');
    initSortable(containerId, path);
  }

// SortableJS Wrapper
function initSortable(elementId, path) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (typeof Sortable === 'undefined') {
        console.warn('SortableJS not loaded');
        return;
    }

    new Sortable(el, {
        animation: 150,
        handle: '.list-item', // Drag by the whole item or a specific handle
        onEnd: function (evt) {
            // Reorder array in currentContent
            const parts = path.split('.');
            let array;
            if (parts.length === 2) array = currentContent[parts[0]][parts[1]];
            
            if (array) {
                const item = array.splice(evt.oldIndex, 1)[0];
                array.splice(evt.newIndex, 0, item);
                console.log(`Reordered ${path}: moved ${evt.oldIndex} to ${evt.newIndex}`);
            }
        }
    });
}

// List Management (ID-based)
function updateItem(path, id, key, value) {
  const parts = path.split('.');
  if (parts.length === 2) {
    const array = currentContent[parts[0]][parts[1]];
    const item = array.find(i => i.id == id);
    if (item) {
        item[key] = value;
    }
  }
}

function removeItem(path, id) {
  if (!confirm('Are you sure you want to remove this item?')) return;
  const parts = path.split('.');
  if (parts.length === 2) {
      const array = currentContent[parts[0]][parts[1]];
      const index = array.findIndex(i => i.id == id);
      if (index > -1) {
          array.splice(index, 1);
          populateForms(currentContent); // Re-render
      }
  }
}

function addAmenity() {
  if (!currentContent.amenities.items) currentContent.amenities.items = [];
  currentContent.amenities.items.push({ id: Date.now(), title: 'New Amenity', tooltip: '', icon: '' });
  populateForms(currentContent);
}

function addReview() {
  if (!currentContent.experiences.reviews) currentContent.experiences.reviews = [];
  currentContent.experiences.reviews.push({ id: Date.now(), text: 'New review...', author: 'Event · Year' });
  populateForms(currentContent);
}

function addGalleryImage() {
  if (!currentContent.experiences.gallery) currentContent.experiences.gallery = [];
  currentContent.experiences.gallery.push({ id: Date.now(), src: 'https://via.placeholder.com/1200x800', caption: 'New Image' });
  populateForms(currentContent);
}

function addSlide(path) {
    const parts = path.split('.');
    if (!currentContent[parts[0]][parts[1]]) currentContent[parts[0]][parts[1]] = [];
    currentContent[parts[0]][parts[1]].push({ id: Date.now(), src: 'https://via.placeholder.com/1920x1080', caption: '' });
    populateForms(currentContent);
}

// Helper to upload image (Convert to Base64)
function uploadImage(input, id, path) {
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
        updateItem(path, id, 'src', base64);
        populateForms(currentContent); // Re-render to show preview
        logActivity('Image uploaded (Base64) to ' + path);
    };
    reader.readAsDataURL(file);
}

// Saving
async function saveContent() {
  // Standard inputs:
  if (document.getElementById('hero.title')) currentContent.hero.title = document.getElementById('hero.title').value;
  if (document.getElementById('hero.subtitle')) currentContent.hero.subtitle = document.getElementById('hero.subtitle').value;
  if (document.getElementById('hero.trustText')) currentContent.hero.trustText = document.getElementById('hero.trustText').value;
  
  if (document.getElementById('venue.title')) currentContent.venue.title = document.getElementById('venue.title').value;
  if (document.getElementById('venue.description')) currentContent.venue.description = document.getElementById('venue.description').value;
  
  if (document.getElementById('amenities.title')) currentContent.amenities.title = document.getElementById('amenities.title').value;
  
  if (document.getElementById('experiences.title')) currentContent.experiences.title = document.getElementById('experiences.title').value;
  if (document.getElementById('experiences.authorityLine')) currentContent.experiences.authorityLine = document.getElementById('experiences.authorityLine').value;
  
  if (document.getElementById('contact.phone')) currentContent.contact.phone = document.getElementById('contact.phone').value;
  if (document.getElementById('contact.whatsapp')) currentContent.contact.whatsapp = document.getElementById('contact.whatsapp').value;
  if (document.getElementById('contact.address')) currentContent.contact.address = document.getElementById('contact.address').value;
  if (document.getElementById('contact.mapLink')) currentContent.contact.mapLink = document.getElementById('contact.mapLink').value;
  
  if (document.getElementById('footer.tagline')) currentContent.footer.tagline = document.getElementById('footer.tagline').value;
  if (document.getElementById('footer.copyright')) currentContent.footer.copyright = document.getElementById('footer.copyright').value;

  // --- SAFETY GUARDS ---
  if (!validateSafety(currentContent)) return;

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

// Helper to validate critical data before saving
function validateSafety(data) {
  let warnings = [];

  // Check for empty lists
  if (!data.amenities.items || data.amenities.items.length === 0) {
    warnings.push("Amenities list is empty.");
  }
  if (!data.experiences.reviews || data.experiences.reviews.length === 0) {
    warnings.push("Reviews list is empty.");
  }
  if (!data.experiences.gallery || data.experiences.gallery.length === 0) {
    warnings.push("Gallery is empty.");
  }
  
  // Check for drastic reduction (more than 50% removed)
  if (originalContent.amenities && originalContent.amenities.items && data.amenities.items) {
    if (originalContent.amenities.items.length > 4 && data.amenities.items.length < originalContent.amenities.items.length / 2) {
      warnings.push(`Amenities list reduced drastically (from ${originalContent.amenities.items.length} to ${data.amenities.items.length}).`);
    }
  }

  if (warnings.length > 0) {
    const msg = "⚠️ SAFETY WARNING ⚠️\n\n" + warnings.join("\n") + "\n\nAre you sure you want to save? This will remove these sections from the live site.";
    return confirm(msg);
  }
  
  return true;
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

function discardChanges() {
  if (!confirm('Are you sure you want to discard all unsaved changes? This will revert to the last saved version.')) return;
  currentContent = JSON.parse(JSON.stringify(originalContent));
  populateForms(currentContent);
  alert('Unsaved changes discarded.');
  logActivity('Changes discarded');
}
