/**
 * APEX Store - Main Shared JavaScript Engine
 * Filter test products & strictly use database images.
 */

const API_BASE_URL = 'https://api.escuelajs.co/api/v1';

const SVG_FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 24 24" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;

// Helper to check if a category is real and clean
function isValidCategory(cat) {
  if (!cat || !cat.name || typeof cat.name !== 'string') return false;
  const name = cat.name.trim();
  const lower = name.toLowerCase();

  if (lower.length === 0 || lower.length > 25) return false;

  if (
    lower.includes('config-') ||
    lower.includes('updated') ||
    lower.includes('test') ||
    lower.includes('trial') ||
    lower.includes('new category') ||
    lower.includes('electronics from') ||
    lower.includes('bakso') ||
    lower.includes('chage')
  ) {
    return false;
  }
  return true;
}

// Get Cart from localStorage
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('apex_cart') || '[]');
  } catch (e) {
    return [];
  }
}

// Save Cart to localStorage
function saveCart(cart) {
  localStorage.setItem('apex_cart', JSON.stringify(cart));
  updateCartBadge();
}

// Add Item to Cart
function addToCart(product, quantity = 1) {
  if (!product || !product.id) return;
  const cart = getCart();
  const existingIdx = cart.findIndex(item => item.id === product.id);

  if (existingIdx > -1) {
    cart[existingIdx].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      product: product,
      quantity: quantity
    });
  }

  saveCart(cart);
  showToast(`Added "${product.title}" to cart!`);
}

// Update Cart Count Badge in Header
function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count-badge').forEach(badge => {
    badge.textContent = totalCount;
    if (totalCount > 0) {
      badge.classList.remove('hidden');
      badge.classList.add('animate-pop-in');
    } else {
      badge.classList.add('hidden');
    }
  });
}

// Check if a product has a valid, non-placeholder database photo
function hasValidProductPhoto(p) {
  if (!p || !Array.isArray(p.images) || p.images.length === 0) return false;

  return p.images.some(rawUrl => {
    if (!rawUrl) return false;
    let cleaned = String(rawUrl)
      .replace(/^\[+/, '')
      .replace(/\]+$/, '')
      .replace(/^"+/, '')
      .replace(/"+$/, '')
      .replace(/^'+/, '')
      .replace(/'+$/, '')
      .trim();

    if (cleaned.startsWith('[') || cleaned.endsWith(']')) {
      cleaned = cleaned.replace(/[\[\]"']/g, '').trim();
    }

    if (
      !cleaned.startsWith('http') || 
      cleaned.length < 10 || 
      cleaned.includes('placehold.co') ||
      cleaned.includes('placeholder') ||
      cleaned.includes('gmail.com') ||
      cleaned.includes('google.com/imgres') ||
      cleaned.endsWith('.com/') ||
      cleaned.endsWith('.info/')
    ) {
      return false;
    }
    return true;
  });
}

// Helper to filter out test/junk products or products without photos
function isRealProduct(p) {
  if (!p || !p.title || !p.price) return false;
  const title = p.title.trim().toLowerCase();
  const desc = (p.description || '').toLowerCase();
  
  if (
    title === '' || 
    title === 'chage title' || 
    title.includes('config-') || 
    title.includes('updated') || 
    title.includes('test') || 
    title.includes('jkuat') || 
    title.includes('electronics from') || 
    title.includes('new product') ||
    desc.includes('description-') || 
    desc.includes('config-') || 
    desc.length < 5
  ) {
    return false;
  }

  // Strictly exclude products without valid database photos
  if (!hasValidProductPhoto(p)) {
    return false;
  }
  
  return true;
}

// Extract & clean image URL directly from database
function cleanExactApiImageUrl(rawUrl) {
  if (!rawUrl) return SVG_FALLBACK_IMAGE;
  
  let cleaned = String(rawUrl)
    .replace(/^\[+/, '')
    .replace(/\]+$/, '')
    .replace(/^"+/, '')
    .replace(/"+$/, '')
    .replace(/^'+/, '')
    .replace(/'+$/, '')
    .trim();

  if (cleaned.startsWith('[') || cleaned.endsWith(']')) {
    cleaned = cleaned.replace(/[\[\]"']/g, '').trim();
  }

  // Strictly use valid HTTP/HTTPS image URL from database
  if (!cleaned.startsWith('http') || cleaned.length < 10 || cleaned.includes('placehold.co')) {
    return SVG_FALLBACK_IMAGE;
  }

  return cleaned;
}

// Process API product data directly using database photos only
function cleanProductData(p) {
  let images = [];
  
  if (Array.isArray(p.images) && p.images.length > 0) {
    images = p.images
      .map(img => cleanExactApiImageUrl(img))
      .filter(url => url && url !== SVG_FALLBACK_IMAGE);
  }

  if (images.length === 0) {
    images = [SVG_FALLBACK_IMAGE];
  }

  return {
    ...p,
    price: Math.max(10, Math.round(p.price || 49.99)),
    images: images,
    rating: (3.8 + (p.id % 13) * 0.1).toFixed(1),
    reviewCount: 12 + (p.id * 7) % 180
  };
}

// Fallback Image Handler
function handleImageError(imgElem) {
  imgElem.onerror = null;
  imgElem.src = SVG_FALLBACK_IMAGE;
}

// Toast Notifications System
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-rose-600' : type === 'info' ? 'bg-slate-800' : 'bg-indigo-600';
  
  toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold pointer-events-auto animate-slide-in-right`;
  toast.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Shared Header Initialization & Search Bar
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.toLowerCase().trim();
      const dropdown = document.getElementById('search-results-dropdown');
      if (!dropdown) return;

      if (!query) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const data = await res.json();
        const realData = data.filter(p => isRealProduct(p));
        const cleaned = realData.map((p, i) => cleanProductData(p, i));
        const matches = cleaned.filter(p => p.title.toLowerCase().includes(query)).slice(0, 5);

        if (matches.length === 0) {
          dropdown.innerHTML = `<div class="p-4 text-sm text-slate-500 text-center">No products found matching "${query}"</div>`;
        } else {
          dropdown.innerHTML = matches.map(p => `
            <a href="product.html?id=${p.id}" class="flex items-center gap-3 p-3 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 transition">
              <img src="${p.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">${p.title}</p>
                <p class="text-xs text-indigo-600 font-bold">$${p.price}</p>
              </div>
            </a>
          `).join('');
        }
        dropdown.classList.remove('hidden');
      } catch (err) {
        console.error('Header search error:', err);
      }
    });

    document.addEventListener('click', (e) => {
      const searchBox = document.getElementById('search-container');
      const dropdown = document.getElementById('search-results-dropdown');
      if (searchBox && dropdown && !searchBox.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }
});
