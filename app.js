// ==================== STATE MANAGEMENT ====================
let cart = [];
let products = [];

// ==================== API ENDPOINT ====================
const API_ENDPOINT = 'https://api.npoint.io/1ba7e8caf1054587677b';

// ==================== FETCH PRODUCTS ====================
async function fetchProducts() {
  try {
    showLoading();
    
    // Agregar timestamp para evitar cache
    const cacheBuster = `?t=${Date.now()}`;
    const response = await fetch(API_ENDPOINT + cacheBuster);
    
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }
    
    const data = await response.json();
    
    // Validar que los productos tengan los campos necesarios
    products = data.filter(product => 
      product.id && 
      product.name && 
      typeof product.price === 'number' && 
      product.image
    ).map(product => ({
      ...product,
      description: product.description || ""
    }));
    
    if (products.length === 0) {
      console.warn('No hay productos validos, cargando datos de ejemplo');
      loadMockData();
      return;
    }
    
    renderProducts();
    hideLoading();
    
  } catch (error) {
    console.error('Error al cargar de API, usando datos de ejemplo:', error);
    loadMockData();
  }
}

// ==================== RENDER PRODUCTS ====================
function renderProducts() {
  const grid = document.getElementById('products-grid');
  grid.style.display = 'grid';
  grid.innerHTML = '';
  
  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

// ==================== CREATE PRODUCT CARD ====================
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Mostrar descripcion si existe
  const descriptionHTML = product.description 
    ? `<p class="product-description">${product.description}</p>` 
    : '';
  
  card.innerHTML = `
    <div class="product-image-container">
      <img 
        src="${product.image}" 
        alt="${product.name}" 
        class="product-image"
        loading="lazy"
      />
    </div>
    <div class="product-info">
      <h3 class="product-name">${product.name}</h3>
      ${descriptionHTML}
      <div class="product-price">$${product.price}</div>
      <button 
        class="add-to-cart-btn" 
        onclick="addToCart(${product.id})"
      >
        Agregar al Carrito
      </button>
    </div>
  `;
  
  return card;
}

// ==================== ADD TO CART ====================
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }
  
  updateCart();
  showCartSummary();
}

// ==================== UPDATE CART ====================
function updateCart() {
  updateCartSummary();
  renderCartItems();
}

// ==================== UPDATE CART SUMMARY (Bottom Bar) ====================
function updateCartSummary() {
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  document.getElementById('cart-total-amount').textContent = totalAmount;
  document.getElementById('cart-item-count').textContent = totalItems;
  document.getElementById('cart-modal-total').textContent = totalAmount;
}

// ==================== SHOW CART SUMMARY ====================
function showCartSummary() {
  const cartSummary = document.getElementById('cart-summary');
  if (cart.length > 0) {
    cartSummary.style.display = 'block';
  } else {
    cartSummary.style.display = 'none';
  }
}

// ==================== RENDER CART ITEMS ====================
function renderCartItems() {
  const cartItemsContainer = document.getElementById('cart-items');
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h3>Tu carrito esta vacio</h3>
        <p>Agrega productos para continuar</p>
      </div>
    `;
    return;
  }
  
  cartItemsContainer.innerHTML = '';
  
  cart.forEach(item => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    
    // Mostrar descripcion si existe y es corta
    const descriptionHTML = item.description 
      ? `<p class="cart-item-description">${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</p>` 
      : '';
    
    cartItem.innerHTML = `
      <img 
        src="${item.image}" 
        alt="${item.name}" 
        class="cart-item-image"
      />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${descriptionHTML}
        <div class="cart-item-price">$${item.price}</div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
          <span class="quantity-display">${item.quantity}</span>
          <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
        </div>
      </div>
      <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
        🗑️
      </button>
    `;
    
    cartItemsContainer.appendChild(cartItem);
  });
}

// ==================== INCREASE QUANTITY ====================
function increaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity += 1;
    updateCart();
  }
}

// ==================== DECREASE QUANTITY ====================
function decreaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      removeFromCart(productId);
      return;
    }
    updateCart();
  }
}

// ==================== REMOVE FROM CART ====================
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCart();
  showCartSummary();
}

// ==================== OPEN CART MODAL ====================
function openCart() {
  const cartModal = document.getElementById('cart-modal');
  cartModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ==================== CLOSE CART MODAL ====================
function closeCart() {
  const cartModal = document.getElementById('cart-modal');
  cartModal.classList.remove('active');
  document.body.style.overflow = '';
}

// ==================== CLOSE CART ON BACKDROP CLICK ====================
function closeCartOnBackdrop(event) {
  if (event.target.id === 'cart-modal') {
    closeCart();
  }
}

// ==================== COMPLETE ORDER ====================
function completeOrder() {
  if (cart.length === 0) {
    alert('Tu carrito esta vacio');
    return;
  }
  
  // Generar mensaje para WhatsApp
  let message = '🍕 *Nuevo Pedido*\n\n';
  
  cart.forEach(item => {
    message += `• ${item.name}\n`;
    message += `  Cantidad: ${item.quantity}\n`;
    message += `  Precio: $${item.price * item.quantity}\n\n`;
  });
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  message += `*Total: $${total}*`;
  
  // Codificar mensaje para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Numero de WhatsApp (CAMBIA ESTE NUMERO)
  const whatsappNumber = '9633870587';
  
  // Abrir WhatsApp
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  window.open(whatsappURL, '_blank');
}

// ==================== LOADING STATE ====================
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('products-grid').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

// ==================== LOAD MOCK DATA (FALLBACK) ====================
function loadMockData() {
  products = [
    {
      id: 1,
      name: "Pizza Margherita",
      price: 120,
      image: "https://i.imgur.com/2DsA3bT.jpeg",
      description: "Pizza clasica con salsa de tomate, mozzarella fresca y albahaca."
    },
    {
      id: 2,
      name: "Pizza Pepperoni",
      price: 140,
      image: "https://i.imgur.com/sScttJm.jpeg",
      description: "Nuestra pizza mas popular, cubierta con abundante pepperoni."
    },
    {
      id: 3,
      name: "Refresco",
      price: 25,
      image: "https://i.imgur.com/vT29nI5.jpeg",
      description: "Botella de 600ml. Elige tu sabor."
    },
    {
      id: 4,
      name: "Postre de Chocolate",
      price: 50,
      image: "https://i.imgur.com/M6c2TjC.jpeg",
      description: ""
    }
  ];
  
  renderProducts();
  hideLoading();
}

// ==================== INITIALIZE APP ====================
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
});