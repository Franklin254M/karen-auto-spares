const SUPABASE_URL = 'https://dkgrrkkabfpfpjrqmjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bnljbGlobmpscGx3aW1ucHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDEzNzgsImV4cCI6MjEwNDMxNzM3OH0.OjlA6_jznzcxvb0k51f0wgwgbPA2qUuaICNrY0MSqXY';
const supabaseReady = SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
const client = supabaseReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentUser = null;
let currentProfile = null;
let products = [];
let sales = [];
let returns = [];
const offlineCacheKey = 'karen-spares-offline-cache';
const $ = (selector) => document.querySelector(selector);
const money = (value) => `KSh ${Number(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));

function toast(message) { const element = $('#toast'); element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2800); }
function loginMessage(message) { $('#login-message').textContent = message; }
function isAdmin() { return currentProfile?.role === 'admin'; }
function productImage(product) { return product.image_url ? `<img class="thumb" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">` : '<span class="thumb"></span>'; }

function readOfflineCache() { try { return JSON.parse(localStorage.getItem(offlineCacheKey)) || null; } catch { return null; } }
function pendingSyncStorageKey() { return `karen-spares-pending-sync:${currentUser?.id || 'anonymous'}`; }
function readPendingSync() { try { return JSON.parse(localStorage.getItem(pendingSyncStorageKey())) || []; } catch { return []; } }
function savePendingSync(queue) { localStorage.setItem(pendingSyncStorageKey(), JSON.stringify(queue)); }
function cacheSharedData() { localStorage.setItem(offlineCacheKey, JSON.stringify({ products, sales, returns, profile: currentProfile })); }
function queueSync(change) { const queue = readPendingSync(); queue.push(change); savePendingSync(queue); }
function isOfflineError(error) { return !navigator.onLine || /fetch|network|offline|failed to load/i.test(error?.message || ''); }

async function loadSharedData() {
  try {
    const productResult = await client.from('products').select('*').order('name');
    const salesQuery = isAdmin() ? client.from('sales').select('*, products(name, price, cost)').order('created_at', { ascending: false }) : client.from('sales').select('*, products(name, price, cost)').eq('agent_id', currentUser.id).order('created_at', { ascending: false });
    const salesResult = await salesQuery;
    const returnsQuery = isAdmin() ? client.from('returns').select('*, products(name)').order('created_at', { ascending: false }) : client.from('returns').select('*, products(name)').eq('agent_id', currentUser.id).order('created_at', { ascending: false });
    const returnsResult = await returnsQuery;
    if (productResult.error || salesResult.error || returnsResult.error) throw new Error(productResult.error?.message || salesResult.error?.message || returnsResult.error?.message);
    products = productResult.data || [];
    sales = salesResult.data || [];
    returns = returnsResult.data || [];
    cacheSharedData();
  } catch (error) {
    const cached = readOfflineCache();
    if (!cached || !isOfflineError(error)) throw error;
    products = cached.products || [];
    sales = cached.sales || [];
    returns = cached.returns || [];
    toast('Offline mode: showing the last saved inventory.');
  }
}

async function syncPendingChanges() {
  if (!client || !currentUser || !navigator.onLine) return;
  const queue = readPendingSync();
  if (!queue.length) return;
  const remaining = [];
  for (const change of queue) {
    const result = change.type === 'insert'
      ? await client.from('products').insert(change.values)
      : await client.from('products').update(change.values).eq('id', change.id);
    if (result.error) {
      remaining.push(change);
      if (isOfflineError(result.error)) break;
    }
  }
  savePendingSync(remaining);
  if (remaining.length !== queue.length) {
    await loadSharedData();
    toast(remaining.length ? 'Some offline changes are still waiting to sync.' : 'Offline inventory changes synced.');
    renderPage('inventory');
  }
}

