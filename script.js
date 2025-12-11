/* Global Data Management */
const PRODUCTS = [
    { id: 1, name: "Recycled Notebook (Set of 3)", price: 150, image: "assets/notebook.png" },
    { id: 2, name: "Eco-Friendly Pen Stand", price: 200, image: "assets/pen_stand.png" },
    { id: 3, name: "Metal Art Sculpture", price: 1200, image: "assets/metal_art.png" },
    { id: 4, name: "Recycled Plastic Basket", price: 350, image: "assets/plastic_basket.png" },
    { id: 5, name: "Paper Mache Decorative Bowl", price: 450, image: "assets/paper_bowl.png" },
    { id: 6, name: "Upcycled Denim Bag", price: 600, image: "assets/denim_bag.png" },
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

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    if (!user) return; // Should be handled by Auth check

    // Check if user has addresses in Firebase
    firebase.database().ref('users/' + user.id + '/addresses').once('value').then(snapshot => {
        const hasAddresses = snapshot.exists() && snapshot.numChildren() > 0;

        document.getElementById('sell-step-1').style.display = 'none';

        if (hasAddresses) {
            renderAddressSelection();
            document.getElementById('sell-step-3').style.display = 'block';
        } else {
            showAddAddressForm(); // Helper to clear and show form
            // Or manual:
            // document.getElementById('sell-step-2').style.display = 'block';
            // ensure buttons are correct
        }
    });
}

function backToCalc() {
    // Check where we are coming from
    if (document.getElementById('sell-step-3').style.display === 'block') {
        // In Step 3 -> Go to Step 1
        document.getElementById('sell-step-3').style.display = 'none';
        document.getElementById('sell-step-1').style.display = 'block';
    } else {
        // In Step 2
        const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
        if (!user) {
            document.getElementById('sell-step-2').style.display = 'none';
            document.getElementById('sell-step-1').style.display = 'block';
            return;
        }

        firebase.database().ref('users/' + user.id + '/addresses').once('value').then(snapshot => {
            const hasAddresses = snapshot.exists() && snapshot.numChildren() > 0;

            if (hasAddresses) {
                // If addresses exist, Cancel goes back to Selection (Step 3)
                renderAddressSelection();
                document.getElementById('sell-step-2').style.display = 'none';
                document.getElementById('sell-step-3').style.display = 'block';
            } else {
                // Else go to Step 1
                document.getElementById('sell-step-2').style.display = 'none';
                document.getElementById('sell-step-1').style.display = 'block';
            }
        });
    }
}

function placeScrapOrder() {
    const selectedRadio = document.querySelector('input[name="selectedAddress"]:checked');
    if (!selectedRadio) {
        alert("Please select a pickup address.");
        return;
    }

    const date = document.getElementById('pickupDate').value;
    if (!date) {
        alert("Please select a pickup date.");
        return;
    }

    const addressId = selectedRadio.value; // String ID from Firebase
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    // Fetch address details from Firebase
    firebase.database().ref('users/' + user.id + '/addresses/' + addressId).once('value').then(snapshot => {
        const selectedAddressObj = snapshot.val();
        if (!selectedAddressObj) {
            alert("Selected address not found.");
            return;
        }

        const typeSelect = document.getElementById('scrapType');
        const weightInput = document.getElementById('scrapWeight');
        const itemType = typeSelect.options[typeSelect.selectedIndex].text;
        const pricePerKg = typeSelect.selectedOptions[0].getAttribute('data-price');
        const weight = weightInput.value;
        const price = pricePerKg * weight;

        const order = {
            id: Date.now(),
            userId: user.id,
            type: 'sell',
            item: `${weight}kg ${itemType}`,
            price: price,
            address: selectedAddressObj.text, // Assuming text is still useful
            fullAddressData: selectedAddressObj, // Store full object for future proofing
            date: date,
            status: 'Completed', // Instant completion for demo?
            createdAt: new Date().toLocaleDateString()
        };

        let orders = JSON.parse(localStorage.getItem('scrapkart_orders') || '[]');
        orders.push(order);
        localStorage.setItem('scrapkart_orders', JSON.stringify(orders));

        // Credit Wallet
        updateWallet(order.price, 'Credit', `Sold ${weight}kg ${itemType} `);

        // Show Success
        document.getElementById('sell-step-3').style.display = 'none';
        document.getElementById('sell-step-4').style.display = 'block';
        document.getElementById('finalPriceDisplay').innerText = '₹' + price;
    }).catch(err => {
        console.error(err);
        alert("Failed to place order. Please try again.");
    });
}

let editingAddressId = null;

function showAddAddressForm() {
    editingAddressId = null;
    document.getElementById('saveAddressBtn').innerText = 'Add Pickup Address';
    document.getElementById('sell-step-3').style.display = 'none';
    document.getElementById('sell-step-2').style.display = 'block';

    // Clear inputs
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactAltPhone').value = '';
    document.querySelector('input[name="addressType"][value="Home"]').checked = true;

    document.getElementById('addressLine1').value = '';
    document.getElementById('addressLine2').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('pincode').value = '';
}

