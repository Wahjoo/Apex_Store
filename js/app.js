/**
 * Pure Vanilla JavaScript E-Commerce Store Engine
 * Powered by Fake Store API
 */

const API_BASE_URL = 'https://fakestoreapi.com';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

let appState = {
  products: [],
  categories: [],
  filteredProducts: [],
  cart: JSON.parse(localStorage.getItem('apex_cart') || '[]'),
  selectedCategory: 'all',
  searchQuery: '',
  priceRange: 1000,
  sortBy: 'featured',
  activeProductId: null,
  activeView: 'home',
  productDetailQuantity: 1,
  selectedDetailImage: null
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  updateCartBadge();
  handleHashRouting();

  await loadCategories();
  await loadProducts();
}

function handleHashRouting() {
  const hash = window.location.hash.slice(1) || 'home';
  if (hash.startsWith('product/')) {
    const id = parseInt(hash.split('/')[1]);
    if (id) {
      showProductDetailView(id);
      return;
    }
  }

  const validViews = ['home', 'shop', 'cart', 'checkout', 'about', 'contact'];
  if (validViews.includes(hash)) {
    navigateToView(hash, false);
  } else {
    navigateToView('home', false);
  }
}

window.addEventListener('hashchange', () => {
  handleHashRouting();
});

function navigateToView(viewName, updateHash = true) {
  appState.activeView = viewName;
  if (updateHash && window.location.hash !== `#${viewName}`) {
    window.location.hash = viewName;
  }

  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.add('hidden');
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('hidden');
    targetView.classList.add('animate-fade-in');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.view === viewName) {
      link.classList.add('text-indigo-600', 'font-bold');
      link.classList.remove('text-slate-600');
    } else {
      link.classList.remove('text-indigo-600', 'font-bold');
      link.classList.add('text-slate-600');
    }
  });

  if (viewName === 'cart') {
    renderCartPage();
  } else if (viewName === 'checkout') {
    renderCheckoutPage();
  } else if (viewName === 'shop') {
    applyFiltersAndSort();
  }

  closeMobileMenu();
}

async function loadProducts() {
  try {
    showLoadingSkeletons();
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    
    // Filter out config/test products
    const cleanData = data.filter(p => isRealProduct(p));
    appState.products = cleanData.map((p, index) => cleanProductData(p, index));
    appState.filteredProducts = [...appState.products];

    renderFeaturedProducts();
    renderCategoriesGrid();
    renderShopGrid();

    const hash = window.location.hash.slice(1);
    if (hash.startsWith('product/')) {
      const id = parseInt(hash.split('/')[1]);
      if (id) showProductDetailView(id);
    }
  } catch (err) {
    console.error('Error fetching products:', err);
    showToast('Failed to load live catalog.', 'error');
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/products/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    
    // Filter out config/test categories
    appState.categories = data
      .filter(cat => isValidCategory(cat))
      .slice(0, 5);

    renderCategoryPills();
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

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

  if (!cleaned.startsWith('http') || cleaned.length < 10) return SVG_FALLBACK_IMAGE;
  return cleaned;
}

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

function handleImageError(imgElem) {
  imgElem.onerror = null;
  imgElem.src = SVG_FALLBACK_IMAGE;
}

function setupEventListeners() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  document.querySelectorAll('[data-view-target]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.preventDefault();
      const view = elem.dataset.viewTarget;
      navigateToView(view);
    });
  });

  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.toLowerCase().trim();
      handleLiveSearch(appState.searchQuery);
    });
    
    document.addEventListener('click', (e) => {
      const searchBox = document.getElementById('search-container');
      const searchResults = document.getElementById('search-results-dropdown');
      if (searchBox && searchResults && !searchBox.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }

  const shopSearchInput = document.getElementById('shop-search-input');
  if (shopSearchInput) {
    shopSearchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.toLowerCase().trim();
      applyFiltersAndSort();
    });
  }

  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      appState.sortBy = e.target.value;
      applyFiltersAndSort();
    });
  }

  const priceRangeSlider = document.getElementById('price-range-slider');
  const priceRangeVal = document.getElementById('price-range-value');
  if (priceRangeSlider && priceRangeVal) {
    priceRangeSlider.addEventListener('input', (e) => {
      appState.priceRange = parseInt(e.target.value);
      priceRangeVal.textContent = `$${appState.priceRange}`;
      applyFiltersAndSort();
    });
  }

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleOrderPlacement();
    });
  }

  const sameAsBilling = document.getElementById('same-as-billing');
  const shippingFields = document.getElementById('shipping-fields');
  if (sameAsBilling && shippingFields) {
    sameAsBilling.addEventListener('change', (e) => {
      if (e.target.checked) {
        shippingFields.classList.add('hidden');
      } else {
        shippingFields.classList.remove('hidden');
      }
    });
  }
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) mobileMenu.classList.add('hidden');
}

