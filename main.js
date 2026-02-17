// =========================================
// 1. Elements
// =========================================
const productsContainer = document.querySelector(".products");
const productTemplate = document.querySelector(".product");
const fullCart = document.querySelector(".full");
const emptyCart = document.querySelector(".empty");
const productCartContainer = document.querySelector(".product-content");
const productConfirmContainer = document.querySelector(
  ".order-confirmed .product-content",
);
const orderModal = document.querySelector(".order-confirmed");
const startNewOrderBtn = document.querySelector(".start-new-order");
const cartQuantityLabel = document.querySelector(".quantity");
const orderTotalLabel = document.querySelector(".order-total span:last-child");
const confirmed = document.querySelector(".confirm");
const modalOverlay = document.querySelector(".modal-overlay");

// Cart state (persistent in localStorage)
let cart = JSON.parse(localStorage.getItem("dessert_cart")) || [];

// =========================================
// 2. LocalStorage
// =========================================
function saveCart() {
  localStorage.setItem("dessert_cart", JSON.stringify(cart));
}

// =========================================
// 3. Data Fetching
// =========================================
async function getData() {
  try {
    const response = await fetch("./data.json");
    return await response.json();
  } catch (error) {
    console.error("Error fetching data", error);
  }
}

// =========================================
// 4. Cart Functions
// =========================================
function updateQty(name, qty) {
  const item = cart.find((i) => i.name === name);
  if (item) {
    item.qty = parseInt(qty);
    saveCart();
  }
}

function removeFromCart(name) {
  cart = cart.filter((item) => item.name !== name);
  saveCart();
}

function addToCart(product) {
  const found = cart.find((item) => item.name === product.name);
  if (!found) {
    cart.push({ ...product, qty: 1 });
    saveCart();
  }
}

// =========================================
// 5. Render Cart UI
// =========================================
function renderCart() {
  // Clear previous cart items
  const existingBoxes = productCartContainer.querySelectorAll(".box");
  existingBoxes.forEach((box) => box.remove());

  const existingConfirmBoxes = productConfirmContainer.querySelectorAll(".box");
  existingConfirmBoxes.forEach((box) => box.remove());

  // Handle empty cart
  if (cart.length === 0) {
    emptyCart.classList.remove("hide");
    fullCart.classList.add("hide");
    cartQuantityLabel.textContent = `(0)`;
    return;
  }

  emptyCart.classList.add("hide");
  fullCart.classList.remove("hide");

  let grandTotal = 0;
  let totalItems = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    grandTotal += itemTotal;
    totalItems += item.qty;

    // Create cart box
    const cartItem = document.createElement("div");
    const cartItemConfirm = document.createElement("div");
    cartItem.classList.add("box");
    cartItemConfirm.classList.add("box");

    cartItem.innerHTML = `
      <div class="info">
        <div class="name">${item.name}</div>
        <div class="price">
          <span class="units">${item.qty}x</span>
          <span class="price-unit">@$${item.price.toFixed(2)}</span>
          <span class="total-price">$${itemTotal.toFixed(2)}</span>
        </div>
      </div>
      <button class="delete" data-name="${item.name}">x</button>
    `;

    cartItemConfirm.innerHTML = `
    <div class="box-content">
    <img src=${item.image.desktop} alt=${item.category} class="box-img">
    <div class="info">
        <div class="name">${item.name}</div>
        <div class="price">
          <span class="units">${item.qty}x</span>
          <span class="price-unit">@$${item.price.toFixed(2)}</span>
        </div>
      </div>
      </div>
      <span class="total-price">$${itemTotal.toFixed(2)}</span>
    `;

    // Delete button
    cartItem.querySelector(".delete").addEventListener("click", () => {
      removeFromCart(item.name);
      renderProducts();
      renderCart();
    });

    // Add boxes to respective containers
    productCartContainer.prepend(cartItem);
    productConfirmContainer.prepend(cartItemConfirm);
  });

  cartQuantityLabel.textContent = `(${totalItems})`;
  orderTotalLabel.textContent = `$${grandTotal.toFixed(2)}`;

  const modalTotal = document.querySelector(
    ".order-confirmed .order-total span:last-child",
  );
  if (modalTotal) modalTotal.textContent = `$${grandTotal.toFixed(2)}`;
}

// =========================================
// 6. Render Product List
// =========================================
async function renderProducts() {
  const products = await getData();
  productsContainer.innerHTML = ""; // Clear container

  products.forEach((p) => {
    const productClone = productTemplate.cloneNode(true);
    const cartItem = cart.find((item) => item.name === p.name);

    // Select elements inside product card
    const img = productClone.querySelector("img");
    const category = productClone.querySelector(".category");
    const name = productClone.querySelector(".name");
    const price = productClone.querySelector(".price");
    const addBtn = productClone.querySelector(".add-icon");
    const numberControl = productClone.querySelector(".number-control");
    const input = productClone.querySelector("input");

    img.src = p.image.desktop;
    category.textContent = p.category;
    name.textContent = p.name;
    price.textContent = `$${p.price.toFixed(2)}`;

    // Sync state: show number control if item is in cart
    if (cartItem) {
      productClone.classList.add("added");
      input.value = cartItem.qty;
    } else {
      productClone.classList.remove("added");
    }

    // Event Listeners
    addBtn.addEventListener("click", () => {
      addToCart(p);
      renderProducts();
      renderCart();
    });

    productClone.querySelector(".add").addEventListener("click", () => {
      updateQty(p.name, cartItem.qty + 1);
      renderProducts();
      renderCart();
    });

    productClone.querySelector(".remove").addEventListener("click", () => {
      if (cartItem.qty > 1) {
        updateQty(p.name, cartItem.qty - 1);
      } else {
        removeFromCart(p.name);
      }
      renderProducts();
      renderCart();
    });

    productsContainer.appendChild(productClone);
  });
}

// =========================================
// 7. Initial Render
// =========================================
renderProducts();
renderCart();

// =========================================
// 8. Confirm Order & Modal
// =========================================
confirmed.addEventListener("click", () => {
  if (cart.length > 0) {
    modalOverlay.classList.add("show");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Start a new order: clear cart & UI
startNewOrderBtn.addEventListener("click", () => {
  cart = [];
  localStorage.removeItem("dessert_cart");
  modalOverlay.classList.remove("show");
  renderProducts();
  renderCart();
});
