document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    // ⚠️ CAMBIA ESTA LÍNEA
    const API_URL_PRODUCTOS = "https://api.npoint.io/1ba7e8caf1054587677b"; // Tu URL de n:point
    const DB_KEY = 'dbProductsDraft'; // Clave para guardar el borrador en localStorage

    // --- ESTADO INICIAL ---
    let db = {
        products: [] // Este es tu borrador local
    };

    // --- SELECTORES DEL DOM ---
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');
    const productTableBody = document.getElementById('product-table-body');
    const btnClear = document.getElementById('btn-clear');
    
    // Botones de la nube
    const btnSaveCloud = document.getElementById('btn-save-cloud');
    const btnLoadCloud = document.getElementById('btn-load-cloud');
    const statusMessageEl = document.getElementById('status-message');

    // --- FUNCIONES DE LA NUBE (API) ---

    /**
     * 1. Cargar productos desde n:point (API)
     */
    async function loadProductsFromCloud() {
        if (!confirm("¿Cargar datos desde la tienda? Esto sobrescribirá tu borrador local.")) {
            return;
        }
        showStatus("Cargando desde la tienda...", false);
        btnLoadCloud.disabled = true;

        try {
            const response = await fetch(API_URL_PRODUCTOS, { cache: 'no-store' });
            if (!response.ok) throw new Error("Error al cargar");
            
            db.products = await response.json();
            saveProductsToStorage(); // Guarda el borrador local
            renderProductTable();
            showStatus("Datos cargados y guardados como borrador.", true);
        } catch (error) {
            showStatus("Error al cargar datos: " + error.message, false);
        } finally {
            btnLoadCloud.disabled = false;
        }
    }

    /**
     * 2. Guardar productos en n:point (API)
     */
    async function saveProductsToCloud() {
        if (!confirm("¿Publicar cambios en la tienda? Esto reemplazará los productos actuales.")) {
            return;
        }
        showStatus("Publicando en la tienda...", false);
        btnSaveCloud.disabled = true;

        try {
            const response = await fetch(API_URL_PRODUCTOS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(db.products) // Envía la lista de borrador completa
            });

            if (!response.ok) {
                throw new Error("La respuesta del servidor no fue OK");
            }
            await response.json();
            showStatus("¡Éxito! Productos actualizados en la tienda.", true);
        } catch (error) {
            showStatus("Error al publicar: " + error.message, false);
        } finally {
            btnSaveCloud.disabled = false;
        }
    }
    
    /**
     * Muestra un mensaje de estado
     */
    function showStatus(message, isSuccess) {
        statusMessageEl.textContent = message;
        statusMessageEl.style.color = isSuccess ? "green" : "red";
    }

    // --- FUNCIONES LOCALES (BORRADOR) ---

    /**
     * 3. Cargar productos desde localStorage (Borrador)
     */
    function loadProductsFromStorage() {
        const storedProducts = localStorage.getItem(DB_KEY);
        if (storedProducts) {
            db.products = JSON.parse(storedProducts);
        }
    }

    /**
     * 4. Guardar productos en localStorage (Borrador)
     */
    function saveProductsToStorage() {
        localStorage.setItem(DB_KEY, JSON.stringify(db.products));
    }

    /**
     * 5. Renderiza la tabla de productos (Borrador)
     */
    function renderProductTable() {
        productTableBody.innerHTML = "";
        
        db.products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td class="actions">
                    <button class="btn-edit" data-id="${product.id}">Editar</button>
                    <button class="btn-delete" data-id="${product.id}">Borrar</button>
                </td>
            `;
            productTableBody.appendChild(tr);
        });

        // Listeners para botones de tabla
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => loadProductIntoForm(btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    }

    /**
     * 6. Limpia el formulario
     */
    function clearForm() {
        productIdInput.value = "";
        productNameInput.value = "";
        productPriceInput.value = "";
        productImageInput.value = "";
        productNameInput.focus();
    }

    /**
     * 7. Carga un producto en el formulario para editarlo
     */
    function loadProductIntoForm(id) {
        const product = db.products.find(p => p.id == id);
        if (product) {
            productIdInput.value = product.id;
            productNameInput.value = product.name;
            productPriceInput.value = product.price;
            productImageInput.value = product.image || '';
            window.scrollTo(0, 0);
            productNameInput.focus();
        }
    }

    /**
     * 8. Maneja el envío del formulario (Guardar en Borrador)
     */
    function handleFormSubmit(event) {
        event.preventDefault();
        
        const id = productIdInput.value;
        const productData = {
            name: productNameInput.value,
            price: parseFloat(productPriceInput.value),
            image: productImageInput.value
        };

        if (id) {
            // ACTUALIZAR BORRADOR
            const index = db.products.findIndex(p => p.id == id);
            if (index > -1) {
                db.products[index] = { ...db.products[index], ...productData };
            }
        } else {
            // CREAR EN BORRADOR
            const newId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : Date.now();
            db.products.push({ id: newId, ...productData });
        }
        
        saveProductsToStorage();
        renderProductTable();
        clearForm();
        showStatus("Borrador guardado localmente.", true);
    }

    /**
     * 9. Borra un producto (del Borrador)
     */
    function deleteProduct(id) {
        if (confirm("¿Borrar este producto de tu borrador?")) {
            db.products = db.products.filter(p => p.id != id);
            saveProductsToStorage();
            renderProductTable();
            clearForm();
            showStatus("Producto borrado del borrador.", true);
        }
    }

    // --- INICIALIZACIÓN ---
    loadProductsFromStorage(); // Carga el borrador al iniciar
    renderProductTable();
    
    // Listeners de formularios y botones
    productForm.addEventListener('submit', handleFormSubmit);
    btnClear.addEventListener('click', clearForm);
    btnSaveCloud.addEventListener('click', saveProductsToCloud);
    btnLoadCloud.addEventListener('click', loadProductsFromCloud);
});