function handleLiveSearch(query) {
  const dropdown = document.getElementById('search-results-dropdown');
  if (!dropdown) return;

  if (!query) {
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
    return;
  }

  const matches = appState.products.filter(p => 
    p.title.toLowerCase().includes(query) || 
    (p.category && p.category.name.toLowerCase().includes(query))
  ).slice(0, 5);

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-4 text-sm text-slate-500 text-center">No products found matching "${query}"</div>`;
  } else {
    dropdown.innerHTML = matches.map(p => `
      <div onclick="showProductDetailView(${p.id}); document.getElementById('search-results-dropdown').classList.add('hidden');" 
           class="flex items-center gap-3 p-3 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 transition">
        <img src="${p.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-800 truncate">${p.title}</p>
          <p class="text-xs text-indigo-600 font-bold">$${p.price}</p>
        </div>
      </div>
    `).join('');
  }

  dropdown.classList.remove('hidden');
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  const shopCategories = document.getElementById('shop-category-list');
  
  if (container) {
    container.innerHTML = `
      <button onclick="filterByCategory('all')" class="category-pill ${appState.selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} px-5 py-2.5 rounded-full font-medium text-sm transition">
        All Items
      </button>
      ${appState.categories.map(cat => `
        <button onclick="filterByCategory('${cat.id}')" class="category-pill ${appState.selectedCategory == cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} px-5 py-2.5 rounded-full font-medium text-sm transition">
          ${cat.name}
        </button>
      `).join('')}
    `;
  }

  if (shopCategories) {
    shopCategories.innerHTML = `
      <li onclick="filterByCategory('all')" class="cursor-pointer py-1.5 px-3 rounded-lg text-sm font-medium ${appState.selectedCategory === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}">
        All Categories
      </li>
      ${appState.categories.map(cat => `
        <li onclick="filterByCategory('${cat.id}')" class="cursor-pointer py-1.5 px-3 rounded-lg text-sm font-medium ${appState.selectedCategory == cat.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}">
          ${cat.name}
        </li>
      `).join('')}
    `;
  }
}

function filterByCategory(catId) {
  appState.selectedCategory = catId;
  renderCategoryPills();
  
  if (appState.activeView !== 'shop') {
    navigateToView('shop');
  } else {
    applyFiltersAndSort();
  }
}