function saveAddressAndShowSelection() {
    const name = document.getElementById('contactName').value;
    const phoneInput = document.getElementById('contactPhone').value;
    const altPhoneInput = document.getElementById('contactAltPhone').value;
    const type = document.querySelector('input[name="addressType"]:checked').value;

    const addressLine1 = document.getElementById('addressLine1').value;
    const addressLine2 = document.getElementById('addressLine2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const pincode = document.getElementById('pincode').value;
    const country = document.getElementById('country').value;

    if (!name || !phoneInput || !addressLine1 || !city || !state || !pincode || !country) {
        alert("Please fill in all required fields (Name, Phone, Address details).");
        return;
    }

    // Add prefix
    const phone = phoneInput.startsWith('+91') ? phoneInput : '+91 ' + phoneInput;
    const altPhone = altPhoneInput ? (altPhoneInput.startsWith('+91') ? altPhoneInput : '+91 ' + altPhoneInput) : '';

    const fullAddress = `${addressLine1}, ${addressLine2 ? addressLine2 + ', ' : ''}${city}, ${state} - ${pincode}, ${country}`;
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    const addressData = {
        userId: user.id,
        text: fullAddress, // Legacy support field
        name: name,
        phone: phone,
        altPhone: altPhone,
        type: type,
        components: { addressLine1, addressLine2, city, state, pincode, country }
    };

    if (editingAddressId) {
        firebase.database().ref('users/' + user.id + '/addresses/' + editingAddressId).update(addressData, (error) => {
            if (error) { alert("Error updating address: " + error.message); }
            else {
                onAddressSaved();
            }
        });
    } else {
        const newRef = firebase.database().ref('users/' + user.id + '/addresses').push();
        addressData.id = newRef.key;
        newRef.set(addressData, (error) => {
            if (error) { alert("Error saving address: " + error.message); }
            else {
                onAddressSaved();
            }
        });
    }
}

function onAddressSaved() {
    // Clear Inputs
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactAltPhone').value = '';
    document.getElementById('addressLine1').value = '';
    document.getElementById('addressLine2').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('pincode').value = '';
    document.getElementById('country').value = '';

    editingAddressId = null;
    document.getElementById('saveAddressBtn').innerText = 'Add Pickup Address';

    renderAddressSelection();

    document.getElementById('sell-step-2').style.display = 'none';
    document.getElementById('sell-step-3').style.display = 'block';
}

function editAddress(id) {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    if (!user) return;

    firebase.database().ref('users/' + user.id + '/addresses/' + id).once('value').then((snapshot) => {
        const address = snapshot.val();
        if (!address) return;

        editingAddressId = id;

        // Populate Form
        document.getElementById('contactName').value = address.name || '';

        let ph = address.phone || '';
        if (ph.includes('+91 ')) ph = ph.replace('+91 ', '');
        else if (ph.includes('+91')) ph = ph.replace('+91', '');
        document.getElementById('contactPhone').value = ph;

        let alt = address.altPhone || '';
        if (alt.includes('+91 ')) alt = alt.replace('+91 ', '');
        else if (alt.includes('+91')) alt = alt.replace('+91', '');
        document.getElementById('contactAltPhone').value = alt;

        if (address.type) {
            const radio = document.querySelector(`input[name="addressType"][value="${address.type}"]`);
            if (radio) radio.checked = true;
        }

        // Logic for components vs legacy text
        if (address.components) {
            document.getElementById('addressLine1').value = address.components.addressLine1;
            document.getElementById('addressLine2').value = address.components.addressLine2;
            document.getElementById('city').value = address.components.city;
            document.getElementById('state').value = address.components.state;
            document.getElementById('pincode').value = address.components.pincode;
            document.getElementById('country').value = address.components.country;
        } else {
            try {
                let text = address.text;
                const countryIndex = text.lastIndexOf(', ');
                if (countryIndex !== -1) {
                    document.getElementById('country').value = text.substring(countryIndex + 2);
                    text = text.substring(0, countryIndex);
                }
                const dashIndex = text.lastIndexOf(' - ');
                if (dashIndex !== -1) {
                    document.getElementById('pincode').value = text.substring(dashIndex + 3);
                    text = text.substring(0, dashIndex);
                    const stateIndex = text.lastIndexOf(', ');
                    if (stateIndex !== -1) {
                        document.getElementById('state').value = text.substring(stateIndex + 2);
                        text = text.substring(0, stateIndex);
                        const cityIndex = text.lastIndexOf(', ');
                        if (cityIndex !== -1) {
                            document.getElementById('city').value = text.substring(cityIndex + 2);
                            text = text.substring(0, cityIndex);
                        }
                    }
                }
                document.getElementById('addressLine1').value = text;
            } catch (e) {
                document.getElementById('addressLine1').value = address.text;
            }
        }

        document.getElementById('saveAddressBtn').innerText = 'Update Address';
        document.getElementById('sell-step-3').style.display = 'none';
        document.getElementById('sell-step-2').style.display = 'block';
    });
}


let deleteAddressId = null;

function deleteAddress(id) {
    deleteAddressId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteAddressId = null;
}

function confirmDeleteAddress() {
    if (!deleteAddressId) return;
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    firebase.database().ref('users/' + user.id + '/addresses/' + deleteAddressId).remove().then(() => {
        renderAddressSelection();
        closeDeleteModal();
    }).catch(err => alert("Error removing address: " + err.message));
}

function renderAddressSelection() {
    // Set min date to 3 days from today
    const today = new Date();
    today.setDate(today.getDate() + 3);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('pickupDate').min = `${yyyy}-${mm}-${dd}`;

    const list = document.getElementById('addressList');
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    if (!user) return;

    list.innerHTML = '<p style="text-align:center; color:#666;">Loading addresses...</p>';

    firebase.database().ref('users/' + user.id + '/addresses').once('value').then((snapshot) => {
        const data = snapshot.val();
        const userAddresses = [];
        if (data) {
            // Convert object to array
            for (let key in data) {
                userAddresses.push(data[key]);
            }
        }

        if (userAddresses.length === 0) {
            list.innerHTML = '<p>No saved addresses found.</p>';
            return;
        }

        list.innerHTML = userAddresses.map((addr, index) => `
        <div style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 10px;">
            <div style="flex: 1; display: flex; gap: 10px;">
                <input type="radio" name="selectedAddress" id="addr_${addr.id}" value="${addr.id}" ${index === userAddresses.length - 1 ? 'checked' : ''} style="margin-top: 4px;">
                <label for="addr_${addr.id}" style="font-size: 0.95rem; line-height: 1.4; color: #333; cursor: pointer; display: block; width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-weight: bold; font-size: 1rem;">${addr.name || 'Unknown'} <span style="font-size: 0.75rem; background: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 4px; margin-left: 5px; font-weight: normal;">${addr.type || 'Home'}</span></span>
                        <span style="font-size: 0.85rem; color: #666;">${addr.phone || ''}</span>
                    </div>
                    <div style="color: #555;">${addr.text}</div>
                </label>
            </div>
            <div style="display: flex; gap: 5px;">
                <button onclick="editAddress('${addr.id}')" style="background: none; border: none; color: #555; cursor: pointer; padding: 2px;" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteAddress('${addr.id}')" style="background: none; border: none; color: #bf3f3f; cursor: pointer; padding: 2px;" title="Remove">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        `).join('');
    });
}

function placeScrapOrder() {
    const selectedRadio = document.querySelector('input[name="selectedAddress"]:checked');
    if (!selectedRadio) {
        alert("Please select a pickup address.");
        return;
    }

    const date = document.getElementById('pickupDate').value;
    if (!date) {
        document.getElementById('dateError').style.display = 'block';
        return;
    }

    const addressId = selectedRadio.value;
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    firebase.database().ref('users/' + user.id + '/addresses/' + addressId).once('value').then(snapshot => {
        const selectedAddressObj = snapshot.val();

        if (!selectedAddressObj) {
            alert("Address not found!");
            return;
        }

        // Calculator Data
        const typeSelect = document.getElementById('scrapType');
        const price = document.getElementById('calculatedPrice').innerText;
        const weight = document.getElementById('scrapWeight').value;
        const itemType = typeSelect.value;
        const itemTypeName = typeSelect.options[typeSelect.selectedIndex].text;

        const order = {
            id: Date.now(),
            userId: user.id,
            type: 'sell',
            item: itemTypeName,
            weight: weight,
            price: parseInt(price),
            address: selectedAddressObj.text,
            customerName: selectedAddressObj.name,
            customerPhone: selectedAddressObj.phone,
            date: date,
            status: 'Completed',
            createdAt: new Date().toLocaleDateString()
        };

        // Save Order to Firebase
        firebase.database().ref('users/' + user.id + '/orders/' + order.id).set(order).then(() => {
            // Credit Wallet (Local)
            updateWallet(order.price, 'Credit', `Sold ${weight}kg ${itemType} `);

            // Show Success
            document.getElementById('sell-step-3').style.display = 'none';
            document.getElementById('sell-step-4').style.display = 'block';
            document.getElementById('finalPriceDisplay').innerText = '₹' + price;
        }).catch(err => {
            alert("Error saving order: " + err.message);
        });
    }).catch(err => {
        alert("Error: " + err.message);
    });
}

function resetSellFlow() {
    document.getElementById('sell-step-4').style.display = 'none';
    document.getElementById('sell-step-1').style.display = 'block';
    document.getElementById('scrapWeight').value = '';
    document.getElementById('calculatedPrice').innerText = '0';
    document.getElementById('pickupDate').value = '';
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
            list.innerHTML = userTrans.map(t => {
                const isCredit = t.type === 'Credit';
                const color = isCredit ? '#2e7d32' : '#f44336';
                const bg = isCredit ? '#e8f5e9' : '#ffebee';
                const icon = isCredit ? 'fa-arrow-down' : 'fa-arrow-up'; // Down = In (Credit), Up = Out (Debit)

                return `
                <div style="background: white; padding: 15px 20px; border-radius: 12px; border: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 45px; height: 45px; background: ${bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${color};">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${t.description}</div>
                            <div style="font-size: 0.85rem; color: #999;">${t.date}</div>
                        </div>
                    </div>
                    <div style="font-weight: 700; color: ${color}; font-size: 1.1rem;">
                        ${isCredit ? '+' : '-'} ₹${t.amount}
                    </div>
                </div>`;
            }).join('');
        }
    }
}

