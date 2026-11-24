'use strict';

let products = [];
let cart = loadCart();
let currentCategory = 'todos';
let searchTerm = '';

// 1. Carga de Productos desde la API (MongoDB)
async function fetchProducts() {
  try {
    const response = await fetch('/api/productos');
    if (!response.ok) throw new Error('Error en la respuesta del servidor');

    products = await response.json();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error('Error cargando productos:', error);
    const grid = document.getElementById('product-grid');
    if (grid) {
      grid.innerHTML = '<p class="error">No se pudieron cargar los productos. Verifica que server.js esté encendido.</p>';
    }
  }
}

// 2. Renderizar Tarjetas de Productos
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const emptyResults = document.getElementById('empty-results');
  const resultsLabel = document.getElementById('results-label');
  if (!grid) return;

  const filtered = products.filter(p => {
    const matchesCategory = currentCategory === 'todos' || p.category === currentCategory;
    const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (resultsLabel) {
    resultsLabel.textContent = `Mostrando ${filtered.length} producto(s)`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyResults) emptyResults.classList.add('visible');
    return;
  }

  if (emptyResults) emptyResults.classList.remove('visible');

  grid.innerHTML = filtered.map(p => `
    <article class="product-card" data-id="${p.id}">
      <div class="product-image-wrap">
        <span class="product-category">${p.categoryName || p.category}</span>
        <img src="${p.image}" alt="${p.title}" class="product-image" loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.title}</h3>
        <p class="product-price">S/ ${parseFloat(p.price).toFixed(2)} <small>/ ${p.unit}</small></p>
        <button class="add-button" type="button" onclick="addToCart('${p.id}')">Agregar al pedido</button>
      </div>
    </article>
  `).join('');
}

// 3. Manejo del Carrito
function loadCart() {
  const saved = localStorage.getItem('bodega_cart');
  return saved ? JSON.parse(saved) : [];
}

function saveCart() {
  localStorage.setItem('bodega_cart', JSON.stringify(cart));
}

function clearCart() {
  cart = [];
  localStorage.removeItem('bodega_cart');
  renderCart();
}

function addToCart(productId) {
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;

  const existingItem = cart.find(item => String(item.id) === String(productId));
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast(`Agregado: ${product.title}`);
}