function applyFiltersAndSort() {
  let list = [...appState.products];

  if (appState.selectedCategory !== 'all') {
    list = list.filter(p => p.category && p.category.id == appState.selectedCategory);
  }

  if (appState.searchQuery) {
    list = list.filter(p => p.title.toLowerCase().includes(appState.searchQuery) || p.description.toLowerCase().includes(appState.searchQuery));
  }

  list = list.filter(p => p.price <= appState.priceRange);

  if (appState.sortBy === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (appState.sortBy === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (appState.sortBy === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  appState.filteredProducts = list;
  renderShopGrid();
}

function renderFeaturedProducts() {
  const container = document.getElementById('featured-products-grid');
  if (!container) return;

  const featured = appState.products.slice(0, 8);
  container.innerHTML = featured.map(product => createProductCardHtml(product)).join('');
}

function renderCategoriesGrid() {
  const container = document.getElementById('landing-categories-grid');
  if (!container) return;

  container.innerHTML = appState.categories.map(cat => {
    const catImage = cleanExactApiImageUrl(cat.image);
    return `
      <div onclick="filterByCategory('${cat.id}')" class="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
        <img src="${catImage}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent flex items-end p-6">
          <div>
            <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white mb-2">Category</span>
            <h3 class="text-xl font-bold text-white group-hover:text-indigo-300 transition">${cat.name}</h3>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderShopGrid() {
  const container = document.getElementById('shop-products-grid');
  const countLabel = document.getElementById('shop-results-count');
  if (!container) return;

  if (countLabel) {
    countLabel.textContent = `Showing ${appState.filteredProducts.length} items`;
  }

  if (appState.filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-1">No products found</h3>
        <p class="text-slate-500 text-sm mb-4">Try adjusting your filters or search keywords.</p>
        <button onclick="resetFilters()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.filteredProducts.map(product => createProductCardHtml(product)).join('');
}

function resetFilters() {
  appState.selectedCategory = 'all';
  appState.searchQuery = '';
  appState.priceRange = 1000;
  appState.sortBy = 'featured';

  const priceSlider = document.getElementById('price-range-slider');
  if (priceSlider) priceSlider.value = 1000;
  const priceVal = document.getElementById('price-range-value');
  if (priceVal) priceVal.textContent = '$1000';

  renderCategoryPills();
  applyFiltersAndSort();
}

function createProductCardHtml(product) {
  const primaryImg = product.images[0];
  const catName = product.category ? product.category.name : 'General';

  return `
    <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      <div class="relative h-60 overflow-hidden bg-slate-50 cursor-pointer" onclick="showProductDetailView(${product.id})">
        <img src="${primaryImg}" referrerpolicy="no-referrer" onerror="handleImageError(this)" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
          ${catName}
        </span>
        <button onclick="event.stopPropagation(); quickAddToCart(${product.id});" class="absolute bottom-3 right-3 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white p-3 rounded-full shadow-lg transition duration-200 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100" title="Quick Add to Cart">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-1 text-amber-400 text-xs mb-2">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
            <span class="font-bold text-slate-700 ml-1">${product.rating}</span>
            <span class="text-slate-400">(${product.reviewCount})</span>
          </div>

          <h3 onclick="showProductDetailView(${product.id})" class="font-bold text-slate-800 text-base mb-1 hover:text-indigo-600 transition cursor-pointer line-clamp-1">
            ${product.title}
          </h3>
          <p class="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            ${product.description}
          </p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span class="text-xs text-slate-400 block font-medium">Price</span>
            <span class="text-xl font-extrabold text-slate-900">$${product.price}</span>
          </div>
          <button onclick="addToCartById(${product.id}, 1)" class="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

function showProductDetailView(productId) {
  const product = appState.products.find(p => p.id === productId);
  if (!product) return;

  appState.activeProductId = productId;
  appState.productDetailQuantity = 1;
  appState.selectedDetailImage = product.images[0];

  window.location.hash = `product/${productId}`;
  navigateToView('product', false);

  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const catName = product.category ? product.category.name : 'General';

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <div class="space-y-4">
        <div class="h-96 md:h-[480px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shadow-md relative">
          <img id="main-product-gallery-img" src="${appState.selectedDetailImage}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-full h-full object-cover transition duration-300" />
          <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
            ${catName}
          </span>
        </div>

        <div class="grid grid-cols-4 gap-4">
          ${product.images.map((imgUrl, idx) => `
            <button onclick="selectProductDetailImage('${imgUrl}', this)" class="detail-thumb-btn h-24 rounded-2xl overflow-hidden border-2 ${imgUrl === appState.selectedDetailImage ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent opacity-70 hover:opacity-100'} transition">
              <img src="${imgUrl}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-full h-full object-cover" />
            </button>
          `).join('')}
        </div>
      </div>

      <div class="flex flex-col justify-between space-y-6">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="flex items-center text-amber-400">
              ${[1, 2, 3, 4, 5].map(() => `<svg class="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`).join('')}
            </div>
            <span class="text-sm font-bold text-slate-700">${product.rating}</span>
            <span class="text-slate-400 text-sm">(${product.reviewCount} customer reviews)</span>
          </div>

          <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 leading-tight">${product.title}</h1>
          <div class="flex items-baseline gap-4 mb-6">
            <span class="text-3xl font-black text-indigo-600">$${product.price}</span>
            <span class="text-slate-400 line-through text-lg font-medium">$${Math.round(product.price * 1.25)}</span>
            <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">In Stock</span>
          </div>

          <p class="text-slate-600 leading-relaxed mb-6 text-base border-t border-b border-slate-100 py-4">
            ${product.description}
          </p>

          <div class="space-y-3 mb-8">
            <div class="flex items-center gap-3 text-slate-700 text-sm">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Premium high-durability craftsmanship</span>
            </div>
            <div class="flex items-center gap-3 text-slate-700 text-sm">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Free standard delivery on orders over $50</span>
            </div>
          </div>
        </div>

        <div class="space-y-4 pt-4 border-t border-slate-100">
          <div class="flex items-center gap-4">
            <span class="text-sm font-bold text-slate-700">Quantity:</span>
            <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
              <button onclick="updateDetailQty(-1)" class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold transition">-</button>
              <span id="detail-qty-val" class="w-12 text-center font-bold text-slate-800">1</span>
              <button onclick="updateDetailQty(1)" class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold transition">+</button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <button onclick="addToCartById(appState.activeProductId, appState.productDetailQuantity)" class="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition transform active:scale-95">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              Add to Cart
            </button>
            <button onclick="buyNowById(appState.activeProductId)" class="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-base transition">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectProductDetailImage(imgUrl, btnElem) {
  appState.selectedDetailImage = imgUrl;
  const mainImg = document.getElementById('main-product-gallery-img');
  if (mainImg) mainImg.src = imgUrl;

  document.querySelectorAll('.detail-thumb-btn').forEach(btn => {
    btn.classList.remove('border-indigo-600', 'ring-2', 'ring-indigo-200');
    btn.classList.add('border-transparent', 'opacity-70');
  });
  btnElem.classList.remove('border-transparent', 'opacity-70');
  btnElem.classList.add('border-indigo-600', 'ring-2', 'ring-indigo-200');
}

function updateDetailQty(delta) {
  appState.productDetailQuantity = Math.max(1, appState.productDetailQuantity + delta);
  const qtyElem = document.getElementById('detail-qty-val');
  if (qtyElem) qtyElem.textContent = appState.productDetailQuantity;
}

function addToCartById(productId, quantity = 1) {
  const p = appState.products.find(item => item.id === productId);
  if (p) addToCart(p, quantity);
}

function quickAddToCart(productId) {
  addToCartById(productId, 1);
}

function buyNowById(productId) {
  addToCartById(productId, appState.productDetailQuantity);
  navigateToView('cart');
}

function updateCartQuantity(productId, delta) {
  const item = appState.cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCartState();
  updateCartBadge();
  renderCartPage();
}

function removeFromCart(productId) {
  appState.cart = appState.cart.filter(item => item.id !== productId);
  saveCartState();
  updateCartBadge();
  renderCartPage();
  showToast('Item removed from cart', 'info');
}

function saveCartState() {
  localStorage.setItem('apex_cart', JSON.stringify(appState.cart));
}

function updateCartBadge() {
  const totalCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count-badge').forEach(badge => {
    badge.textContent = totalCount;
    if (totalCount > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });
}

function renderCartPage() {
  const container = document.getElementById('cart-items-container');
  const summaryContainer = document.getElementById('cart-summary-container');
  if (!container || !summaryContainer) return;

  if (appState.cart.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
        <button onclick="navigateToView('shop')" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
          Start Shopping Now
        </button>
      </div>
    `;
    summaryContainer.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 class="text-xl font-bold text-slate-900">Cart Items (${appState.cart.length})</h2>
        <button onclick="clearCart()" class="text-xs text-rose-600 font-bold">Clear All</button>
      </div>

      <div class="divide-y divide-slate-100">
        ${appState.cart.map(item => {
          const p = item.product;
          const lineTotal = p.price * item.quantity;
          return `
            <div class="p-6 flex flex-col sm:flex-row items-center gap-6">
              <img src="${p.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-24 h-24 object-cover rounded-2xl bg-slate-100" />
              <div class="flex-1 min-w-0">
                <h3 onclick="showProductDetailView(${p.id})" class="font-bold text-slate-800 cursor-pointer truncate">${p.title}</h3>
                <p class="text-xs text-slate-400 mb-2">Price: $${p.price}</p>
                <div class="flex items-center gap-4">
                  <div class="flex items-center border rounded-lg bg-white p-1">
                    <button onclick="updateCartQuantity(${p.id}, -1)" class="w-8 h-8 font-bold">-</button>
                    <span class="w-10 text-center font-bold text-sm">${item.quantity}</span>
                    <button onclick="updateCartQuantity(${p.id}, 1)" class="w-8 h-8 font-bold">+</button>
                  </div>
                  <button onclick="removeFromCart(${p.id})" class="text-xs text-rose-500 font-semibold">Remove</button>
                </div>
              </div>
              <div class="text-right">
                <span class="text-lg font-extrabold text-slate-900">$${lineTotal}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  const subtotal = appState.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  summaryContainer.innerHTML = `
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
      <h3 class="text-lg font-bold text-slate-900 border-b pb-4">Order Summary</h3>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between text-slate-600"><span>Subtotal</span><span class="font-bold text-slate-800">$${subtotal}</span></div>
        <div class="flex justify-between text-slate-600"><span>Shipping</span><span class="font-bold text-slate-800">${shipping === 0 ? 'FREE' : '$' + shipping}</span></div>
        <div class="flex justify-between text-slate-600"><span>Tax (8%)</span><span class="font-bold text-slate-800">$${tax}</span></div>
      </div>
      <div class="border-t pt-4 flex justify-between items-baseline">
        <span class="text-base font-bold text-slate-900">Total</span>
        <span class="text-2xl font-black text-indigo-600">$${total}</span>
      </div>
      <button onclick="navigateToView('checkout')" class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-base shadow-lg">
        Proceed to Checkout
      </button>
    </div>
  `;
}

function clearCart() {
  appState.cart = [];
  saveCartState();
  updateCartBadge();
  renderCartPage();
}

function renderCheckoutPage() {
  const container = document.getElementById('checkout-order-summary');
  if (!container) return;

  const subtotal = appState.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  container.innerHTML = `
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
      <h3 class="text-lg font-bold text-slate-900 border-b pb-4">Order Summary</h3>
      <div class="max-h-64 overflow-y-auto space-y-3">
        ${appState.cart.map(i => `
          <div class="flex items-center gap-3">
            <img src="${i.product.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-12 h-12 object-cover rounded-xl" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-slate-800 truncate">${i.product.title}</p>
              <p class="text-xs text-slate-400">Qty: ${i.quantity}</p>
            </div>
            <span class="text-xs font-extrabold text-slate-900">$${i.product.price * i.quantity}</span>
          </div>
        `).join('')}
      </div>
      <div class="border-t pt-4 flex justify-between items-baseline">
        <span class="text-sm font-bold text-slate-900">Total</span>
        <span class="text-2xl font-black text-indigo-600">$${total}</span>
      </div>
    </div>
  `;
}

function handleOrderPlacement() {
  const orderId = 'APX-' + Math.floor(100000 + Math.random() * 900000);
  const subtotal = appState.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  showOrderSuccessModal(orderId, total);
  appState.cart = [];
  saveCartState();
  updateCartBadge();
}

function showOrderSuccessModal(orderId, total) {
  const modal = document.getElementById('order-success-modal');
  const details = document.getElementById('modal-order-details');
  if (modal && details) {
    details.innerHTML = `
      <p class="text-xs text-slate-500 mb-1">Confirmation Code</p>
      <p class="text-lg font-black text-indigo-600 tracking-wider mb-4">${orderId}</p>
      <div class="bg-slate-50 p-4 rounded-xl text-left space-y-2 text-xs">
        <div class="flex justify-between"><span class="text-slate-500">Status:</span><span class="font-bold text-emerald-600">Paid & Confirmed</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Total Charged:</span><span class="font-bold text-slate-800">$${total}</span></div>
      </div>
    `;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('order-success-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    navigateToView('home');
  }
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `bg-indigo-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold pointer-events-auto animate-slide-in-right`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function showLoadingSkeletons() {
  const featured = document.getElementById('featured-products-grid');
  const shop = document.getElementById('shop-products-grid');
  const html = Array(6).fill(0).map(() => `
    <div class="bg-white rounded-2xl border p-4 space-y-4">
      <div class="h-48 rounded-xl skeleton"></div>
      <div class="h-4 w-3/4 rounded skeleton"></div>
    </div>
  `).join('');
  if (featured) featured.innerHTML = html;
  if (shop) shop.innerHTML = html;
}