/* --- MARKETPLACE --- */

function loadMarketplace() {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;

    grid.innerHTML = PRODUCTS.map(p => `
        <div class="product-item" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #f0f0f0; transition: transform 0.2s; display: flex; flex-direction: column; height: 100%;">
            <div style="height: 200px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f9f9f9; padding: 10px;">
                <img src="${p.image}" alt="${p.name}" style="max-height: 100%; max-width: 100%; object-fit: contain; transition: transform 0.3s;">
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
                <h4 style="font-size: 1.1rem; margin: 0 0 8px 0; color: #333; font-weight: 600;">${p.name}</h4>
                <div style="color: #2e7d32; font-weight: 700; font-size: 1.2rem; margin-bottom: 15px;">₹${p.price}</div>
                <div style="margin-top: auto; display: flex; gap: 10px;">
                    <button onclick="addToCart(${p.id})" style="flex: 1; padding: 10px; background: white; color: #2e7d32; border: 1px solid #2e7d32; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#f1f8e9'" onmouseout="this.style.background='white'">
                         <i class="fas fa-cart-plus"></i> Add
                    </button>
                    <button onclick="openBuyModal(${p.id})" style="flex: 1; padding: 10px; background: #2e7d32; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#1b5e20'" onmouseout="this.style.background='#2e7d32'">
                         Buy Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

let selectedProduct = null;

/* --- BUY NOW FLOW --- */
function openBuyModal(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    localStorage.setItem('scrapkart_temp_checkout_item', JSON.stringify(product));
    window.location.href = 'select_address.html';
}
// Old modal functions removed


function loadOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    // Fetch from Firebase
    firebase.database().ref('users/' + user.id + '/orders').once('value').then(snapshot => {
        const ordersObj = snapshot.val();
        let userOrders = [];
        if (ordersObj) {
            userOrders = Object.values(ordersObj).sort((a, b) => b.id - a.id);
        }

        window.userOrdersCache = userOrders;

        if (userOrders.length === 0) {
            list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>No orders found yet.</p>
                <button onclick="showSection('sell')" style="margin-top: 10px; color: #2e7d32; text-decoration: underline; background: none; border: none; cursor: pointer;">Start Selling</button>
            </div>`;
            return;
        }

        list.innerHTML = userOrders.map(o => {
            const dateStr = o.date || 'Unknown Date';
            const isSell = o.type === 'sell';

            // Visual Config
            const color = isSell ? '#2e7d32' : '#1976d2';
            const bg = isSell ? '#e8f5e9' : '#e3f2fd';
            const icon = isSell ? 'fa-truck' : 'fa-shopping-bag';
            const badgeText = isSell ? 'Sold Scrap' : 'Purchased';
            const pricePrefix = isSell ? '+' : '-';

            // Address logic
            let addressDisplay = '';
            if (o.addressId) {
                addressDisplay = o.address || 'View details for address';
            } else if (o.address) {
                addressDisplay = o.address;
            }

            return `
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; transition: transform 0.2s; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${color};"></div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-left: 10px;">
                <div style="display: flex; gap: 15px;">
                    <div style="width: 50px; height: 50px; background: ${bg}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 1.5rem;">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: ${color}; margin-bottom: 2px;">${badgeText}</div>
                        <div style="font-weight: 600; font-size: 1.1rem; color: #333; margin-bottom: 4px;">
                            ${o.item || 'Order'}
                        </div>
                        <div style="font-size: 0.85rem; color: #888;">ID: #${o.id || '---'}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; font-size: 1.2rem; color: ${color};">
                        ${pricePrefix} ₹${o.price}
                    </div>
                    <div style="font-size: 0.8rem; color: #999; margin-top: 2px;">${dateStr}</div>
                </div>
            </div>
            
            <div style="border-top: 1px solid #f5f5f5; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; padding-left: 10px;">
                 <div style="font-size: 0.9rem; color: #555; display: flex; align-items: center; gap: 8px; flex: 1; margin-right: 10px;">
                    ${addressDisplay ? `<i class="fas fa-map-marker-alt" style="color: #999;"></i> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;" title="${addressDisplay}">${addressDisplay}</span>` : ''}
                 </div>
                 <div style="display: flex; gap: 10px; align-items: center;">
                     <div style="padding: 5px 12px; background: ${o.status === 'Completed' || o.status === 'Purchased' ? '#e8f5e9' : '#fff3e0'}; color: ${o.status === 'Completed' || o.status === 'Purchased' ? '#2e7d32' : '#f57c00'}; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">
                        ${o.status || 'Pending'}
                     </div>
                     <button onclick="viewOrder(${o.id})" style="background: white; border: 1px solid #ddd; padding: 6px 12px; border-radius: 6px; cursor: pointer; color: #555; font-size: 0.85rem; transition: all 0.2s;">
                        <i class="fas fa-eye"></i> View
                     </button>
                 </div>
            </div>
        </div>
        `;
        }).join('');
    });
}

function viewOrder(orderId) {
    // Read from Cache (populated by loadOrders) or empty
    let orders = window.userOrdersCache || [];
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser')); // Fetch user
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        alert("Order details not found.");
        return;
    }

    const isSell = order.type === 'sell';
    const content = document.getElementById('orderDetailContent');

    // Construct Details HTML
    const details = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
                <strong style="font-size: 1.1rem; color: #333;">Order #${order.id}</strong>
                <div style="color: #888; font-size: 0.9rem;">${order.date}</div>
            </div>
            <div style="padding: 5px 12px; background: ${order.status === 'Completed' || order.status === 'Purchased' ? '#e8f5e9' : '#fff3e0'}; color: ${order.status === 'Completed' || order.status === 'Purchased' ? '#2e7d32' : '#f57c00'}; border-radius: 20px; font-size: 0.85rem; height: fit-content;">
                ${order.status}
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Customer Name</td>
                <td style="padding: 8px 0; text-align: right;">${order.customerName || (user ? user.name : 'N/A')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Phone</td>
                <td style="padding: 8px 0; text-align: right;">${order.customerPhone || (user ? user.id : 'N/A')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Transaction Type</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${isSell ? 'Sold Scrap' : 'Purchased Item'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Item</td>
                <td style="padding: 8px 0; text-align: right;">${order.item}</td>
            </tr>
             ${order.weight ? `<tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Weight</td>
                <td style="padding: 8px 0; text-align: right;">${order.weight} kg</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Amount</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${isSell ? '#2e7d32' : '#333'}">${isSell ? '+' : '-'} ₹${order.price}</td>
            </tr>
        </table>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 5px; color: #555;">${isSell ? 'Pickup Address' : 'Delivery Address'}</div>
            <div style="color: #666; font-size: 0.95rem;">${order.address || 'N/A'}</div>
        </div>
    `;

    content.innerHTML = details;
    document.getElementById('orderDetailModal').style.display = 'block';
}

function closeOrderModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
}

/* --- CART FUNCTIONS --- */
let cart = [];

function getCartKey() {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    return user ? `scrapkart_cart_${user.phone}` : 'scrapkart_cart_guest';
}

function loadCart() {
    const key = getCartKey();
    cart = JSON.parse(localStorage.getItem(key) || '[]');
    // Ensure we trigger UI update if elements exist
    if (typeof updateCartCount === 'function') updateCartCount();
}

function saveCart() {
    const key = getCartKey();
    localStorage.setItem(key, JSON.stringify(cart));
    updateCartCount();
}

// Initial Load
loadCart();

function toggleCart() {
    window.location.href = 'cart.html';
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        saveCart();
        showToast(`${product.name} quantity increased!`);
    } else {
        cart.push({ ...product, quantity: 1 });
        saveCart();
        showToast(`${product.name} added to cart!`);
    }
}

function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast success';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateCartCount() {
    const countBadge = document.getElementById('cartCount');
    if (!countBadge) return;
    if (cart.length > 0) {
        countBadge.innerText = cart.length;
        countBadge.style.display = 'block';
    } else {
        countBadge.style.display = 'none';
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart(); // For modal if used
    if (typeof loadCartPage === 'function') loadCartPage(); // For new page
    updateCartCount();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    if (!container) return; // Exit if elements don't exist (e.g. on cart page)

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">Your cart is empty.</p>';
        if (totalEl) totalEl.innerText = '0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `
        < div class="cart-item" >
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                </div>
                <button class="cart-remove-btn" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div >
        `;
    }).join('');

    totalEl.innerText = total;
}

function checkoutCart() {
    if (cart.length === 0) {
        if (typeof showToast === 'function') showToast("Your cart is empty!");
        else alert("Your cart is empty!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Create a composite "Cart Item" for the checkout flow
    const checkoutItem = {
        id: 'cart_checkout_' + Date.now(),
        name: `Cart Checkout (${cart.length} items)`,
        price: total,
        image: cart[0].image, // Use first item's image as preview
        isCart: true,
        items: cart
    };

    localStorage.setItem('scrapkart_temp_checkout_item', JSON.stringify(checkoutItem));

    // Redirect to Address Selection
    window.location.href = 'select_address.html';
}

/* --- ACCOUNT & PROFILE --- */
function toggleAccountMenu() {
    const dropdown = document.getElementById('accountDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    if (!user) return;

    firebase.database().ref('users/' + user.id).once('value').then(snapshot => {
        const userData = snapshot.val();
        if (userData) {
            document.getElementById('editFirstName').value = userData.firstName || '';
            document.getElementById('editLastName').value = userData.lastName || '';
            document.getElementById('editPhone').value = userData.phone || user.id;
            document.getElementById('editEmail').value = userData.email || '';
            document.getElementById('profileModal').style.display = 'block';
        } else {
            // Fallback if user record not found but session exists (edges case)
            document.getElementById('editPhone').value = user.id;
            document.getElementById('profileModal').style.display = 'block';
        }
    });
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function saveProfile() {
    const firstName = document.getElementById('editFirstName').value;
    const lastName = document.getElementById('editLastName').value;
    const email = document.getElementById('editEmail').value;

    if (!firstName || !lastName || !email) {
        alert("Please fill all fields");
        return;
    }

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));

    const updates = {
        firstName: firstName,
        lastName: lastName,
        email: email
    };

    firebase.database().ref('users/' + user.id).update(updates).then(() => {
        user.name = firstName + ' ' + lastName;
        localStorage.setItem('scrapkart_currentUser', JSON.stringify(user));
        document.getElementById('userNameDisplay').innerText = user.name;
        alert("Profile updated successfully!");
        closeProfileModal();
    }).catch(err => {
        alert("Error updating profile: " + err.message);
    });
}

// Close Dropdown on outside click (Adding this at end of file)
window.addEventListener('click', function (event) {
    // Dropdown
    if (!event.target.matches('.dropbtn') && !event.target.closest('button[onclick="toggleAccountMenu()"]')) {
        const dropdown = document.getElementById('accountDropdown');
        if (dropdown && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    }
    // Modals (General fix for all modals if they lack it)
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
});

function loadCartPage() {
    const list = document.getElementById('cartPageList');
    const totalEl = document.getElementById('cartPageTotal');
    const subtotalEl = document.getElementById('cartPageSubtotal');

    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="card" style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 20px;"></i>
                <p style="color: #666; font-size: 1.1rem;">Your cart is empty.</p>
                <a href="dashboard.html" onclick="localStorage.setItem('lastSection', 'market')" style="color: #2e7d32; font-weight: 600; margin-top: 15px; display: inline-block;">Continue Shopping</a>
            </div>
        `;
        if (totalEl) totalEl.innerText = '0';
        if (subtotalEl) subtotalEl.innerText = '0';
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, index) => {
        const qty = item.quantity || 1;
        const itemTotal = item.price * qty;
        total += itemTotal;
        return `
            <div class="card" style="padding: 20px; display: flex; align-items: center; gap: 20px;">
                <div style="width: 80px; height: 80px; background: #f9f9f9; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <img src="${item.image}" alt="${item.name}" style="max-width: 100%; max-height: 100%; border-radius: 4px;">
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-weight: 600; color: #333; font-size: 1.1rem; margin-bottom: 5px;">${item.name}</div>
                    <div style="color: #2e7d32; font-weight: 700;">₹${item.price} <span style="font-size:0.8rem; color:#666; font-weight:normal;">x ${qty}</span></div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-right: 15px;">
                    <button onclick="changeQuantity(${index}, -1)" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; background: white; cursor: pointer; display:flex; align-items:center; justify-content:center;">-</button>
                    <span style="font-weight: 600; min-width:20px; text-align:center;">${qty}</span>
                    <button onclick="changeQuantity(${index}, 1)" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; background: white; cursor: pointer; display:flex; align-items:center; justify-content:center;">+</button>
                </div>

                <button onclick="removeFromCart(${index}); showToast('Item removed')" style="color: #f44336; background: #ffebee; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" onmouseover="this.style.background='#ffcdd2'" onmouseout="this.style.background='white'">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.innerText = total;
    if (subtotalEl) subtotalEl.innerText = total;
}

function changeQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity = (cart[index].quantity || 1) + delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
            showToast("Item removed");
        }
        saveCart();
        loadCartPage();
        updateCartCount(); // Update cart count badge
    }
}
window.changeQuantity = changeQuantity;

/* --- ADDRESS SELECTION PAGE --- */
let selectedCheckoutAddress = null;

function loadAddressSelection() {
    const list = document.getElementById('addressList');
    const summary = document.getElementById('buyNowSummary');
    if (!list || !summary) return; // Not on select_address.html

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    const product = JSON.parse(localStorage.getItem('scrapkart_temp_checkout_item'));

    if (!product) {
        alert("No item selected for checkout.");
        window.location.href = 'dashboard.html';
        return;
    }

    // Render Summary
    summary.innerHTML = `
        <div style="display: flex; gap: 15px; align-items: center;">
            <img src="${product.image}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
            <div>
                <div style="font-weight: 600;">${product.name}</div>
                <div style="color: #2e7d32; font-weight: 700;">₹${product.price}</div>
            </div>
        </div>
    `;

    // Load Addresses
    firebase.database().ref('users/' + user.id + '/addresses').once('value').then(snapshot => {
        const addresses = snapshot.val();
        list.innerHTML = '';

        if (!addresses) {
            list.innerHTML = '<p style="text-align: center; color: #666;">No addresses found. <br><br> <a href="dashboard.html" onclick="localStorage.setItem(\'lastSection\', \'sell\')">Add Address in Dashboard</a></p>';
            return;
        }

        Object.entries(addresses).forEach(([id, addr]) => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.textAlign = 'left';
            div.style.padding = '20px';
            div.style.cursor = 'pointer';
            div.style.border = '2px solid transparent';
            div.onclick = () => selectAddress(id, div);

            div.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 5px;">${addr.name}</div>
                <div style="color: #555; font-size: 0.9rem;">${addr.text || (addr.components ? `${addr.components.addressLine1}, ${addr.components.city}` : 'Address')}</div>
                <div style="color: #666; font-size: 0.85rem; margin-top: 5px;">${addr.phone}</div>
            `;
            list.appendChild(div);
        });
    });
}