async function signIn(event) {
  event.preventDefault();
  if (!supabaseReady) return loginMessage('Add your Supabase URL and anon key in online/app.js first.');
  loginMessage('Signing in...');
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: $('#email').value.trim(), password: $('#password').value });
    if (error) return loginMessage(error.message);
    currentUser = data.user;
    await startApp();
  } catch (error) {
    loginMessage(error instanceof Error ? error.message : 'Login failed. Check your connection and account details.');
  }
}

async function requestPasswordReset(event) {
  event.preventDefault();
  loginMessage('Sending reset link...');
  const { error } = await client.auth.resetPasswordForEmail($('#reset-email').value.trim(), { redirectTo: window.location.href.split('#')[0] });
  loginMessage(error ? error.message : 'Check your email for a password reset link.');
}

async function setNewPassword(event) {
  event.preventDefault();
  if ($('#new-password').value !== $('#confirm-password').value) return loginMessage('The passwords do not match.');
  loginMessage('Updating password...');
  const { error } = await client.auth.updateUser({ password: $('#new-password').value });
  if (error) return loginMessage(error.message);
  $('#reset-form').classList.add('hidden');
  $('#login-form').classList.remove('hidden');
  $('#forgot-password').classList.remove('hidden');
  $('#reset-form').reset();
  loginMessage('Password updated. You can now sign in.');
}

function showPasswordResetForm() {
  $('#login-form').classList.add('hidden');
  $('#forgot-password').classList.add('hidden');
  $('#forgot-form').classList.add('hidden');
  $('#reset-form').classList.remove('hidden');
  loginMessage('Choose a new password.');
}

function showLoginForm() {
  $('#login-form').classList.remove('hidden');
  $('#forgot-password').classList.remove('hidden');
  $('#forgot-form').classList.add('hidden');
  $('#reset-form').classList.add('hidden');
  loginMessage('');
}

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  $('#install-app').classList.remove('hidden');
});

$('#install-app').addEventListener('click', async () => {
  if (!installPrompt) return toast('Open the browser menu and choose Install app or Add to desktop.');
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $('#install-app').classList.add('hidden');
});

async function startApp() {
  try {
    const profileResult = await client.from('profiles').select('*').eq('id', currentUser.id).single();
    if (profileResult.error) throw profileResult.error;
    currentProfile = profileResult.data;
  } catch (error) {
    const cached = readOfflineCache();
    if (!cached?.profile || cached.profile.id !== currentUser.id || !isOfflineError(error)) {
      await client.auth.signOut();
      return loginMessage(error?.message?.includes('profile') ? error.message : 'Your Auth user exists, but its app profile is missing. Run the profile SQL in Supabase, then try again.');
    }
    currentProfile = cached.profile;
    toast('Offline mode: using your saved account.');
  }
  await loadSharedData();
  $('#login-view').classList.add('hidden');
  $('#app-view').classList.remove('hidden');
  $('#date-label').textContent = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date());
  $('#profile-name').textContent = currentProfile.full_name;
  $('#profile-role').textContent = currentProfile.role === 'admin' ? 'Administrator' : 'Sales agent';
  $('#profile-avatar').textContent = currentProfile.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  renderNavigation();
  renderPage(isAdmin() ? 'overview' : 'sales');
  syncPendingChanges();
}

function renderNavigation() {
  const links = isAdmin() ? [['overview', '⌂ Overview'], ['sales', '↗ Sales & receipts'], ['returns', '↩ Returns & warranty'], ['inventory', '▦ Inventory'], ['purchasing', '＋ Purchasing'], ['customers', '◎ Customers'], ['reports', '▤ Reports'], ['team', '◎ Team access']] : [['overview', '⌂ Overview'], ['sales', '↗ Sales & receipts'], ['returns', '↩ Returns & warranty']];
  $('#navigation').innerHTML = links.map(([view, label]) => `<button class="nav-button" data-online-view="${view}">${label}</button>`).join('');
  document.querySelectorAll('[data-online-view]').forEach((button) => button.addEventListener('click', () => renderPage(button.dataset.onlineView)));
}

