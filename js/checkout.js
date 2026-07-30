/**
 * Checkout Page Logic (checkout.html)
 * Uses direct API images with referrerpolicy="no-referrer"
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();
  setupCheckoutEvents();
});

function renderCheckoutSummary() {
  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  const container = document.getElementById('checkout-order-summary');
  if (!container) return;

  const subtotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  container.innerHTML = `
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 sticky top-28">
      <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Your Order Summary</h3>
      
      <div class="max-h-64 overflow-y-auto space-y-3 pr-2">
        ${cart.map(item => `
          <div class="flex items-center gap-3">
            <img src="${item.product.images[0]}" referrerpolicy="no-referrer" onerror="handleImageError(this)" class="w-12 h-12 object-cover rounded-xl bg-slate-100" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-slate-800 truncate">${item.product.title}</p>
              <p class="text-xs text-slate-400">Qty: ${item.quantity}</p>
            </div>
            <span class="text-xs font-extrabold text-slate-900">$${item.product.price * item.quantity}</span>
          </div>
        `).join('')}
      </div>

      <div class="space-y-2 text-xs border-t border-slate-100 pt-4">
        <div class="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span class="font-bold text-slate-800">$${subtotal}</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>Shipping</span>
          <span class="font-bold text-slate-800">${shipping === 0 ? 'FREE' : '$' + shipping}</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>Sales Tax</span>
          <span class="font-bold text-slate-800">$${tax}</span>
        </div>
      </div>

      <div class="border-t border-slate-100 pt-4 flex justify-between items-baseline">
        <span class="text-sm font-bold text-slate-900">Total Amount</span>
        <span class="text-2xl font-black text-indigo-600">$${total}</span>
      </div>
    </div>
  `;
}

function setupCheckoutEvents() {
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleOrderSubmission();
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

function handleOrderSubmission() {
  const submitBtn = document.getElementById('place-order-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing Secure Order...
    `;
  }

  setTimeout(() => {
    const cart = getCart();
    const subtotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 15;
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + shipping + tax;
    const orderId = 'APX-' + Math.floor(100000 + Math.random() * 900000);

    // Show Success Modal
    showOrderModal(orderId, total);

    // Reset Cart
    saveCart([]);
  }, 1200);
}

function showOrderModal(orderId, total) {
  const modal = document.getElementById('order-success-modal');
  const details = document.getElementById('modal-order-details');
  if (modal && details) {
    details.innerHTML = `
      <p class="text-xs text-slate-500 mb-1">Order Confirmation Code</p>
      <p class="text-lg font-black text-indigo-600 tracking-wider mb-4">${orderId}</p>
      <div class="bg-slate-50 p-4 rounded-xl text-left space-y-2 text-xs">
        <div class="flex justify-between"><span class="text-slate-500">Status:</span><span class="font-bold text-emerald-600">Paid & Confirmed</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Total Charged:</span><span class="font-bold text-slate-800">$${total}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Estimated Delivery:</span><span class="font-bold text-slate-800">3-5 Business Days</span></div>
      </div>
    `;
    modal.classList.remove('hidden');
    modal.classList.add('flex', 'animate-fade-in');
  }
}

function closeOrderModal() {
  const modal = document.getElementById('order-success-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    window.location.href = 'index.html';
  }
}
