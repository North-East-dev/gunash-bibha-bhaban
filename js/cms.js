
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
    
    // Initialize Calendar if element exists
    if (document.getElementById('calendarGrid')) {
        initCalendar();
    }
    
    // Re-trigger animations for new content
    initAnimations();

  } catch (error) {
    console.error('CMS Error:', error);
  }
}

// Initialize animations for dynamic content
function initAnimations() {
    const observer = window.fadeObserver || new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting)x.target.classList.add("visible")}),{threshold:0.1});
    
    document.querySelectorAll(".fade-up").forEach(el => {
        // Only observe if not already visible (optional optimization)
        observer.observe(el);
    });
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

// Helper to render lists (Reviews, Amenities, Gallery, Slideshows)
function renderList(container, items, key) {
  if (key === 'amenities.items') {
     renderAmenities(container, items);
  } else if (key === 'experiences.reviews') {
     renderReviews(container, items);
  } else if (key === 'experiences.gallery') {
     renderGallery(container, items);
  } else if (key === 'hero.slideshow') {
     renderHeroSlideshow(container, items);
  }
}

function renderHeroSlideshow(container, items) {
  if (!items || items.length === 0) return;

  // Gradients from CSS to maintain style
  const gradients = `
    radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%),
    linear-gradient(rgba(45, 20, 63, 0.4), rgba(20, 10, 30, 0.8))
  `;

  // Grain overlay SVG data
  const grainSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E";

  // Create slides
  const slidesHtml = items.map((item, index) => `
    <div class="hero-slide ${index === 0 ? 'active' : ''}" 
         style="
           position: absolute; inset: 0; 
           background: ${gradients}, url('${item.src}'); 
           background-size: cover; background-position: center; 
           opacity: ${index === 0 ? 1 : 0}; 
           transition: opacity 1.5s ease-in-out;
           z-index: 0;
         ">
    </div>
  `).join('');

  // Re-add grain overlay on top
  const grainHtml = `
    <div style="
      position: absolute; inset: 0; 
      background-image: url('${grainSvg}'); 
      opacity: 0.08; mix-blend-mode: soft-light; pointer-events: none; 
      z-index: 1;
    "></div>
  `;

  container.innerHTML = slidesHtml + grainHtml;

  // Start slideshow loop
  let currentSlide = 0;
  const slides = container.querySelectorAll('.hero-slide');
  
  // Clear any existing interval to prevent duplicates
  if (container.dataset.interval) clearInterval(container.dataset.interval);

  const interval = setInterval(() => {
    slides[currentSlide].style.opacity = 0;
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].style.opacity = 1;
  }, 5000); // 5 seconds per slide

  container.dataset.interval = interval;
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
  `).join('');
  
  // Re-initialize slideshow if needed
    if (typeof showSlides === 'function') {
      slideIndex = 1;
      showSlides(slideIndex);
    }
}

// --- GALLERY SLIDESHOW LOGIC ---
let slideIndex = 1;

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (slides.length === 0) return; // Safety check

  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  
  slides[slideIndex-1].style.display = "block";
  if (dots.length > 0) {
      dots[slideIndex-1].className += " active";
  }
}

// Make functions global
window.plusSlides = plusSlides;
window.currentSlide = currentSlide;
window.showSlides = showSlides;


// --- TAB SWITCHING LOGIC ---
function switchExperience(tabName) {
    // Update Tabs
    const tabs = document.querySelectorAll('.exp-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Find the button that was clicked (approximate matching)
    const activeTab = Array.from(tabs).find(t => t.innerText.toLowerCase().includes(tabName === 'reviews' ? 'guest' : 'event'));
    if (activeTab) activeTab.classList.add('active');

    // Update Panels
    const panels = document.querySelectorAll('.exp-panel');
    panels.forEach(panel => panel.classList.remove('active'));
    
    const activePanel = document.getElementById(`exp-${tabName}`);
    if (activePanel) activePanel.classList.add('active');
}
window.switchExperience = switchExperience;


// Initialize
document.addEventListener('DOMContentLoaded', fetchContent);


/* --- CALENDAR LOGIC --- */
let currentCalDate = new Date();

function initCalendar() {
    renderCalendar(currentCalDate);
}

function changeMonth(delta) {
    currentCalDate.setMonth(currentCalDate.getMonth() + delta);
    renderCalendar(currentCalDate);
}

// Make changeMonth global so onclick works
window.changeMonth = changeMonth;

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('monthYear');
    
    if (!grid || !label) return;

    // Update Header
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    label.textContent = `${monthNames[month]} ${year}`;

    // Calculate days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get bookings from CMS content
    const bookings = (window.cmsContent && window.cmsContent.bookings && window.cmsContent.bookings.bookedDates) 
                     ? window.cmsContent.bookings.bookedDates 
                     : [];

    // Helper to check date status
    const getDateStatus = (y, m, d) => {
        const checkDate = new Date(y, m, d);
        // Reset time for accurate comparison
        checkDate.setHours(0,0,0,0);
        
        // Check past dates
        const today = new Date();
        today.setHours(0,0,0,0);
        if (checkDate < today) return 'past';

        // Check bookings
        for (const b of bookings) {
            // Parse "YYYY-MM-DD" manually to avoid UTC conversion issues
            const [sYear, sMonth, sDay] = b.start.split('-').map(Number);
            const start = new Date(sYear, sMonth - 1, sDay);
            
            // If it's a range
            if (b.end && b.end !== b.start) {
                const [eYear, eMonth, eDay] = b.end.split('-').map(Number);
                const end = new Date(eYear, eMonth - 1, eDay);
                // Compare timestamps to be safe (ignoring time)
                if (checkDate.getTime() >= start.getTime() && checkDate.getTime() <= end.getTime()) {
                    return b.status || 'booked';
                }
            } else {
                // Single date
                if (checkDate.getTime() === start.getTime()) {
                    return b.status || 'booked';
                }
            }
        }
        return 'available';
    };

    let html = '';
    
    // Day Headers
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    days.forEach(d => html += `<div class="cal-day-header">${d}</div>`);

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        html += `<div></div>`;
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const status = getDateStatus(year, month, i);
        let className = 'cal-day';
        let onclick = '';

        if (status === 'past') {
            className += ' disabled';
        } else if (status === 'booked') {
            className += ' booked';
        } else if (status === 'blocked') {
            className += ' blocked'; // Gray
        } else if (status === 'tentative') {
            className += ' tentative'; // Yellow/Orange
        } else {
            // Available
            onclick = `onclick="openModal('${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}')"`;
        }
        
        // Highlight today
        const today = new Date();
        if (today.getDate() === i && today.getMonth() === month && today.getFullYear() === year) {
            className += ' today';
        }

        html += `<div class="${className}" ${onclick}>${i}</div>`;
    }

    grid.innerHTML = html;
}