function overviewPage() {
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const low = products.filter((product) => product.stock <= product.reorder_level);
  return `<div class="grid metrics"><div class="surface metric"><span>Shared revenue</span><strong>${money(revenue)}</strong><small>All agents</small></div><div class="surface metric"><span>Profit made</span><strong>${money(profit)}</strong><small>Recorded sales</small></div><div class="surface metric"><span>Expected profit</span><strong>${money(expectedProfit())}</strong><small>At current sell prices</small></div><div class="surface metric"><span>Returns</span><strong>${returns.length}</strong><small>Warranty and returns</small></div></div><div class="surface table-wrap"><div class="panel-head"><div><h3>Sales profit overview</h3><p class="sub">Actual profit compared with expected profit at current prices</p></div></div>${profitTable()}</div><div class="grid split"><div class="surface"><div class="panel-head"><div><h3>Low-stock purchase list</h3><p class="sub">Shared alerts from inventory</p></div><button class="action" data-online-view="inventory">Open inventory</button></div><div class="list">${low.length ? low.map((product) => `<div class="list-row">${productImage(product)}<div><strong>${escapeHtml(product.name)}</strong><small>${product.stock} left · buy ${product.reorder_level - product.stock} units</small></div><span class="status warn">Buy now</span></div>`).join('') : '<p class="sub">No low-stock parts.</p>'}</div></div><div class="surface"><div class="panel-head"><div><h3>Recent receipts</h3><p class="sub">Visible across the team</p></div></div><div class="list">${sales.slice(0, 5).map((sale) => `<div class="list-row"><span class="thumb"></span><div><strong>${escapeHtml(sale.products?.name || 'Part')}</strong><small>${sale.receipt_no} · ${sale.qty} units</small></div><strong>${money(sale.total)}</strong></div>`).join('')}</div></div></div>`;
}

function expectedProfit() { return sales.reduce((sum, sale) => sum + sale.qty * Number((sale.products?.price || 0) - (sale.products?.cost || 0)), 0); }
function profitTable() { return `<table class="table"><thead><tr><th>Receipt</th><th>Part</th><th>Qty</th><th>Sale total</th><th>Profit made</th><th>Expected profit</th></tr></thead><tbody>${sales.length ? sales.map((sale) => `<tr><td>${escapeHtml(sale.receipt_no)}</td><td>${escapeHtml(sale.products?.name || 'Part')}</td><td>${sale.qty}</td><td>${money(sale.total)}</td><td>${money(sale.profit)}</td><td>${money(sale.qty * Number((sale.products?.price || 0) - (sale.products?.cost || 0)))}</td></tr>`).join('') : '<tr><td colspan="6">No sales recorded yet.</td></tr>'}</tbody></table>`; }

