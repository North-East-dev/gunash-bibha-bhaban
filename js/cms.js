
const contentUrl = 'content.json';

async function fetchContent() {
  try {
    let data;
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      try {
        const snapshot = await firebase.database().ref('content').once('value');
        const firebaseData = snapshot.val();
        if (firebaseData) {
          data = firebaseData;
        }
      } catch (err) {}
    }
    if (!data) {
      const response = await fetch(contentUrl);
      if (!response.ok) throw new Error('Failed to load content');
      data = await response.json();
    }
    updateDOM(data);
    window.cmsContent = data;
    window.dispatchEvent(new CustomEvent('cms-loaded', { detail: data }));
    if (document.getElementById('calendarGrid')) {
      initCalendar();
    }
    initAnimations();
    initScrollEffects();
  } catch (error) {
    console.error('CMS Error:', error);
  }
}

function initAnimations() {
  const observer = window.fadeObserver || new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting)x.target.classList.add("visible")}),{threshold:0.1});
  document.querySelectorAll(".fade-up").forEach(el => {
    observer.observe(el);
  });
}

function updateDOM(data, prefix = '') {
  for (const key in data) {
    const value = data[key];
    const currentKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      updateDOM(value, currentKey);
    } else {
      const elements = document.querySelectorAll(`[data-cms="${currentKey}"]`);
      elements.forEach(element => {
        if (Array.isArray(value)) {
          renderList(element, value, currentKey);
        } else {
          if (element.tagName === 'IMG') {
            element.src = value;
          } else if (element.tagName === 'A' && key === 'phone') {
            element.href = `tel:${value.replace(/\s/g, '')}`;
            element.textContent = value;
          } else if (element.tagName === 'A' && key === 'whatsapp') {
            element.textContent = value;
          } else {
            element.innerHTML = value;
          }
        }
      });
    }
  }
}

function renderList(container, items, key) {
  if (key === 'amenities.items') {
    renderAmenities(container, items);
  } else if (key === 'experiences.reviews') {
    renderReviews(container, items);
  } else if (key === 'experiences.gallery') {
    renderGallery(container, items);
  } else if (key === 'hero.slideshow') {
    renderHeroSlideshow(container, items);
  } else if (key === 'gallery.items') {
    renderFullGallery(container, items);
  }
}

function renderFullGallery(container, items) {
  container.innerHTML = items.map((item, index) => `
    <div class="gallery-item" data-src="${item.src}" data-caption="${item.caption}">
      <img src="${item.src}" alt="${item.caption}">
      <div class="overlay">${item.caption}</div>
    </div>
  `).join('');
  if (typeof window.initLightbox === 'function') {
    window.initLightbox();
  }
}

function renderHeroSlideshow(container, items) {
  if (!items || items.length === 0) return;
  const gradients = `
    radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%),
    linear-gradient(rgba(45, 20, 63, 0.4), rgba(20, 10, 30, 0.8))
  `;
  const grainSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E";
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
  const grainHtml = `
    <div style="
      position: absolute; inset: 0; 
      background-image: url('${grainSvg}'); 
      opacity: 0.08; mix-blend-mode: soft-light; pointer-events: none; 
      z-index: 1;
    "></div>
  `;
  container.innerHTML = slidesHtml + grainHtml;
  let currentSlide = 0;
  const slides = container.querySelectorAll('.hero-slide');
  if (container.dataset.interval) clearInterval(container.dataset.interval);
  const interval = setInterval(() => {
    slides[currentSlide].style.opacity = 0;
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].style.opacity = 1;
  }, 5000);
  container.dataset.interval = interval;
}

function renderAmenities(container, items) {
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
  container.innerHTML = items.map(item => `
    <div class="mySlides slide-fade">
      <img src="${item.src}" alt="${item.caption}" loading="lazy">
      <div class="slide-caption">${item.caption}</div>
    </div>
  `).join('');
  
  if (typeof showSlides === 'function') {
    slideIndex = 1;
    showSlides(slideIndex);
    
    // Auto-rotation for Past Events
    if (container.dataset.interval) clearInterval(container.dataset.interval);
    const interval = setInterval(() => {
        if (typeof plusSlides === 'function') plusSlides(1);
    }, 4000);
    container.dataset.interval = interval;
  }
}

