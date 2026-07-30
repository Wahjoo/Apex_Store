/**
 * Individual Product Page Logic (product.html)
 * Uses direct API images with referrerpolicy="no-referrer"
 */

let currentProduct = null;
let currentQuantity = 1;
let currentSelectedImage = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get('id')) || 1;
  await loadProductDetail(productId);
});

async function loadProductDetail(id) {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    const rawData = await res.json();
    currentProduct = cleanProductData(rawData, id);
    currentQuantity = 1;
    currentSelectedImage = currentProduct.images[0];

    // Fetch related products from same category
    let relatedProducts = [];
    if (currentProduct.category && currentProduct.category.id) {
      const catRes = await fetch(`${API_BASE_URL}/products?categoryId=${currentProduct.category.id}`);
      const catData = await catRes.json();
      relatedProducts = catData
        .map((p, i) => cleanProductData(p, i))
        .filter(p => p.id !== currentProduct.id)
        .slice(0, 4);
    }

    renderProductView(currentProduct, relatedProducts);
  } catch (err) {
    console.error('Error fetching product details:', err);
    container.innerHTML = `
      <div class="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h2>
        <p class="text-slate-500 mb-6 text-sm">The product you are looking for does not exist or has been removed.</p>
        <a href="shop.html" class="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">Return to Shop</a>
      </div>
    `;
  }
}

function renderProductView(product, related) {
  const container = document.getElementById('product-detail-container');
  const catName = product.category ? product.category.name : 'General';

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <!-- Product Image Gallery Component -->
      <div class="space-y-4">
        <div class="h-96 md:h-[480px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shadow-md relative">
          <img id="main-product-gallery-img" src="${currentSelectedImage}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-full h-full object-cover transition duration-300 gallery-main-img" />
          <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
            ${catName}
          </span>
        </div>

        <!-- Gallery Thumbnails -->
        <div class="grid grid-cols-4 gap-4">
          ${product.images.map((imgUrl, idx) => `
            <button onclick="selectGalleryImage('${imgUrl}', this)" class="detail-thumb-btn gallery-thumb h-24 rounded-2xl overflow-hidden border-2 ${imgUrl === currentSelectedImage ? 'gallery-thumb-active' : 'border-transparent opacity-70'} transition">
              <img src="${imgUrl}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-full h-full object-cover" />
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Product Details & Actions -->
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

          <!-- Key Features List -->
          <div class="space-y-3 mb-8">
            <div class="flex items-center gap-3 text-slate-700 text-sm">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Premium high-durability craftsmanship</span>
            </div>
            <div class="flex items-center gap-3 text-slate-700 text-sm">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Free standard delivery on orders over $50</span>
            </div>
            <div class="flex items-center gap-3 text-slate-700 text-sm">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>30-day effortless return guarantee</span>
            </div>
          </div>
        </div>

        <!-- Quantity Picker & Add to Cart -->
        <div class="space-y-4 pt-4 border-t border-slate-100">
          <div class="flex items-center gap-4">
            <span class="text-sm font-bold text-slate-700">Quantity:</span>
            <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
              <button onclick="changeProductQty(-1)" class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold transition">-</button>
              <span id="product-qty-val" class="w-12 text-center font-bold text-slate-800">1</span>
              <button onclick="changeProductQty(1)" class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold transition">+</button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <button onclick="handleAddCurrentToCart()" class="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition transform active:scale-95">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              Add to Cart
            </button>
            <button onclick="handleBuyNow()" class="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-base transition">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Products -->
    ${related.length > 0 ? `
      <div class="mt-20 pt-12 border-t border-slate-200">
        <h2 class="text-2xl font-bold text-slate-900 mb-8">Related Products You Might Like</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${related.map(p => `
            <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
              <a href="product.html?id=${p.id}" class="relative h-48 overflow-hidden bg-slate-50 block">
                <img src="${p.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </a>
              <div class="p-4 flex-1 flex flex-col justify-between">
                <a href="product.html?id=${p.id}" class="font-bold text-slate-800 text-sm mb-1 hover:text-indigo-600 transition block truncate">${p.title}</a>
                <span class="text-base font-extrabold text-slate-900">$${p.price}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function selectGalleryImage(imgUrl, btnElem) {
  currentSelectedImage = imgUrl;
  const mainImg = document.getElementById('main-product-gallery-img');
  if (mainImg) mainImg.src = imgUrl;

  document.querySelectorAll('.detail-thumb-btn').forEach(btn => {
    btn.classList.remove('gallery-thumb-active');
    btn.classList.add('border-transparent', 'opacity-70');
  });
  btnElem.classList.remove('border-transparent', 'opacity-70');
  btnElem.classList.add('gallery-thumb-active');
}

function changeProductQty(delta) {
  currentQuantity = Math.max(1, currentQuantity + delta);
  const qtyElem = document.getElementById('product-qty-val');
  if (qtyElem) qtyElem.textContent = currentQuantity;
}

function handleAddCurrentToCart() {
  if (currentProduct) {
    addToCart(currentProduct, currentQuantity);
  }
}

function handleBuyNow() {
  if (currentProduct) {
    addToCart(currentProduct, currentQuantity);
    window.location.href = 'cart.html';
  }
}
