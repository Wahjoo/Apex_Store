/**
 * Add-to-Cart Page Logic (cart.html)
 * Uses direct API images with referrerpolicy="no-referrer"
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCartView();
});

function renderCartView() {
  const container = document.getElementById('cart-items-container');
  const summaryContainer = document.getElementById('cart-summary-container');
  if (!container || !summaryContainer) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
        <div class="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
        <p class="text-slate-500 mb-6 text-sm">Looks like you haven't added any products to your cart yet.</p>
        <a href="shop.html" class="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
          Start Shopping Now
        </a>
      </div>
    `;
    summaryContainer.innerHTML = '';
    return;
  }

  // Render Cart Items List
  container.innerHTML = `
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 class="text-xl font-bold text-slate-900">Cart Items (${cart.length})</h2>
        <button onclick="handleClearAllCart()" class="text-xs text-rose-600 hover:text-rose-700 font-bold transition">Clear All</button>
      </div>

      <div class="divide-y divide-slate-100">
        ${cart.map(item => {
          const p = item.product;
          const lineTotal = p.price * item.quantity;
          const pImg = p.images && p.images[0] ? p.images[0] : DEFAULT_FALLBACK_IMAGE;
          return `
            <div class="p-6 flex flex-col sm:flex-row items-center gap-6 cart-item-row">
              <img src="${pImg}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-24 h-24 object-cover rounded-2xl flex-shrink-0 bg-slate-100" />
              
              <div class="flex-1 min-w-0 text-center sm:text-left">
                <a href="product.html?id=${p.id}" class="font-bold text-slate-800 text-base mb-1 hover:text-indigo-600 transition block truncate">${p.title}</a>
                <p class="text-xs text-slate-400 mb-2">Unit Price: <span class="font-semibold text-slate-600">$${p.price}</span></p>
                
                <div class="flex items-center justify-center sm:justify-start gap-4">
                  <div class="flex items-center border border-slate-200 rounded-lg bg-white p-1">
                    <button onclick="handleUpdateQty(${p.id}, -1)" class="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md font-bold qty-btn">-</button>
                    <span class="w-10 text-center font-bold text-slate-800 text-sm">${item.quantity}</span>
                    <button onclick="handleUpdateQty(${p.id}, 1)" class="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md font-bold qty-btn">+</button>
                  </div>
                  
                  <button onclick="handleRemoveItem(${p.id})" class="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Remove
                  </button>
                </div>
              </div>

              <div class="text-right">
                <span class="text-xs text-slate-400 block font-medium">Subtotal</span>
                <span class="text-lg font-extrabold text-slate-900">$${lineTotal}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Render Cost Summary
  const subtotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  summaryContainer.innerHTML = `
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
      <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Order Summary</h3>
      
      <div class="space-y-3 text-sm">
        <div class="flex justify-between text-slate-600">
          <span>Items Subtotal</span>
          <span class="font-bold text-slate-800">$${subtotal}</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>Estimated Shipping</span>
          <span class="font-bold text-slate-800">${shipping === 0 ? '<span class="text-emerald-600">FREE</span>' : '$' + shipping}</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>Estimated Sales Tax (8%)</span>
          <span class="font-bold text-slate-800">$${tax}</span>
        </div>
      </div>

      <div class="border-t border-slate-100 pt-4 flex justify-between items-baseline">
        <span class="text-base font-bold text-slate-900">Total</span>
        <span class="text-2xl font-black text-indigo-600">$${total}</span>
      </div>

      <a href="checkout.html" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition active:scale-95">
        Proceed to Checkout
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </a>

      <div class="text-center pt-2">
        <span class="text-xs text-slate-400 flex items-center justify-center gap-1">
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          256-Bit Bank Level Encryption
        </span>
      </div>
    </div>
  `;
}

function handleUpdateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    handleRemoveItem(productId);
    return;
  }

  saveCart(cart);
  renderCartView();
}

function handleRemoveItem(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  renderCartView();
  showToast('Item removed from cart', 'info');
}

function handleClearAllCart() {
  saveCart([]);
  renderCartView();
}
