// Gunash Padmawati Bibha Bhaban - Simple CMS
// Reads content.json OR Firebase Realtime Database and updates the DOM

document.addEventListener('DOMContentLoaded', () => {
  loadContent();
});

async function loadContent() {
  try {
    let data = null;

    // 1. Try Firebase if Configured (Instant Updates Mode)
    if (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG) {
      console.log('CMS: Connecting to Firebase...');
      if (firebase.apps.length === 0) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      const db = firebase.database();
      const snapshot = await db.ref('content').once('value');
      data = snapshot.val();
      
      if (data) {
        console.log('CMS: Loaded content from Firebase');
      }
    }

    // 2. Fallback to local content.json (Static Mode)
    if (!data) {
      console.log('CMS: Loading local content.json...');
      const response = await fetch('content.json');
      if (!response.ok) throw new Error('Failed to load content');
      data = await response.json();
    }

    // 3. Apply content to the page
    if (data) {
      applyContent(data);
    }

  } catch (error) {
    console.warn('CMS: Could not load dynamic content. Using default HTML.', error);
  }
}

function applyContent(data) {
  // Helper to safely set text content
  const setText = (id, value) => {
    const el = document.querySelector(`[data-cms="${id}"]`);
    if (el && value) el.textContent = value;
  };

  // Helper to safely set HTML content (for icons/formatting)
  const setHTML = (id, value) => {
    const el = document.querySelector(`[data-cms="${id}"]`);
    if (el && value) el.innerHTML = value;
  };

  // Helper to safely set attributes (src, href)
  const setAttr = (id, attr, value) => {
    const el = document.querySelector(`[data-cms="${id}"]`);
    if (el && value) el.setAttribute(attr, value);
  };

  // --- HERO SECTION ---
  if (data.hero) {
    setText('hero.title', data.hero.title);
    setText('hero.subtitle', data.hero.subtitle);
    if (data.hero.backgroundImage) {
      const heroBg = document.querySelector('.hero-bg');
      if (heroBg) {
        // Keep the gradient overlay, just update the image url
        heroBg.style.backgroundImage = `
          radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%),
          linear-gradient(rgba(45, 20, 63, 0.4), rgba(20, 10, 30, 0.8)),
          url("${data.hero.backgroundImage}")
        `;
      }
    }
    setText('hero.trustText', data.hero.trustText);
  }

  // --- EXPERIENCES ---
  if (data.experiences) {
    setText('experiences.authorityLine', data.experiences.authorityLine);
  }

  // --- AMENITIES ---
  // If data exists, we assume the structure matches.
  // We can't easily map by index without wiping the container unless we had IDs.
  // For robustness, let's target the containers if we want to support adding/removing.
  // But strictly following "No Redesign" constraints, let's just update existing boxes if possible.
  if (data.amenities && Array.isArray(data.amenities)) {
    const amenityBoxes = document.querySelectorAll('.features .box');
    data.amenities.forEach((item, index) => {
      if (amenityBoxes[index]) {
        // Update Icon
        const iconContainer = amenityBoxes[index].querySelector('.icon');
        if (iconContainer && item.icon) iconContainer.innerHTML = item.icon;
        
        // Update Text (This is tricky because text is a direct node in the current HTML)
        // Let's assume the HTML structure: <div class="box"> <div class="icon">...</div> Text </div>
        // We need to replace the text node without killing the icon.
        if (item.text) {
           // Find the text node (nodeType 3)
           let textNode = Array.from(amenityBoxes[index].childNodes).find(n => n.nodeType === 3 && n.textContent.trim().length > 0);
           if (textNode) {
             textNode.textContent = ` ${item.text} `;
           } else {
             // Fallback if structure is different
             amenityBoxes[index].appendChild(document.createTextNode(item.text));
           }
        }
        
        // Tooltip
        if (item.tooltip) {
          amenityBoxes[index].setAttribute('title', item.tooltip);
        }
      }
    });
  }

  // --- REVIEWS ---
  if (data.reviews && Array.isArray(data.reviews)) {
    const reviewCards = document.querySelectorAll('.review-card');
    data.reviews.forEach((review, index) => {
      if (reviewCards[index]) {
        reviewCards[index].innerHTML = `
          <div style="color:var(--secondary); margin-bottom:10px;">${"★ ".repeat(review.stars || 5)}</div>
          “${review.text}”
          <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
             <strong>${review.author}</strong>
             ${review.verified ? '<span class="verified-badge">Verified Guest</span>' : ''}
          </div>
        `;
      }
    });
  }

  // --- CONTACT ---
  if (data.contact) {
    setText('contact.phone', data.contact.phone);
    setAttr('contact.phone', 'href', `tel:${data.contact.phone.replace(/\s+/g, '')}`);
    
    setAttr('contact.whatsapp', 'href', data.contact.whatsappLink);
    
    // Address
    const addressDiv = document.querySelector('[data-cms="contact.address"]');
    if (addressDiv && data.contact.addressLine1) {
      addressDiv.innerHTML = `${data.contact.addressLine1}<br>${data.contact.addressLine2}<br>
      <a href="tel:${data.contact.phone.replace(/\s+/g, '')}" style="color:rgba(255,255,255,0.7); text-decoration:none; transition:color 0.3s;">${data.contact.phone}</a>`;
    }
  }

  // --- FOOTER ---
  if (data.footer) {
    setText('footer.tagline', data.footer.tagline);
    setText('footer.copyright', data.footer.copyright);
  }
}