function selectAddress(id, element) {
    selectedCheckoutAddress = id;
    document.querySelectorAll('#addressList .card').forEach(c => {
        c.style.borderColor = 'transparent';
        c.style.backgroundColor = 'white';
    });
    element.style.borderColor = '#2e7d32';
    element.style.backgroundColor = '#f0fdf4';

    document.getElementById('confirmOrderBtn').disabled = false;
}

function addNewAddress() {
    // Redirect to dashboard sell section which has address form
    localStorage.setItem('lastSection', 'sell'); // Helper to open sell tab
    window.location.href = 'dashboard.html';
}

function confirmOrder() {
    if (!selectedCheckoutAddress) {
        alert("Please select an address");
        return;
    }

    // Save address for next step
    localStorage.setItem('scrapkart_checkout_address', selectedCheckoutAddress);
    window.location.href = 'payment.html';
}

// Windows Exports

/* --- PAYMENT PAGE --- */
let walletSelected = false;
let externalPaymentMethod = null;

function loadPaymentPage() {
    const summary = document.getElementById('paymentSummary');
    const balanceDisplay = document.getElementById('walletBalanceDisplay');
    if (!summary) return; // Not on payment.html

    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    const product = JSON.parse(localStorage.getItem('scrapkart_temp_checkout_item'));
    const addressId = localStorage.getItem('scrapkart_checkout_address');

    if (!product || !addressId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Display Wallet Balance
    if (balanceDisplay) balanceDisplay.innerText = user.wallet;

    // Initial Breakdown Update
    updatePaymentBreakdown();

    // Render Summary (Product + Address)
    firebase.database().ref('users/' + user.id + '/addresses/' + addressId).once('value').then(snapshot => {
        const addr = snapshot.val();
        const addressText = addr ? (addr.text || (addr.components ? `${addr.components.addressLine1}, ${addr.components.city}` : 'Unknown Address')) : 'Unknown Address';

        summary.innerHTML = `
            <div style="display: flex; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ddd;">
                <img src="${product.image}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
                <div>
                    <div style="font-weight: 600;">${product.name}</div>
                    <div style="color: #2e7d32; font-weight: 700;">₹${product.price}</div>
                </div>
            </div>
            <div>
                <div style="font-size: 0.85rem; color: #999; margin-bottom: 4px;">Delivering to:</div>
                <div style="font-weight: 500; font-size: 0.95rem; color: #333;">${addr ? addr.name : user.name}</div>
                <div style="color: #555; font-size: 0.9rem;">${addressText}</div>
                <div style="color: #666; font-size: 0.85rem;">${addr ? addr.phone : ''}</div>
            </div>
        `;
    });
}

function updatePaymentBreakdown() {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    const product = JSON.parse(localStorage.getItem('scrapkart_temp_checkout_item'));
    if (!user || !product) return;

    const breakdownDiv = document.getElementById('paymentBreakdown');
    const totalEl = document.getElementById('breakdownTotal');
    const walletUsedEl = document.getElementById('breakdownWallet');
    const payableEl = document.getElementById('breakdownPayable');
    const payBtn = document.getElementById('payBtn');
    const externalOptions = document.getElementById('externalPaymentOptions');
    const checkbox = document.getElementById('useWalletCheckbox');

    const total = parseFloat(product.price);
    const balance = parseFloat(user.wallet);

    let walletDeduction = 0;
    if (walletSelected) {
        walletDeduction = Math.min(total, balance);
        if (checkbox) checkbox.checked = true;
    } else {
        if (checkbox) checkbox.checked = false;
    }

    const remaining = total - walletDeduction;

    if (breakdownDiv) {
        breakdownDiv.style.display = walletSelected ? 'block' : 'none';
        if (totalEl) totalEl.innerText = '₹' + total;
        if (walletUsedEl) walletUsedEl.innerText = '- ₹' + walletDeduction;
        if (payableEl) payableEl.innerText = '₹' + remaining;
    }

    // Payment Button State & External Options
    if (remaining <= 0) {
        // Fully covered by wallet
        if (externalOptions) externalOptions.style.display = 'none';
        payBtn.disabled = false;
        payBtn.innerText = 'Pay Now (Wallet)';
    } else {
        // Need external payment
        if (externalOptions) externalOptions.style.display = 'block';
        if (externalPaymentMethod) {
            payBtn.disabled = false;
            payBtn.innerText = 'Pay ₹' + remaining;
        } else {
            payBtn.disabled = true;
            payBtn.innerText = 'Select Payment Method';
        }
    }
}

function toggleWallet(element) {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    const checkbox = document.getElementById('useWalletCheckbox');

    // Check balance if trying to enable
    if (checkbox.checked && (!user || parseFloat(user.wallet) <= 0)) {
        // Revert check immediately
        checkbox.checked = false;
        if (typeof showToast === 'function') {
            showToast("Insufficient wallet balance");
        } else {
            alert("Insufficient wallet balance");
        }
        return;
    }

    setTimeout(() => {
        walletSelected = checkbox.checked;

        const card = document.getElementById('walletCard');
        if (walletSelected) {
            card.style.borderColor = '#2e7d32';
            card.style.backgroundColor = '#f0fdf4';
        } else {
            card.style.borderColor = 'transparent';
            card.style.backgroundColor = 'white';
        }

        updatePaymentBreakdown();
    }, 10);
}

function selectExternalPayment(method, element) {
    externalPaymentMethod = method;
    document.querySelectorAll('#externalPaymentOptions .card').forEach(c => {
        c.style.borderColor = 'transparent';
        c.style.backgroundColor = 'white';
    });
    element.style.borderColor = '#2e7d32';
    element.style.backgroundColor = '#f0fdf4';

    // Make sure radio is checked (if clicking div)
    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;

    updatePaymentBreakdown();
}

function processPayment() {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    const product = JSON.parse(localStorage.getItem('scrapkart_temp_checkout_item'));

    // Explicitly recalculate logic to be safe
    const total = parseFloat(product.price);
    const balance = parseFloat(user.wallet);

    let walletDeduction = 0;
    if (walletSelected) {
        walletDeduction = Math.min(total, balance);
    }

    const remaining = total - walletDeduction;

    if (remaining > 0 && !externalPaymentMethod) {
        if (typeof showToast === 'function') showToast("Please select a payment method");
        else alert("Please select a payment method");
        return;
    }

    // Check wallet validity again
    if (walletSelected && walletDeduction > 0) {
        if (user.wallet < walletDeduction) {
            alert("Wallet balance insufficient. Please refresh.");
            return;
        }
    }

    // Payment Logic
    if (remaining > 0 && externalPaymentMethod === 'online') {
        // Razorpay Integration
        const options = {
            "key": RAZORPAY_KEY_ID,
            "amount": Math.round(remaining * 100), // Amount is in currency subunits (paise)
            "currency": "INR",
            "name": "Scrapkart",
            "description": "Order Payment",
            "image": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            "handler": function (response) {
                // Payment Success
                finalizeOrder(walletDeduction, remaining, 'online', response.razorpay_payment_id);
            },
            "prefill": {
                "name": user.name || "",
                "email": user.email || "",
                "contact": user.phone || ""
            },
            "theme": {
                "color": "#2e7d32"
            }
        };
        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            alert("Payment Failed: " + response.error.description);
        });
        rzp1.open();

    } else {
        // COD or Full Wallet
        finalizeOrder(walletDeduction, remaining, externalPaymentMethod || 'wallet', null);
    }
}

