/* Global Data Management */
const PRODUCTS = [
    { id: 1, name: "Recycled Notebook (Set of 3)", price: 150, image: "https://via.placeholder.com/300x200?text=Recycled+Notebook" },
    { id: 2, name: "Eco-Friendly Pen Stand", price: 200, image: "https://via.placeholder.com/300x200?text=Pen+Stand" },
    { id: 3, name: "Metal Art Sculpture", price: 1200, image: "https://via.placeholder.com/300x200?text=Metal+Art" },
    { id: 4, name: "Recycled Plastic Basket", price: 350, image: "https://via.placeholder.com/300x200?text=Plastic+Basket" },
    { id: 5, name: "Paper Mache Decorative Bowl", price: 450, image: "https://via.placeholder.com/300x200?text=Paper+Bowl" },
    { id: 6, name: "Upcycled Denim Bag", price: 600, image: "https://via.placeholder.com/300x200?text=Denim+Bag" },
];

/* --- AUTHENTICATION --- */

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.borderBottom = 'none';
        b.style.color = '#999';
        b.style.fontWeight = 'normal';
    });
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`tab-${tab}`).style.borderBottom = '2px solid #56ab2f';
    document.getElementById(`tab-${tab}`).style.color = '#56ab2f';
    document.getElementById(`tab-${tab}`).style.fontWeight = 'bold';

    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

function sendOTP() {
    const phone = document.getElementById('regPhone').value;
    if (phone.length < 10) {
        alert("Please enter a valid phone number.");
        return;
    }
    alert("Mock OTP sent to " + phone + ": 123456");
    document.getElementById('otpSection').style.display = 'block';
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const otp = document.getElementById('regOTP').value;
    const password = document.getElementById('regPassword').value;

    if (otp !== '123456') {
        alert("Invalid OTP. Try 123456");
        return;
    }

    let users = JSON.parse(localStorage.getItem('scrapkart_users') || '[]');
    if (users.find(u => u.phone === phone)) {
        alert("User already exists with this phone number.");
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        phone,
        password,
        wallet: 0
    };

    users.push(newUser);
    localStorage.setItem('scrapkart_users', JSON.stringify(users));
    alert("Registration Successful! Please Login.");
    switchAuthTab('login');
}

function handleLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;

    let users = JSON.parse(localStorage.getItem('scrapkart_users') || '[]');
    const user = users.find(u => u.phone === phone && u.password === password);

    if (user) {
        localStorage.setItem('scrapkart_currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert("Invalid Phone or Password");
    }
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    if (!user && !window.location.href.includes('auth.html') && !window.location.href.includes('index.html')) {
        window.location.href = 'auth.html';
    }
    if (user && document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').innerText = user.name;
        loadWallet(); // Initial load
    }
}

function logout() {
    localStorage.removeItem('scrapkart_currentUser');
    window.location.href = 'index.html';
}

/* --- DASHBOARD / SELL --- */

function showSection(sectionId) {
    // Hide all
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    // Show target
    document.getElementById(`section-${sectionId}`).style.display = 'block';

    // Refresh data
    if (sectionId === 'wallet') loadWallet();
    if (sectionId === 'orders') loadOrders();
}

function calculatePrice() {
    const typeSelect = document.getElementById('scrapType');
    const weightInput = document.getElementById('scrapWeight');
    const priceDisplay = document.getElementById('calculatedPrice');

    const pricePerKg = typeSelect.selectedOptions[0]?.getAttribute('data-price') || 0;
    const weight = weightInput.value || 0;

    const total = pricePerKg * weight;
    priceDisplay.innerText = total;
}

function goToAddress() {
    const weight = document.getElementById('scrapWeight').value;
    if (!weight || weight <= 0) {
        alert("Please enter a valid weight.");
        return;
    }
    document.getElementById('sell-step-1').style.display = 'none';
    document.getElementById('sell-step-2').style.display = 'block';
}

function backToCalc() {
    document.getElementById('sell-step-1').style.display = 'block';
    document.getElementById('sell-step-2').style.display = 'none';
}

