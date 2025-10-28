document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    // ⚠️ CAMBIA ESTAS DOS LÍNEAS
    const TU_NUMERO_WHATSAPP = "529633870587 "; // Tu número con código de país
    const API_URL_PRODUCTOS = "https://api.npoint.io/1ba7e8caf1054587677b"; // Tu URL de n:point

    // --- BASE DE DATOS Y ESTADO ---
    let db = {
        products: []
    };
    let cart = {}; // { productId: quantity }

    // --- SELECTORES DEL DOM ---
    const productListEl = document.getElementById("product-list");
    const cartItemsEl = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");

    /**
     * 1. Carga los productos desde la API (n:point)
     */
    async function loadProducts() {
        try {
            // Usamos 'cache: no-store' para evitar que el navegador guarde
            // una versión vieja y siempre obtener la más reciente.
            const response = await fetch(API_URL_PRODUCTOS, { cache: 'no-store' });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            db.products = await response.json();
            renderProducts();
        } catch (error) {
            console.error("Error al cargar productos:", error);
            productListEl.innerHTML = "<p>Error al cargar los productos. Intenta recargar la página.</p>";
        }
    }

    /**
     * 2. Renderiza los productos en la página
     */
    function renderProducts() {
        productListEl.innerHTML = ""; // Limpiar lista
        
        if (!db.products || db.products.length === 0) {
            productListEl.innerHTML = "<p>No hay productos disponibles en este momento.</p>";
            return;
        }

        db.products.forEach((product) => {
            const productHtml = `
                <div class="product-card">
                    <img src="${product.image || ''}" alt="${product.name}">
                    <h4>${product.name}</h4>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        Agregar
                    </button>
                </div>
            `;
            productListEl.innerHTML += productHtml;
        });

        // Añadir listeners a los botones "Agregar"
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = parseInt(event.target.dataset.id);
                addToCart(id);
            });
        });
    }

    /**
     * 3. Añade un producto al carrito
     */
    function addToCart(productId) {
        if (cart[productId]) {
            cart[productId]++;
        } else {
            cart[productId] = 1;
        }
        renderCart();
    }

    /**
     * 4. Renderiza el carrito
     */
    function renderCart() {
        cartItemsEl.innerHTML = "";
        let total = 0;
        const productIds = Object.keys(cart);

        if (productIds.length === 0) {
            cartItemsEl.innerHTML = "<p>Tu carrito está vacío.</p>";
            cartTotalEl.textContent = "0.00";
            return;
        }

        productIds.forEach(id => {
            const product = db.products.find(p => p.id == id);
            const quantity = cart[id];
            
            if (product) {
                const subtotal = product.price * quantity;
                total += subtotal;
                const cartItemHtml = `
                    <div class="cart-item">
                        <span>${product.name} (x${quantity})</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                `;
                cartItemsEl.innerHTML += cartItemHtml;
            }
        });

        cartTotalEl.textContent = total.toFixed(2);
    }

    /**
     * 5. Maneja el clic en "Realizar Pedido"
     */
    function handleCheckout() {
        if (Object.keys(cart).length === 0) {
            alert("Tu carrito está vacío. Añade productos antes de continuar.");
            return;
        }

        let message = "¡Hola! 👋 Me gustaría hacer el siguiente pedido:\n\n";
        let total = 0;

        Object.keys(cart).forEach(id => {
            const product = db.products.find(p => p.id == id);
            const quantity = cart[id];
            if (product) {
                const subtotal = product.price * quantity;
                total += subtotal;
                message += `* ${product.name} (x${quantity}) - $${subtotal.toFixed(2)}\n`;
            }
        });

        message += `\n*Total del Pedido: $${total.toFixed(2)}*`;
        message += "\n\n(Por favor, confírmame el pedido)";
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${TU_NUMERO_WHATSAPP}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
    }

    // --- INICIALIZACIÓN ---
    loadProducts(); 
    checkoutBtn.addEventListener('click', handleCheckout);
});