function finalizeOrder(walletDeduction, paidViaExternal, extMethod, transactionId) {
    const user = JSON.parse(localStorage.getItem('scrapkart_currentUser'));
    const product = JSON.parse(localStorage.getItem('scrapkart_temp_checkout_item'));
    const addressId = localStorage.getItem('scrapkart_checkout_address');

    // Deduct Wallet
    if (walletDeduction > 0) {
        updateWallet(walletDeduction, 'Debit', `Part-payment for ${product.name}`);
    }

    // Construct Payment Method String
    let payMethodStr = '';
    if (walletDeduction > 0 && paidViaExternal > 0) {
        payMethodStr = `Wallet + ${extMethod.toUpperCase()}`;
    } else if (walletDeduction > 0) {
        payMethodStr = 'Wallet';
    } else {
        payMethodStr = extMethod.toUpperCase();
    }

    if (transactionId) {
        payMethodStr += ` (Txn: ${transactionId})`;
    }

    // Place Order logic
    const promises = [];
    const date = new Date().toLocaleDateString();

    // Bundle or Single Logic
    if (product.isCart && product.items && Array.isArray(product.items)) {
        product.items.forEach((item, index) => {
            const newOrderRef = firebase.database().ref('users/' + user.id + '/orders').push();

            const order = {
                id: Date.now() + index,
                userId: user.id,
                type: 'buy',
                item: item.name,
                price: item.price * (item.quantity || 1),
                quantity: item.quantity || 1,
                date: date,
                status: (paidViaExternal > 0 && extMethod === 'cod') ? 'Ordered (COD)' : 'Purchased',
                paymentMethod: payMethodStr,
                addressId: addressId,
                isBundle: true
            };
            promises.push(newOrderRef.set(order));
        });

        // Clear Cart
        const cartKey = getCartKey();
        if (cartKey) localStorage.setItem(cartKey, '[]');

    } else {
        // Single Item
        const newOrderRef = firebase.database().ref('users/' + user.id + '/orders').push();
        const order = {
            id: Date.now(),
            userId: user.id,
            type: 'buy',
            item: product.name,
            price: product.price,
            paidViaWallet: walletDeduction,
            paidViaExternal: paidViaExternal,
            date: date,
            status: (paidViaExternal > 0 && extMethod === 'cod') ? 'Ordered (COD)' : 'Purchased',
            paymentMethod: payMethodStr,
            addressId: addressId
        };
        promises.push(newOrderRef.set(order));
    }

    Promise.all(promises).then(() => {
        // Cleanup
        localStorage.removeItem('scrapkart_temp_checkout_item');
        localStorage.removeItem('scrapkart_checkout_address');

        showToast("Order Placed Successfully!");

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }).catch(error => {
        alert("Error placing order: " + error.message);
    });
}

// Windows Exports
window.loadAddressSelection = loadAddressSelection;
window.selectAddress = selectAddress;
window.addNewAddress = addNewAddress;
window.confirmOrder = confirmOrder;
window.loadPaymentPage = loadPaymentPage;
window.toggleWallet = toggleWallet;
window.selectExternalPayment = selectExternalPayment;
window.processPayment = processPayment;
