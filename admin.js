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
  const productDescriptionInput = document.getElementById('product-description');
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

      const productos = await response.json();

      // 🔧 LIMPIEZA: Corrige imágenes vacías o inválidas y asegura que description existe
      db.products = productos.map(p => ({
        ...p,
        image: (p.image && p.image.trim() && p.image !== "...")
          ? p.image
          : "https://via.placeholder.com/150?text=Sin+Imagen",
        description: p.description || "" // Asegura que description siempre exista
      }));

      saveProductsToStorage(); // Guarda el borrador local
      renderProductTable();
      showStatus("Datos cargados y limpiados correctamente.", true);
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
      // 🔧 LIMPIEZA ANTES DE GUARDAR: Asegura que todas las imágenes sean válidas
      const productosLimpios = db.products.map(p => ({
        ...p,
        image: (p.image && p.image.trim() && p.image !== "...")
          ? p.image
          : "https://via.placeholder.com/150?text=Sin+Imagen",
        description: p.description || "" // Asegura que description siempre exista
      }));

      const response = await fetch(API_URL_PRODUCTOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productosLimpios)
      });

      if (!response.ok) {
        throw new Error("La respuesta del servidor no fue OK");
      }

      await response.json();

      // Actualiza el borrador local con los datos limpios
      db.products = productosLimpios;
      saveProductsToStorage();

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
      try {
        const productos = JSON.parse(storedProducts);
        // 🔧 LIMPIEZA AL CARGAR: Corrige imágenes problemáticas
        db.products = productos.map(p => ({
          ...p,
          image: (p.image && p.image.trim() && p.image !== "...")
            ? p.image
            : "https://via.placeholder.com/150?text=Sin+Imagen",
          description: p.description || "" // Asegura que description siempre exista
        }));
      } catch (error) {
        console.error("Error al parsear productos:", error);
        db.products = [];
      }
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
      
      // Truncar descripción si es muy larga
      const shortDescription = product.description && product.description.length > 50
        ? product.description.substring(0, 50) + "..."
        : (product.description || "Sin descripción");

      tr.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>$${product.price}</td>
        <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
        <td>${shortDescription}</td>
        <td class="actions">
          <button class="btn-edit" onclick="editProduct(${product.id})">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button class="btn-delete" onclick="deleteProduct(${product.id})">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </td>
      `;
      productTableBody.appendChild(tr);
    });
  }

  /**
   * 6. Crear o actualizar un producto (Borrador)
   */
  function saveProduct(e) {
    e.preventDefault();

    const id = productIdInput.value ? parseInt(productIdInput.value) : null;
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const image = productImageInput.value.trim();
    const description = productDescriptionInput.value.trim();

    if (!name || isNaN(price) || price < 0 || !image) {
      alert("Por favor, completa todos los campos correctamente.");
      return;
    }

    if (id) {
      // Actualizar producto existente
      const product = db.products.find(p => p.id === id);
      if (product) {
        product.name = name;
        product.price = price;
        product.image = image;
        product.description = description;
      }
    } else {
      // Crear nuevo producto
      const newId = db.products.length > 0
        ? Math.max(...db.products.map(p => p.id)) + 1
        : 1;

      db.products.push({
        id: newId,
        name,
        price,
        image,
        description
      });
    }

    saveProductsToStorage();
    renderProductTable();
    clearForm();
  }

  /**
   * 7. Editar producto (carga datos en el formulario)
   */
  window.editProduct = function(id) {
    const product = db.products.find(p => p.id === id);
    if (!product) return;

    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productPriceInput.value = product.price;
    productImageInput.value = product.image;
    productDescriptionInput.value = product.description || "";

    // Scroll al formulario
    productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * 8. Eliminar producto (Borrador)
   */
  window.deleteProduct = function(id) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    db.products = db.products.filter(p => p.id !== id);
    saveProductsToStorage();
    renderProductTable();
  };

  /**
   * 9. Limpiar formulario
   */
  function clearForm() {
    productIdInput.value = "";
    productNameInput.value = "";
    productPriceInput.value = "";
    productImageInput.value = "";
    productDescriptionInput.value = "";
  }

  // --- EVENTOS ---
  productForm.addEventListener('submit', saveProduct);
  btnClear.addEventListener('click', clearForm);
  btnSaveCloud.addEventListener('click', saveProductsToCloud);
  btnLoadCloud.addEventListener('click', loadProductsFromCloud);

  // --- INICIALIZACIÓN ---
  loadProductsFromStorage();
  renderProductTable();
});