function changeQuantity(productId, delta) {
  const itemIndex = cart.findIndex(item => String(item.id) === String(productId));
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
    renderCart();
  }
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');
  const checkoutBtn = document.getElementById('checkout-button');

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalItems;
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

  if (cartContainer) {
    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="cart-empty">
          <i class="fa-solid fa-basket-shopping"></i>
          <strong>Tu pedido está vacío</strong>
          <span>Agrega productos del catálogo para armar tu lista.</span>
        </div>`;
    } else {
      cartContainer.innerHTML = cart.map(item => `
        <div class="cart-line">
          <img src="${item.image}" alt="${item.title}">
          <div>
            <span class="cart-line-title">${item.title}</span>
            <span class="cart-line-price">S/ ${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
          </div>
          <div class="quantity">
            <button type="button" onclick="changeQuantity('${item.id}', -1)">-</button>
            <span>${item.quantity}</span>
            <button type="button" onclick="changeQuantity('${item.id}', 1)">+</button>
            
          </div>
        </div>
      `).join('');
    }
  }

  if (cartTotal) {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotal.textContent = `S/ ${total.toFixed(2)}`;
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// 4. Eventos de interfaz (Carrito, Métodos de pago con QR y enlace, Admin, Filtros y Buscador)
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();

  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const openBtn = document.getElementById('open-cart');
  const closeBtn = document.getElementById('close-cart');
  const clearCartBtn = document.getElementById('clear-cart');
  const checkoutBtn = document.getElementById('checkout-button');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const yearSpan = document.getElementById('year');

  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  const toggleCart = (open) => {
    drawer?.classList.toggle('open', open);
    overlay?.classList.toggle('open', open);
    document.body.classList.toggle('locked', open);
  };

  openBtn?.addEventListener('click', () => toggleCart(true));
  closeBtn?.addEventListener('click', () => toggleCart(false));
  overlay?.addEventListener('click', () => toggleCart(false));

  clearCartBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;
    clearCart();
    showToast('Carrito vaciado');
  });

  menuToggle?.addEventListener('click', () => {
    const isOpen = navLinks?.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      currentCategory = btn.dataset.category;
      renderProducts();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });

  // --- MÉTODOS DE PAGO, QR Y BOTÓN IR A YAPE/PLIN ---
  const paymentSelect = document.getElementById('payment-method');
  const paymentHint = document.getElementById('payment-hint');
  const qrContainer = document.getElementById('qr-container');
  const qrImage = document.getElementById('qr-image');
  const qrBadge = document.getElementById('qr-badge');
  const copyPhoneBtn = document.getElementById('copy-phone-btn');
  const openAppBtn = document.getElementById('open-app-btn');

  copyPhoneBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText('931046601');
    showToast('Número 931 046 601 copiado');
  });

  const paymentConfig = {
    Efectivo: {
      hint: 'Pagarás en efectivo al recibir tu pedido.',
      showQr: false
    },
    Yape: {
      hint: 'Escanea el QR o copia el número, yapea y adjunta tu captura en WhatsApp.',
      showQr: true,
      badge: 'Paga con Yape',
      appLabel: 'Ir a Yape',
      appUrl: 'https://www.yape.com.pe',
      isPlin: false,
      localImg: 'yape.jpeg',
      fallbackImg: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=742284&data=Yape-GladysVicenteSantos-931046601'
    },
    Plin: {
      hint: 'Escanea el QR o copia el número, plinea y adjunta tu captura en WhatsApp.',
      showQr: true,
      badge: 'Paga con Plin',
      appLabel: 'Ir a Plin',
      appUrl: 'https://plin.pe',
      isPlin: true,
      localImg: 'qr-plin.png',
      fallbackImg: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0099a8&data=Plin-GladysVicenteSantos-931046601'
    },
    Transferencia: {
      hint: 'Solicita el número de cuenta BCP / Interbank al confirmar por WhatsApp.',
      showQr: false
    }
  };

  paymentSelect?.addEventListener('change', (e) => {
    const config = paymentConfig[e.target.value];
    if (!config) return;

    if (paymentHint) paymentHint.textContent = config.hint;

    if (qrContainer && qrImage && qrBadge) {
      if (config.showQr) {
        qrContainer.style.display = 'flex';
        qrBadge.textContent = config.badge;
        qrBadge.classList.toggle('plin', config.isPlin);

        if (openAppBtn) {
          openAppBtn.innerHTML = `<i class="fa-solid fa-mobile-screen-button"></i> ${config.appLabel}`;
          openAppBtn.href = config.appUrl;
          openAppBtn.classList.toggle('plin', config.isPlin);
        }

        qrImage.onerror = () => {
          qrImage.onerror = null;
          qrImage.src = config.fallbackImg;
        };
        qrImage.src = config.localImg;
      } else {
        qrContainer.style.display = 'none';
      }
    }
  });

  // Realizar pedido: abre Yape/Plin si corresponde, envía el detalle a WhatsApp y vacía el carrito
  checkoutBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;

    const lines = cart.map(i => `- ${i.quantity}x ${i.title} (S/ ${(i.price * i.quantity).toFixed(2)})`).join('\n');
    const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2);
    const metodoPago = paymentSelect ? paymentSelect.value : 'Efectivo';

    if (metodoPago === 'Yape') {
      window.open('https://www.yape.com.pe', '_blank');
    } else if (metodoPago === 'Plin') {
      window.open('https://plin.pe', '_blank');
    }

    const msg = encodeURIComponent(
      `Hola Bodega July, quiero hacer este pedido:\n\n${lines}\n\nTotal estimado: S/ ${total}\nMétodo de pago: ${metodoPago}`
    );

    window.open(`https://wa.me/51931046601?text=${msg}`, '_blank');

    clearCart();
    toggleCart(false);
    showToast('¡Pedido enviado! Tu carrito quedó listo para una nueva compra.');
  });

  // --- PANEL ADMINISTRADORA ---
  const adminModal = document.getElementById('admin-modal');
  const adminOverlay = document.getElementById('admin-overlay');
  const openAdminBtn = document.getElementById('open-admin-btn');
  const closeAdminBtn = document.getElementById('close-admin');
  const loginForm = document.getElementById('admin-login-form');
  const productForm = document.getElementById('admin-product-form');
  const loginError = document.getElementById('admin-login-error');
  const modalTitle = document.getElementById('admin-modal-title');
  const logoutBtn = document.getElementById('admin-logout-btn');

  function updateAdminUI() {
    const token = sessionStorage.getItem('bodega_admin_token');
    if (token) {
      loginForm.style.display = 'none';
      productForm.style.display = 'grid';
      modalTitle.innerHTML = '<i class="fa-solid fa-box-open"></i> Agregar Producto';
    } else {
      loginForm.style.display = 'grid';
      productForm.style.display = 'none';
      modalTitle.innerHTML = '<i class="fa-solid fa-user-shield"></i> Acceso Administradora';
    }
  }

  const toggleAdmin = (open) => {
    updateAdminUI();
    adminModal?.classList.toggle('open', open);
    adminOverlay?.classList.toggle('open', open);
    document.body.classList.toggle('locked', open);
  };

  openAdminBtn?.addEventListener('click', () => toggleAdmin(true));
  closeAdminBtn?.addEventListener('click', () => toggleAdmin(false));
  adminOverlay?.addEventListener('click', () => toggleAdmin(false));

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const usuario = document.getElementById('admin-user').value.trim();
    const password = document.getElementById('admin-pass').value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        sessionStorage.setItem('bodega_admin_token', data.token);
        loginForm.reset();
        updateAdminUI();
        showToast('Bienvenida, administradora');
      } else {
        loginError.textContent = data.error || 'Datos incorrectos';
      }
    } catch {
      loginError.textContent = 'Error de conexión con el servidor.';
    }
  });

  productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('bodega_admin_token');
    const catSelect = document.getElementById('prod-category');
    const selectedOption = catSelect.options[catSelect.selectedIndex];

    const nuevoProducto = {
      title: document.getElementById('prod-title').value.trim(),
      category: catSelect.value,
      categoryName: selectedOption.dataset.name,
      price: parseFloat(document.getElementById('prod-price').value),
      unit: document.getElementById('prod-unit').value.trim(),
      image: document.getElementById('prod-image').value.trim()
    };

    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(nuevoProducto)
      });

      if (res.ok) {
        productForm.reset();
        toggleAdmin(false);
        await fetchProducts();
        showToast('¡Producto agregado al catálogo!');
      } else {
        showToast('Error al guardar el producto');
      }
    } catch {
      showToast('No se pudo conectar con el servidor');
    }
  });

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('bodega_admin_token');
    updateAdminUI();
    showToast('Sesión cerrada');
  });
});