/**
 * Shop Catalog Page Logic (shop.html)
 * Filters test products and placehold.co images.
 */

let shopProducts = [];
let filteredProducts = [];
let shopCategories = [];
let selectedCategory = 'all';
let searchQuery = '';
let priceMax = 1000;
let currentSort = 'featured';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) selectedCategory = catParam;

  showShopSkeletons();
  await loadShopCategories();
  await loadShopProducts();
  setupShopFilters();
});

async function loadShopCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const data = await res.json();
    
    shopCategories = data.filter(cat => 
      cat.name && 
      !cat.name.includes('Config-') && 
      !cat.name.includes('updatedName') && 
      cat.name.trim().length <= 25
    ).slice(0, 5);

    renderShopCategoriesSidebar();
  } catch (err) {
    console.error('Error loading shop categories:', err);
  }
}

async function loadShopProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    const data = await res.json();
    
    const realProducts = data.filter(p => isRealProduct(p));
    shopProducts = realProducts.map((p, i) => cleanProductData(p, i));
    applyShopFilters();
  } catch (err) {
    console.error('Error loading shop products:', err);
  }
}

function renderShopCategoriesSidebar() {
  const list = document.getElementById('shop-category-list');
  if (!list) return;

  list.innerHTML = `
    <li onclick="filterShopByCategory('all')" class="cursor-pointer py-1.5 px-3 rounded-lg text-sm font-medium ${selectedCategory === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}">
      All Categories
    </li>
    ${shopCategories.map(cat => `
      <li onclick="filterShopByCategory('${cat.id}')" class="cursor-pointer py-1.5 px-3 rounded-lg text-sm font-medium ${selectedCategory == cat.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}">
        ${cat.name}
      </li>
    `).join('')}
  `;
}

function filterShopByCategory(catId) {
  selectedCategory = catId;
  renderShopCategoriesSidebar();
  applyShopFilters();
}

function setupShopFilters() {
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyShopFilters();
    });
  }

  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyShopFilters();
    });
  }

  const priceSlider = document.getElementById('price-range-slider');
  const priceVal = document.getElementById('price-range-value');
  if (priceSlider && priceVal) {
    priceSlider.addEventListener('input', (e) => {
      priceMax = parseInt(e.target.value);
      priceVal.textContent = `$${priceMax}`;
      applyShopFilters();
    });
  }
}

function applyShopFilters() {
  let list = [...shopProducts];

  if (selectedCategory !== 'all') {
    list = list.filter(p => p.category && p.category.id == selectedCategory);
  }

  if (searchQuery) {
    list = list.filter(p => p.title.toLowerCase().includes(searchQuery) || p.description.toLowerCase().includes(searchQuery));
  }

  list = list.filter(p => p.price <= priceMax);

  if (currentSort === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  filteredProducts = list;
  renderShopGrid();
}

function renderShopGrid() {
  const container = document.getElementById('shop-products-grid');
  const countLabel = document.getElementById('shop-results-count');
  if (!container) return;

  if (countLabel) countLabel.textContent = `Showing ${filteredProducts.length} items`;

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-1">No products found</h3>
        <p class="text-slate-500 text-sm mb-4">Try adjusting your filters or search keywords.</p>
        <button onclick="resetShopFilters()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredProducts.map(p => `
    <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      <a href="product.html?id=${p.id}" class="relative h-60 overflow-hidden bg-slate-50 block">
        <img src="${p.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
          ${p.category ? p.category.name : 'General'}
        </span>
      </a>

      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-1 text-amber-400 text-xs mb-2">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
            <span class="font-bold text-slate-700 ml-1">${p.rating}</span>
            <span class="text-slate-400">(${p.reviewCount})</span>
          </div>

          <a href="product.html?id=${p.id}" class="font-bold text-slate-800 text-base mb-1 hover:text-indigo-600 transition block line-clamp-1">
            ${p.title}
          </a>
          <p class="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            ${p.description}
          </p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span class="text-xs text-slate-400 block font-medium">Price</span>
            <span class="text-xl font-extrabold text-slate-900">$${p.price}</span>
          </div>
          <button onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")}, 1)' class="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function resetShopFilters() {
  selectedCategory = 'all';
  searchQuery = '';
  priceMax = 1000;
  currentSort = 'featured';

  const priceSlider = document.getElementById('price-range-slider');
  if (priceSlider) priceSlider.value = 1000;
  const priceVal = document.getElementById('price-range-value');
  if (priceVal) priceVal.textContent = '$1000';

  renderShopCategoriesSidebar();
  applyShopFilters();
}

function showShopSkeletons() {
  const shop = document.getElementById('shop-products-grid');
  if (!shop) return;
  shop.innerHTML = Array(6).fill(0).map(() => `
    <div class="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
      <div class="h-48 rounded-xl skeleton"></div>
      <div class="h-4 w-3/4 rounded skeleton"></div>
      <div class="h-4 w-1/2 rounded skeleton"></div>
      <div class="flex justify-between items-center pt-2">
        <div class="h-6 w-16 rounded skeleton"></div>
        <div class="h-8 w-24 rounded-lg skeleton"></div>
      </div>
    </div>
  `).join('');
}