function placeScrapOrder() {
    const addressLine1 = document.getElementById('addressLine1').value;
    const addressLine2 = document.getElementById('addressLine2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const pincode = document.getElementById('pincode').value;
    const country = document.getElementById('country').value;
    const date = document.getElementById('pickupDate').value;

    if (!addressLine1 || !city || !state || !pincode || !country || !date) {
        alert("Please fill in all required address details and date.");
        return;
    }

    const fullAddress = `${addressLine1}, ${addressLine2 ? addressLine2 + ', ' : ''}${city}, ${state} - ${pincode}, ${country}`;

    const typeSelect = document.getElementById('scrapType');
    const price = document.getElementById('calculatedPrice').innerText;
    const weight = document.getElementById('scrapWeight').value;
    const itemType = typeSelect.value;
    const itemTypeName = typeSelect.options[typeSelect.selectedIndex].text;

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    // Save Order
    const order = {
        id: Date.now(),
        userId: user.id,
        type: 'sell',
        item: itemTypeName,
        weight: weight,
        price: parseInt(price),
        address: fullAddress,
        date: date,
        status: 'Completed', // Auto-complete for demo to credit wallet
        createdAt: new Date().toLocaleDateString()
    };

    let orders = JSON.parse(localStorage.getItem('scrapkart_orders') || '[]');
    orders.push(order);
    localStorage.setItem('scrapkart_orders', JSON.stringify(orders));

    // Credit Wallet (Simulating instant payout for demo)
    updateWallet(order.price, 'Credit', `Sold ${weight}kg ${itemType}`);

    // Show Success
    document.getElementById('sell-step-2').style.display = 'none';
    document.getElementById('sell-step-3').style.display = 'block';
    document.getElementById('finalPriceDisplay').innerText = '₹' + price;
}

function resetSellFlow() {
    document.getElementById('sell-step-3').style.display = 'none';
    document.getElementById('sell-step-1').style.display = 'block';
    document.getElementById('scrapWeight').value = '';
    document.getElementById('calculatedPrice').innerText = '0';
    document.getElementById('scrapType').selectedIndex = 0;
}


/* --- WALLET & DATA --- */

function updateWallet(amount, type, description) {
    let user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    let users = JSON.parse(localStorage.getItem('scrapkart_users') || '[]');

    if (type === 'Credit') {
        user.wallet += amount;
    } else if (type === 'Debit') {
        user.wallet -= amount;
    }

    // Update current user
    localStorage.setItem('scrapkart_currentUser', JSON.stringify(user));

    // Update main users list
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('scrapkart_users', JSON.stringify(users));
    }

    // Add Transaction Record
    const transaction = {
        userId: user.id,
        amount: amount,
        type: type,
        description: description,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    };
    let transactions = JSON.parse(localStorage.getItem('scrapkart_transactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('scrapkart_transactions', JSON.stringify(transactions));

    loadWallet();
}

function loadWallet() {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    if (!user) return;

    // Update UI
    const balanceDisplay = document.getElementById('navWalletBalance');
    if (balanceDisplay) balanceDisplay.innerText = user.wallet;

    const walletDisplay = document.getElementById('walletDisplay');
    if (walletDisplay) walletDisplay.innerText = user.wallet;

    // Load History
    const transactions = JSON.parse(localStorage.getItem('scrapkart_transactions') || '[]');
    const userTrans = transactions.filter(t => t.userId === user.id).reverse();
    const list = document.getElementById('transactionList');

    if (list) {
        if (userTrans.length === 0) {
            list.innerHTML = '<p>No transactions yet.</p>';
        } else {
            list.innerHTML = userTrans.map(t => `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <div style="font-weight: 600;">${t.description}</div>
                        <div style="font-size: 0.8rem; color: #999;">${t.date}</div>
                    </div>
                    <div style="font-weight: bold; color: ${t.type === 'Credit' ? '#2e7d32' : '#f44336'}">
                        ${t.type === 'Credit' ? '+' : '-'} ₹${t.amount}
                    </div>
                </div>
            `).join('');
        }
    }
}

/* --- MARKETPLACE --- */

function loadMarketplace() {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;

    grid.innerHTML = PRODUCTS.map(p => `
        <div class="product-item">
            <img src="${p.image}" alt="${p.name}">
            <h4 style="font-size: 0.95rem; margin-bottom: 5px;">${p.name}</h4>
            <div class="product-price">₹${p.price}</div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="addToCart(${p.id})" style="flex: 1; padding: 8px; background: white; color: #56ab2f; border: 1px solid #56ab2f; border-radius: 5px; cursor: pointer;">Add to Cart</button>
                <button onclick="openBuyModal(${p.id})" style="flex: 1; padding: 8px; background: #56ab2f; color: white; border: none; border-radius: 5px; cursor: pointer;">Buy Now</button>
            </div>
        </div>
    `).join('');
}

let selectedProduct = null;

function openBuyModal(productId) {
    selectedProduct = PRODUCTS.find(p => p.id === productId);
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    document.getElementById('buyProductName').innerText = selectedProduct.name;
    document.getElementById('buyProductPrice').innerText = selectedProduct.price;
    document.getElementById('buyWalletBalance').innerText = user.wallet;
    document.getElementById('buyError').style.display = 'none';
    document.getElementById('buyModal').style.display = 'block';
}

function closeBuyModal() {
    document.getElementById('buyModal').style.display = 'none';
    selectedProduct = null;
}

function confirmPurchase() {
    if (!selectedProduct) return;

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    if (user.wallet < selectedProduct.price) {
        document.getElementById('buyError').style.display = 'block';
        return;
    }

    updateWallet(selectedProduct.price, 'Debit', `Purchased ${selectedProduct.name}`);

    // Save Purchase
    const purchase = {
        userId: user.id, // Fixed: using user.id from closure
        type: 'buy',
        item: selectedProduct.name,
        price: selectedProduct.price,
        date: new Date().toLocaleDateString(),
        status: 'Purchased'
    };
    let orders = JSON.parse(localStorage.getItem('scrapkart_orders') || '[]');
    orders.push(purchase);
    localStorage.setItem('scrapkart_orders', JSON.stringify(orders)); // Fixed Key

    alert('Purchase Successful!');
    closeBuyModal();
    loadOrders();
}

function loadOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    let orders = JSON.parse(localStorage.getItem('scrapkart_orders') || '[]');
    const userOrders = orders.filter(o => o.userId === user.id).reverse();

    if (userOrders.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#999;">No orders found.</p>';
        return;
    }

    list.innerHTML = userOrders.map(o => `
        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: bold; color: #333;">${o.item}</div>
                <div style="font-size: 0.9rem; color: #666;">Date: ${o.date}</div>
                <div style="font-size: 0.8rem; color: #999;">Type: ${o.type.toUpperCase()}</div>
                ${o.address ? `<div style="font-size: 0.8rem; color: #666;">Pickup: ${o.address}</div>` : ''}
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; font-size: 1.1rem; color: ${o.type === 'sell' ? '#2e7d32' : '#f44336'}">
                    ${o.type === 'sell' ? '+' : '-'} ₹${o.price}
                </div>
                <div style="display: inline-block; padding: 4px 10px; background: #e8f5e9; color: #2e7d32; border-radius: 15px; font-size: 0.8rem; margin-top: 5px;">${o.status}</div>
            </div>
        </div>
    `).join('');
}

/* --- CART FUNCTIONS --- */
let cart = [];

function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        renderCart();
        modal.style.display = 'block';
    }
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartCount();
        alert(`${product.name} added to cart!`);
    }
}

function updateCartCount() {
    const countBadge = document.getElementById('cartCount');
    if (cart.length > 0) {
        countBadge.innerText = cart.length;
        countBadge.style.display = 'block';
    } else {
        countBadge.style.display = 'none';
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    updateCartCount();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">Your cart is empty.</p>';
        totalEl.innerText = '0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                </div>
                <button class="cart-remove-btn" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    totalEl.innerText = total;
}

function checkoutCart() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (user.wallet < total) {
        alert("Insufficient Wallet Balance!");
        return;
    }

    // Process payment
    updateWallet(total, 'Debit', `Cart Checkout (${cart.length} items)`);

    // Create orders
    let orders = JSON.parse(localStorage.getItem('scrapkart_orders') || '[]');
    const date = new Date().toLocaleDateString();

    cart.forEach(item => {
        orders.push({
            userId: user.id,
            type: 'buy',
            item: item.name,
            price: item.price,
            date: date,
            status: 'Purchased'
        });
    });

    localStorage.setItem('scrapkart_orders', JSON.stringify(orders));

    // Clear cart
    cart = [];
    updateCartCount();
    toggleCart();
    loadOrders(); // Refresh orders if visible
    alert("Purchase Successful!");
}
