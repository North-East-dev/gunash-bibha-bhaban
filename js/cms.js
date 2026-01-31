
// js/cms.js - Simple JSON-based CMS

const contentUrl = 'content.json';

// Fetch content and update DOM
async function fetchContent() {
  try {
    let data;

    // Try fetching from Firebase first (if configured)
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      try {
        const snapshot = await firebase.database().ref('content').once('value');
        const firebaseData = snapshot.val();
        if (firebaseData) {
          data = firebaseData;
          console.log('Content loaded from Firebase');
        }
      } catch (err) {
        console.warn('Firebase load failed, falling back to JSON:', err);
      }
    }

    // Fallback to local JSON if no Firebase data
    if (!data) {
      const response = await fetch(contentUrl);
      if (!response.ok) throw new Error('Failed to load content');
      data = await response.json();
      console.log('Content loaded from JSON');
    }

    updateDOM(data);
    
    // Store content globally for other scripts if needed
    window.cmsContent = data;
    
    // Dispatch event so other scripts know content is loaded
    window.dispatchEvent(new CustomEvent('cms-loaded', { detail: data }));
    
  } catch (error) {
    console.error('CMS Error:', error);
  }
}

// Update DOM elements with data-cms attributes
function updateDOM(data, prefix = '') {
  for (const key in data) {
    const value = data[key];
    const currentKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursive call for nested objects
      updateDOM(value, currentKey);
    } else {
      // Find elements with matching data-cms attribute
      const elements = document.querySelectorAll(`[data-cms="${currentKey}"]`);
      
      elements.forEach(element => {
        if (Array.isArray(value)) {
           // Handle arrays (lists, galleries) - customized logic based on parent
           renderList(element, value, currentKey);
        } else {
           // Handle text/html content
           if (element.tagName === 'IMG') {
             element.src = value;
           } else if (element.tagName === 'A' && key === 'phone') {
             element.href = `tel:${value.replace(/\s/g, '')}`;
             element.textContent = value;
           } else if (element.tagName === 'A' && key === 'whatsapp') {
             // Keep href static or update if needed
             element.textContent = value;
           } else {
             element.innerHTML = value;
           }
        }
      });
    }
  }
}

// Helper to render lists (Reviews, Amenities, Gallery)
function renderList(container, items, key) {
  if (key === 'amenities.items') {
     renderAmenities(container, items);
  } else if (key === 'experiences.reviews') {
     renderReviews(container, items);
  } else if (key === 'experiences.gallery') {
     renderGallery(container, items);
  }
}

function renderAmenities(container, items) {
  // Clear existing static content if any (or we could just replace)
  container.innerHTML = items.map((item, index) => `
    <div class="box fade-up stagger-${(index % 4) + 1}" title="${item.tooltip}">
      <div class="icon">
        <svg viewBox="0 0 24 24">
          ${item.icon.split('|').map(path => 
            path.startsWith('circle') || path.startsWith('rect') || path.startsWith('line') || path.startsWith('polygon') 
            ? `<${path} stroke-linecap="round" stroke-linejoin="round"/>`
            : `<path d="${path}" stroke-linecap="round" stroke-linejoin="round"/>`
          ).join('')}
        </svg>
      </div>
      ${item.title}
    </div>
  `).join('');
}

function renderReviews(container, items) {
  container.innerHTML = items.map((item, index) => `
    <div class="review-card ${index === 0 ? 'large' : ''} ${index === 2 ? 'tall' : ''} fade-up stagger-${(index % 4) + 1}">
      <div style="color:var(--secondary); margin-bottom:10px;">★ ★ ★ ★ ★</div>
      “${item.text}”
      <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
         <strong>${item.author}</strong><span class="verified-badge">Verified Guest</span>
      </div>
    </div>
  `).join('');
}

function renderGallery(container, items) {
  // Preserve the container structure, just update slides
  container.innerHTML = items.map(item => `
    <div class="mySlides slide-fade">
      <img src="${item.src}" alt="${item.caption}" loading="lazy">
      <div class="slide-caption">${item.caption}</div>
    </div>
  `).join('') + `
    <div class="dot-container">
      ${items.map((_, i) => `<span class="dot" onclick="currentSlide(${i+1})"></span>`).join('')}
    </div>
  `;
  
  // Re-initialize slideshow if needed (assuming showSlides is global)
  if (typeof showSlides === 'function') {
    slideIndex = 1;
    showSlides(slideIndex);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchContent);
