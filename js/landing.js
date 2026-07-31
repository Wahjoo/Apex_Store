/**
 * Landing Page Logic (index.html)
 * Filters test products and placehold.co images.
 */

document.addEventListener('DOMContentLoaded', async () => {
  showLandingSkeletons();
  await loadLandingCategories();
  await loadLandingFeaturedProducts();
});

async function loadLandingCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const categories = await res.json();

    const topCategories = categories
      .filter(cat => isValidCategory(cat))
      .slice(0, 5);

    const pillsContainer = document.getElementById('category-pills-container');
    if (pillsContainer) {
      pillsContainer.innerHTML = `
        <a href="shop.html" class="category-pill bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition">
          All Items
        </a>
        ${topCategories.map(cat => `
          <a href="shop.html?category=${cat.id}" class="category-pill bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2.5 rounded-full font-medium text-sm transition">
            ${cat.name}
          </a>
        `).join('')}
      `;
    }

    const gridContainer = document.getElementById('landing-categories-grid');
    if (gridContainer) {
      gridContainer.innerHTML = topCategories.map(cat => {
        const catImg = cleanExactApiImageUrl(cat.image);
        return `
          <a href="shop.html?category=${cat.id}" class="group relative h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <img src="${catImg}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent flex items-end p-6">
              <div>
                <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white mb-2">Category</span>
                <h3 class="text-xl font-bold text-white group-hover:text-indigo-300 transition">${cat.name}</h3>
              </div>
            </div>
          </a>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading landing categories:', err);
  }
}

async function loadLandingFeaturedProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    const data = await res.json();
    
    // Filter out test products
    const realProducts = data.filter(p => isRealProduct(p));
    const products = realProducts.map((p, i) => cleanProductData(p, i)).slice(0, 8);

    const grid = document.getElementById('featured-products-grid');
    if (grid) {
      grid.innerHTML = products.map(product => `
        <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
          <a href="product.html?id=${product.id}" class="relative h-60 overflow-hidden bg-slate-50 block">
            <img src="${product.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
              ${product.category ? product.category.name : 'General'}
            </span>
          </a>

          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-1 text-amber-400 text-xs mb-2">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                <span class="font-bold text-slate-700 ml-1">${product.rating}</span>
                <span class="text-slate-400">(${product.reviewCount})</span>
              </div>

              <a href="product.html?id=${product.id}" class="font-bold text-slate-800 text-base mb-1 hover:text-indigo-600 transition block line-clamp-1">
                ${product.title}
              </a>
              <p class="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                ${product.description}
              </p>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <span class="text-xs text-slate-400 block font-medium">Price</span>
                <span class="text-xl font-extrabold text-slate-900">$${product.price}</span>
              </div>
              <button onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&apos;")}, 1)' class="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading featured products:', err);
  }
}

function showLandingSkeletons() {
  const featured = document.getElementById('featured-products-grid');
  if (!featured) return;
  featured.innerHTML = Array(8).fill(0).map(() => `
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