function salesPage() { return `<div class="toolbar"><h3>${isAdmin() ? 'Sales & receipts' : 'Today’s sales'}</h3><button class="primary" id="online-sale">＋ Record sale</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Receipt</th><th>Part</th><th>Agent</th><th>Qty</th><th>Total</th><th>Profit made</th><th>Expected profit</th><th>Time</th></tr></thead><tbody>${sales.map((sale) => `<tr><td>${sale.receipt_no}</td><td>${escapeHtml(sale.products?.name || 'Part')}</td><td>${escapeHtml(sale.agent_name || 'Team member')}</td><td>${sale.qty}</td><td>${money(sale.total)}</td><td>${money(sale.profit)}</td><td>${money(sale.qty * Number((sale.products?.price || 0) - (sale.products?.cost || 0)))}</td><td>${new Date(sale.created_at).toLocaleString()}</td></tr>`).join('')}</tbody></table></div>`; }
function saleFormPage() { return `<div class="toolbar"><div><h3>Record sale</h3><p class="sub">The server checks stock, cost, price, and profit before saving.</p></div><button class="action" id="cancel-sale">Cancel</button></div><div class="surface"><form id="sale-form" class="modal-form"><div class="grid split"><label>Part<select id="sale-product" required><option value="">Select a part</option>${products.map((product) => `<option value="${product.id}" data-price="${product.price}" data-stock="${product.stock}">${escapeHtml(product.name)} · ${product.stock} available</option>`).join('')}</select></label><label>Quantity<input id="sale-quantity" type="number" min="1" step="1" value="1" required></label><label>Selling price per unit<input id="sale-price" type="number" min="0" step="0.01" required></label></div><button class="primary" type="submit">Save sale <span>→</span></button><p id="sale-message" class="message"></p></form></div>`; }
function inventoryPage() { return `<div class="toolbar"><h3>Shared inventory</h3><button class="primary" id="online-stock">＋ Receive new stock</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Part</th><th>Acronym</th><th>Barcode</th><th>Available</th><th>Incoming cost</th><th>Supplier</th><th>Sell price</th><th>Status</th><th></th></tr></thead><tbody>${products.map((product) => `<tr><td>${productImage(product)} ${escapeHtml(product.name)}</td><td>${escapeHtml(product.acronym)}</td><td>${escapeHtml(product.barcode)}</td><td>${product.stock}</td><td>${money(product.cost)}</td><td>${escapeHtml(product.supplier || '—')}</td><td>${money(product.price)}</td><td><span class="status ${product.stock <= product.reorder_level ? 'warn' : ''}">${product.stock <= product.reorder_level ? 'Buy now' : 'Healthy'}</span></td><td><button class="action" data-edit-product="${product.id}">Edit</button></td></tr>`).join('')}</tbody></table></div>`; }
function addStockPage() { return `<div class="toolbar"><div><h3>Receive new stock</h3><p class="sub">Add a new part and record where it came from.</p></div><button class="action" id="cancel-stock">Cancel</button></div><div class="surface"><form id="stock-form" class="modal-form"><div class="grid split"><label>Part name<input id="stock-name" required placeholder="e.g. Cabin air filter"></label><label>Acronym<input id="stock-acronym" required placeholder="e.g. CAF"></label><label>Barcode<input id="stock-barcode" required placeholder="Scan or enter barcode"></label><label>Category<input id="stock-category" value="General" required></label><label>Quantity received<input id="stock-quantity" type="number" min="0" step="1" value="0" required></label><label>Reorder level<input id="stock-reorder" type="number" min="0" step="1" value="5" required></label><label>Incoming cost<input id="stock-cost" type="number" min="0" step="0.01" value="0" required></label><label>Sell price<input id="stock-price" type="number" min="0" step="0.01" value="0" required></label><label>Supplier <span class="sub">(optional)</span><input id="stock-supplier" placeholder="Supplier name"></label><label>Image file <span class="sub">(optional, JPG/PNG/WebP/GIF)</span><input id="stock-image-file" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"></label><label>Image URL <span class="sub">(optional)</span><input id="stock-image" type="url" placeholder="https://..."></label></div><button class="primary" type="submit">Add to inventory <span>→</span></button><p id="stock-message" class="message"></p></form></div>`; }
function editProductPage(product) { return `<div class="toolbar"><div><h3>Edit stock</h3><p class="sub">Update this part in the shared inventory.</p></div><button class="action" id="cancel-edit">Cancel</button></div><div class="surface"><form id="edit-stock-form" class="modal-form"><div class="grid split"><label>Part name<input id="edit-name" value="${escapeHtml(product.name)}" required></label><label>Acronym<input id="edit-acronym" value="${escapeHtml(product.acronym)}" required></label><label>Barcode<input id="edit-barcode" value="${escapeHtml(product.barcode)}" required></label><label>Category<input id="edit-category" value="${escapeHtml(product.category)}" required></label><label>Available stock<input id="edit-quantity" type="number" min="0" step="1" value="${product.stock}" required></label><label>Reorder level<input id="edit-reorder" type="number" min="0" step="1" value="${product.reorder_level}" required></label><label>Incoming cost<input id="edit-cost" type="number" min="0" step="0.01" value="${product.cost}" required></label><label>Sell price<input id="edit-price" type="number" min="0" step="0.01" value="${product.price}" required></label><label>Supplier <span class="sub">(optional)</span><input id="edit-supplier" value="${escapeHtml(product.supplier || '')}" placeholder="Supplier name"></label><label>Image file <span class="sub">(optional, JPG/PNG/WebP/GIF)</span><input id="edit-image-file" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"></label><label>Image URL <span class="sub">(optional)</span><input id="edit-image" type="url" value="${escapeHtml(product.image_url || '')}" placeholder="https://..."></label></div><button class="primary" type="submit">Save changes <span>→</span></button><p id="edit-message" class="message"></p></form></div>`; }
function purchasingPage() { const low = products.filter((product) => product.stock <= product.reorder_level); return `<div class="toolbar"><div><h3>Purchasing control</h3><p class="sub">Parts below their reorder level need a new delivery.</p></div><button class="primary" id="online-purchase">＋ Receive new stock</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Part</th><th>Available</th><th>Reorder at</th><th>Suggested quantity</th><th>Supplier</th><th></th></tr></thead><tbody>${low.length ? low.map((product) => `<tr><td>${productImage(product)} ${escapeHtml(product.name)}</td><td>${product.stock}</td><td>${product.reorder_level}</td><td>${Math.max(product.reorder_level * 2 - product.stock, 1)}</td><td>${escapeHtml(product.supplier || 'Not set')}</td><td><button class="action" data-edit-product="${product.id}">Update</button></td></tr>`).join('') : '<tr><td colspan="6">No parts currently need purchasing.</td></tr>'}</tbody></table></div>`; }
function returnsPage() { return `<div class="toolbar"><div><h3>Returns & warranty</h3><p class="sub">Record customer returns, faulty parts, and warranty cases.</p></div><button class="primary" id="online-return">＋ Record return</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Part</th><th>Receipt</th><th>Qty</th><th>Reason</th><th>Status</th><th>Submitted</th></tr></thead><tbody>${returns.length ? returns.map((item) => `<tr><td>${escapeHtml(item.products?.name || 'Part')}</td><td>${escapeHtml(item.receipt_no || '—')}</td><td>${item.qty}</td><td>${escapeHtml(item.reason)}</td><td><span class="status ${item.status === 'Open' ? 'warn' : ''}">${escapeHtml(item.status)}</span></td><td>${new Date(item.created_at).toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="6">No returns or warranty cases recorded.</td></tr>'}</tbody></table></div>`; }
function returnFormPage() { return `<div class="toolbar"><div><h3>Record return or warranty case</h3><p class="sub">Submit the case for administrator follow-up.</p></div><button class="action" id="cancel-return">Cancel</button></div><div class="surface"><form id="return-form" class="modal-form"><div class="grid split"><label>Part<select id="return-product" required><option value="">Select a part</option>${products.map((product) => `<option value="${product.id}">${escapeHtml(product.name)}</option>`).join('')}</select></label><label>Receipt number <span class="sub">(optional)</span><input id="return-receipt" placeholder="e.g. SL-1048"></label><label>Quantity<input id="return-quantity" type="number" min="1" step="1" value="1" required></label><label>Type<select id="return-type" required><option>Return</option><option>Warranty</option></select></label><label>Reason<input id="return-reason" required placeholder="e.g. Faulty or wrong part"></label><label>Notes <span class="sub">(optional)</span><input id="return-notes" placeholder="Additional details"></label></div><button class="primary" type="submit">Submit case <span>→</span></button><p id="return-message" class="message"></p></form></div>`; }
function customersPage() { return `<div class="toolbar"><h3>Customers & vehicles</h3><button class="primary" id="online-customer">＋ Add customer</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Name</th><th>Phone</th><th>Vehicle</th><th>Visits</th></tr></thead><tbody><tr><td>Customer records are ready for the customers table.</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></div>`; }
function reportsPage() { const total = sales.reduce((sum, sale) => sum + sale.total, 0); return `<div class="toolbar"><h3>Reports</h3><button class="primary" onclick="window.print()">Print report</button></div><div class="grid metrics"><div class="surface metric"><span>Revenue</span><strong>${money(total)}</strong><small>Shared live data</small></div><div class="surface metric"><span>Profit</span><strong>${money(sales.reduce((sum, sale) => sum + sale.profit, 0))}</strong><small>Across receipts</small></div><div class="surface metric"><span>Units</span><strong>${sales.reduce((sum, sale) => sum + sale.qty, 0)}</strong><small>Moved</small></div><div class="surface metric"><span>Products</span><strong>${products.length}</strong><small>Catalog</small></div></div>`; }
function teamPage() { return `<div class="toolbar"><div><h3>Team access</h3><p class="sub">Invite sales agents without exposing passwords.</p></div></div><div class="surface"><div class="panel-head"><div><h3>Create sales-agent account</h3><p class="sub">Supabase sends the agent a secure email invitation.</p></div></div><form id="agent-form" class="modal-form"><div class="grid split"><label>Agent name<input id="agent-name" required placeholder="Sales agent name"></label><label>Agent email<input id="agent-email" type="email" required placeholder="agent@example.com"></label></div><button class="primary" type="submit">Send invitation <span>→</span></button><p id="agent-message" class="sub"></p></form></div>`; }

function renderPage(view, selectedProduct = null) {
  const titles = { overview: 'Good morning', sales: 'Sales & receipts', 'sale-form': 'Record sale', returns: 'Returns & warranty', 'return-form': 'Record return', inventory: 'Inventory', 'add-stock': 'Add stock', 'edit-stock': 'Edit stock', purchasing: 'Purchasing', customers: 'Customers & vehicles', reports: 'Reports', team: 'Team access' };
  $('#page-title').textContent = titles[view];
  $('#page-content').innerHTML = ({ overview: overviewPage, sales: salesPage, 'sale-form': saleFormPage, returns: returnsPage, 'return-form': returnFormPage, inventory: inventoryPage, 'add-stock': addStockPage, 'edit-stock': () => editProductPage(selectedProduct), purchasing: purchasingPage, customers: customersPage, reports: reportsPage, team: teamPage }[view])();
  document.querySelectorAll('[data-online-view]').forEach((button) => button.classList.toggle('active', button.dataset.onlineView === view));
  document.querySelectorAll('[data-online-view="inventory"]').forEach((button) => button.addEventListener('click', () => renderPage('inventory')));
  document.querySelectorAll('[data-edit-product]').forEach((button) => button.addEventListener('click', () => {
    const product = products.find((item) => String(item.id) === button.dataset.editProduct);
    if (product) renderPage('edit-stock', product);
  }));
  $('#online-sale')?.addEventListener('click', () => renderPage('sale-form'));
  $('#cancel-sale')?.addEventListener('click', () => renderPage('sales'));
  $('#sale-product')?.addEventListener('change', (event) => { const option = event.target.selectedOptions[0]; if (option?.dataset.price) $('#sale-price').value = Number(option.dataset.price).toFixed(2); });
  $('#online-stock')?.addEventListener('click', () => { if (isAdmin()) renderPage('add-stock'); else toast('Only administrators can add stock.'); });
  $('#online-return')?.addEventListener('click', () => renderPage('return-form'));
  $('#cancel-return')?.addEventListener('click', () => renderPage('returns'));
  $('#cancel-stock')?.addEventListener('click', () => renderPage('inventory'));
  $('#cancel-edit')?.addEventListener('click', () => renderPage('inventory'));
  $('#online-purchase')?.addEventListener('click', () => { if (isAdmin()) renderPage('add-stock'); else toast('Only administrators can receive stock.'); });
  $('#online-customer')?.addEventListener('click', () => toast('Customer records are ready for the shared database table.'));
  $('#agent-form')?.addEventListener('submit', inviteSalesAgent);
  $('#stock-form')?.addEventListener('submit', addStock);
  $('#edit-stock-form')?.addEventListener('submit', (event) => updateStock(event, selectedProduct));
  $('#return-form')?.addEventListener('submit', submitReturn);
  $('#sale-form')?.addEventListener('submit', submitSale);
}

async function submitSale(event) {
  event.preventDefault();
  const message = $('#sale-message');
  const productId = Number($('#sale-product').value);
  const qty = Number($('#sale-quantity').value);
  const salePrice = Number($('#sale-price').value);
  if (!Number.isInteger(qty) || qty < 1) return message.textContent = 'Quantity must be a whole number of 1 or more.';
  if (!Number.isFinite(salePrice) || salePrice < 0) return message.textContent = 'Enter a valid selling price.';
  message.textContent = 'Saving sale...';
  const { error } = await client.rpc('record_sale', { p_product_id: productId, p_qty: qty, p_sale_price: salePrice });
  if (error) return message.textContent = error.message;
  await loadSharedData();
  toast('Sale recorded and stock updated.');
  renderPage('sales');
}

async function submitReturn(event) {
  event.preventDefault();
  const message = $('#return-message');
  const values = { p_product_id: Number($('#return-product').value), p_receipt_no: $('#return-receipt').value.trim() || null, p_qty: Number($('#return-quantity').value), p_type: $('#return-type').value, p_reason: $('#return-reason').value.trim(), p_notes: $('#return-notes').value.trim() || null };
  if (!Number.isInteger(values.p_qty) || values.p_qty < 1) return message.textContent = 'Quantity must be a whole number of 1 or more.';
  message.textContent = 'Submitting case...';
  const { error } = await client.rpc('record_return', values);
  if (error) return message.textContent = error.message;
  await loadSharedData();
  toast('Return or warranty case recorded.');
  renderPage('returns');
}

async function addStock(event) {
  event.preventDefault();
  const message = $('#stock-message');
  const uploadedImage = navigator.onLine ? await uploadProductImage('stock-image-file', message) : null;
  if (uploadedImage === false) return;
  const values = {
    name: $('#stock-name').value.trim(),
    acronym: $('#stock-acronym').value.trim().toUpperCase(),
    barcode: $('#stock-barcode').value.trim(),
    category: $('#stock-category').value.trim(),
    stock: Number($('#stock-quantity').value),
    reorder_level: Number($('#stock-reorder').value),
    cost: Number($('#stock-cost').value),
    price: Number($('#stock-price').value),
    supplier: $('#stock-supplier').value.trim() || null,
    image_url: uploadedImage || $('#stock-image').value.trim() || null
  };
  if (![values.stock, values.reorder_level].every((value) => Number.isInteger(value) && value >= 0)) {
    message.textContent = 'Stock and reorder level must be whole numbers of 0 or more.';
    return;
  }
  if (values.price < values.cost) {
    message.textContent = `Sell price cannot be below incoming cost (${money(values.cost)}).`;
    return;
  }
  message.textContent = navigator.onLine ? 'Adding stock...' : 'Saving stock on this laptop...';
  const { error } = navigator.onLine ? await client.from('products').insert(values) : { error: { message: 'offline', code: 'OFFLINE' } };
  if (error) {
    if (!isOfflineError(error)) {
      message.textContent = error.code === '23505' ? 'That barcode already belongs to a product.' : error.message;
      return;
    }
    queueSync({ type: 'insert', values });
    products.push({ ...values, id: `offline-${Date.now()}` });
    cacheSharedData();
    toast('Saved offline. It will sync when internet returns.');
    return renderPage('inventory');
  }
  await loadSharedData();
  toast(`${values.name} added to inventory.`);
  renderPage('inventory');
}

async function updateStock(event, product) {
  event.preventDefault();
  const message = $('#edit-message');
  const uploadedImage = navigator.onLine ? await uploadProductImage('edit-image-file', message) : null;
  if (uploadedImage === false) return;
  const values = {
    name: $('#edit-name').value.trim(),
    acronym: $('#edit-acronym').value.trim().toUpperCase(),
    barcode: $('#edit-barcode').value.trim(),
    category: $('#edit-category').value.trim(),
    stock: Number($('#edit-quantity').value),
    reorder_level: Number($('#edit-reorder').value),
    cost: Number($('#edit-cost').value),
    price: Number($('#edit-price').value),
    supplier: $('#edit-supplier').value.trim() || null,
    image_url: uploadedImage || $('#edit-image').value.trim() || product.image_url || null
  };
  if (![values.stock, values.reorder_level].every((value) => Number.isInteger(value) && value >= 0)) {
    message.textContent = 'Stock and reorder level must be whole numbers of 0 or more.';
    return;
  }
  if (values.price < values.cost) {
    message.textContent = `Sell price cannot be below incoming cost (${money(values.cost)}).`;
    return;
  }
  message.textContent = navigator.onLine ? 'Saving changes...' : 'Saving changes on this laptop...';
  const { error } = navigator.onLine ? await client.from('products').update(values).eq('id', product.id) : { error: { message: 'offline', code: 'OFFLINE' } };
  if (error) {
    if (!isOfflineError(error)) {
      message.textContent = error.code === '23505' ? 'That barcode already belongs to another product.' : error.message;
      return;
    }
    Object.assign(product, values);
    queueSync({ type: 'update', id: product.id, values });
    cacheSharedData();
    toast('Saved offline. It will sync when internet returns.');
    return renderPage('inventory');
  }
  await loadSharedData();
  toast(`${values.name} updated.`);
  renderPage('inventory');
}

async function uploadProductImage(inputId, message) {
  const file = $(`#${inputId}`)?.files[0];
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) {
    message.textContent = 'Image must be smaller than 5 MB.';
    return false;
  }
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    message.textContent = 'Only JPG, PNG, WebP, or GIF image files are allowed.';
    return false;
  }
  message.textContent = 'Uploading image...';
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await client.storage.from('product-images').upload(path, file, { upsert: false, contentType: file.type });
  if (error) {
    message.textContent = error.message;
    return false;
  }
  return client.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

async function inviteSalesAgent(event) {
  event.preventDefault();
  const message = $('#agent-message');
  message.textContent = 'Sending invitation...';
  try {
    const session = (await client.auth.getSession()).data.session;
    if (!session) return message.textContent = 'Your administrator session expired. Sign in again.';
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-sales-agent`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('#agent-email').value.trim(), full_name: $('#agent-name').value.trim() }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return message.textContent = result.error || `Invitation failed (${response.status}). Deploy the create-sales-agent function in Supabase.`;
    message.textContent = 'Invitation sent. The agent will create their own password securely.';
    event.target.reset();
  } catch (error) {
    message.textContent = error instanceof Error ? `${error.message} Deploy the create-sales-agent function in Supabase.` : 'Invitation failed. Check the Edge Function deployment.';
  }
}

$('#login-form').addEventListener('submit', signIn);
$('#forgot-password').addEventListener('click', () => { $('#login-form').classList.add('hidden'); $('#forgot-password').classList.add('hidden'); $('#forgot-form').classList.remove('hidden'); $('#reset-email').value = $('#email').value; });
$('#forgot-form').addEventListener('submit', requestPasswordReset);
$('#reset-form').addEventListener('submit', setNewPassword);
$('#back-to-login-from-forgot').addEventListener('click', showLoginForm);
$('#back-to-login-from-reset').addEventListener('click', showLoginForm);
$('#sign-out').addEventListener('click', async () => { await client?.auth.signOut(); currentUser = null; currentProfile = null; $('#app-view').classList.add('hidden'); $('#login-view').classList.remove('hidden'); });
if (!supabaseReady) loginMessage('Online version setup: add Supabase URL and anon key in online/app.js.');
navigator.serviceWorker?.register('sw.js');
client?.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') showPasswordResetForm(); });
window.addEventListener('online', syncPendingChanges);
client?.auth.getSession().then(({ data }) => {
  if (data.session) {
    currentUser = data.session.user;
    startApp();
  }
});