let slideIndex = 1;
function plusSlides(n) { showSlides(slideIndex += n); }
function currentSlide(n) { showSlides(slideIndex = n); }
function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (slides.length === 0) return;
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) { slides[i].style.display = "none"; }
  for (i = 0; i < dots.length; i++) { dots[i].className = dots[i].className.replace(" active", ""); }
  slides[slideIndex-1].style.display = "block";
  if (dots.length > 0) { dots[slideIndex-1].className += " active"; }
}
window.plusSlides = plusSlides;
window.currentSlide = currentSlide;
window.showSlides = showSlides;

function switchExperience(tabName) {
  const tabs = document.querySelectorAll('.exp-tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  const activeTab = Array.from(tabs).find(t => t.innerText.toLowerCase().includes(tabName === 'reviews' ? 'guest' : 'event'));
  if (activeTab) activeTab.classList.add('active');
  const panels = document.querySelectorAll('.exp-panel');
  panels.forEach(panel => panel.classList.remove('active'));
  const activePanel = document.getElementById(`exp-${tabName}`);
  if (activePanel) activePanel.classList.add('active');
}
window.switchExperience = switchExperience;

document.addEventListener('DOMContentLoaded', fetchContent);

let currentCalDate = new Date();
function initCalendar() { renderCalendar(currentCalDate); }
function changeMonth(delta) {
  currentCalDate.setMonth(currentCalDate.getMonth() + delta);
  renderCalendar(currentCalDate);
}
window.changeMonth = changeMonth;

function renderCalendar(date) {
  const grid = document.getElementById('calendarGrid');
  const header = document.getElementById('monthYear');
  if (!grid || !header) return;
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const monthName = date.toLocaleString('default', { month: 'long' });
  header.textContent = `${monthName} ${year}`;
  grid.innerHTML = '';
  
  // Empty slots (Invisible)
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    empty.style.visibility = 'hidden';
    grid.appendChild(empty);
  }
  
  // Days
  const today = new Date();
  today.setHours(0,0,0,0); // Normalize today for comparison

  // Peak Season Check (Oct-Feb)
  const peakMonths = [9, 10, 11, 0, 1]; // Oct, Nov, Dec, Jan, Feb
  const hintEl = document.getElementById('calHint');
  if (hintEl) {
    if (peakMonths.includes(month)) {
      hintEl.innerHTML = '🔥 <strong>Peak Season!</strong> Dates book fast. Tap to enquire.';
      hintEl.style.color = '#e65100'; // Orange/Red warning
    } else {
      hintEl.innerHTML = 'Tap available dates to enquire';
      hintEl.style.color = 'var(--primary)';
    }
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const iso = cellDate.toISOString().split('T')[0];
    const dayEl = document.createElement('div');
    dayEl.className = 'cal-day';
    
    // Highlight Today
    if (cellDate.getDate() === today.getDate() && 
        cellDate.getMonth() === today.getMonth() && 
        cellDate.getFullYear() === today.getFullYear()) {
      dayEl.classList.add('today');
    }

    // Past Date Check
    if (cellDate < today) {
        dayEl.classList.add('disabled');
    } else {
        const status = getDateStatus(iso);
        if (status) {
          dayEl.classList.add(status);
        } else {
          dayEl.classList.add('available');
          dayEl.addEventListener('click', () => {
            if (typeof openModal === 'function') openModal(iso);
          });
        }
    }
    
    dayEl.textContent = d;
    grid.appendChild(dayEl);
  }
}

function getDateStatus(iso) {
  const bookings = (window.cmsContent && window.cmsContent.bookings && window.cmsContent.bookings.bookedDates) ? window.cmsContent.bookings.bookedDates : [];
  for (const b of bookings) {
    const start = new Date(b.start);
    const end = new Date(b.end || b.start);
    const cur = new Date(iso);
    if (cur >= start && cur <= end) {
      return b.status || 'booked';
    }
  }
  return null;
}

function initScrollEffects() {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroBg = document.querySelector('.hero-bg');
    const nav = document.querySelector('.navbar');
    if (heroBg && scrolled < window.innerHeight) {
      heroBg.style.transform = `scale(1.1) translateY(${scrolled * 0.3}px)`;
    }
    if (nav) {
      if (scrolled > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  });
}
