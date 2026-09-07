const seed = {
  business: 'Karen Auto Spares',
  lowStockVersion: 2,
  user: null,
  products: [
    { id: 1, name: 'Front brake pads', acronym: 'FBP', barcode: '600100100001', sku: 'BRK-001', category: 'Braking', stock: 28, reorder: 8, cost: 24, price: 39.9, image: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=160&q=80' },
    { id: 2, name: 'Engine oil 5W-30', acronym: 'OIL', barcode: '600100100002', sku: 'OIL-005', category: 'Lubricants', stock: 46, reorder: 12, cost: 18, price: 29.5, image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=160&q=80' },
    { id: 3, name: 'Spark plugs', acronym: 'SPK', barcode: '600100100003', sku: 'IGN-003', category: 'Ignition', stock: 64, reorder: 16, cost: 6.5, price: 12.9, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=160&q=80' },
    { id: 4, name: 'Air filter', acronym: 'AF', barcode: '600100100004', sku: 'FLT-004', category: 'Filters', stock: 8, reorder: 10, cost: 11, price: 21.5, image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=160&q=80' },
    { id: 5, name: 'Wiper blades 22 inch', acronym: 'WB22', barcode: '600100100005', sku: 'VIS-022', category: 'Visibility', stock: 7, reorder: 10, cost: 8, price: 16.5, image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=160&q=80' },
    { id: 6, name: 'Battery 12V 60Ah', acronym: 'BAT60', barcode: '600100100006', sku: 'BAT-060', category: 'Electrical', stock: 3, reorder: 5, cost: 72, price: 109, image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=160&q=80' }
  ],
  sales: [
    { id: 'SL-1048', product: 'Front brake pads', agent: 'Amina M.', qty: 3, total: 119.7, profit: 47.7, time: '09:42' },
    { id: 'SL-1047', product: 'Engine oil 5W-30', agent: 'Jon Bell', qty: 2, total: 59, profit: 23, time: '09:16' },
    { id: 'SL-1046', product: 'Spark plugs', agent: 'Amina M.', qty: 4, total: 51.6, profit: 25.6, time: '08:55' },
    { id: 'SL-1045', product: 'Air filter', agent: 'Maya K.', qty: 2, total: 43, profit: 21, time: 'Yesterday' }
  ],
  prices: [
    { product: 'Front brake pads', market: '$41.00', current: '$39.90', change: '+4.8%', direction: 'up', note: 'Supplier price rising' },
    { product: 'Engine oil 5W-30', market: '$28.00', current: '$29.50', change: '-2.1%', direction: 'down', note: 'Demand softened this week' },
    { product: 'Battery 12V 60Ah', market: '$115.00', current: '$109.00', change: '+1.4%', direction: 'up', note: 'Holiday demand building' }
  ],
  suppliers: [
    { id: 1, name: 'Metro Parts Wholesale', contact: '+254 700 110 220', lead: '2 days', status: 'Preferred' },
    { id: 2, name: 'DriveLine Imports', contact: '+254 711 440 901', lead: '5 days', status: 'Active' }
  ],
  purchases: [
    { id: 'PO-204', supplier: 'Metro Parts Wholesale', items: 3, total: 298, status: 'Draft', date: 'Today' },
    { id: 'PO-203', supplier: 'DriveLine Imports', items: 12, total: 864, status: 'Received', date: 'Sep 03' }
  ],
  customers: [
    { id: 1, name: 'Peter Mwangi', phone: '+254 722 301 408', vehicle: 'KDA 482L · Toyota Fielder', visits: 4, last: 'Today' },
    { id: 2, name: 'Njeri Auto Clinic', phone: '+254 733 220 187', vehicle: 'Fleet account', visits: 12, last: 'Yesterday' }
  ],
  returns: [
    { id: 'RT-019', receipt: 'SL-1042', product: 'Wiper blades 22 inch', customer: 'Peter Mwangi', reason: 'Wrong size', status: 'Open', date: 'Today' }
  ],
  audit: [
    { action: 'Stock intake recorded', detail: 'Front brake pads · +4 units', user: 'Amina M.', time: '10:12' },
    { action: 'Sale recorded', detail: 'Engine oil 5W-30 · 2 units', user: 'Jon Bell', time: '09:16' }
  ],
  notifications: [
    { title: '3 parts need purchasing', detail: 'Air filter, wipers, and battery are below reorder level.', type: 'Stock' },
    { title: 'Supplier delivery due', detail: 'Metro Parts Wholesale · PO-204 expected in 2 days.', type: 'Purchase' }
  ]
};

const savedState = JSON.parse(localStorage.getItem('ledgerly-state'));
let state = savedState?.business === seed.business ? savedState : seed;
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const persist = () => localStorage.setItem('ledgerly-state', JSON.stringify(state));

if (state.business === seed.business && state.lowStockVersion !== seed.lowStockVersion) {
  state.products.forEach((item) => {
    const canonicalProduct = seed.products.find((product) => product.id === item.id);
    if (canonicalProduct) item.image = canonicalProduct.image;
  });
  state.products.filter((item) => item.acronym === 'AF').forEach((item) => { item.stock = 8; });
  state.products.filter((item) => item.acronym === 'WB22').forEach((item) => { item.stock = 7; });
  state.products.filter((item) => item.acronym === 'BAT60').forEach((item) => { item.stock = 3; });
  state.lowStockVersion = seed.lowStockVersion;
  persist();
}
state.suppliers ||= seed.suppliers;
state.purchases ||= seed.purchases;
state.customers ||= seed.customers;
state.returns ||= seed.returns;
state.audit ||= seed.audit;
state.notifications ||= seed.notifications;
persist();
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));

const loginScreen = $('#login-screen');
const app = $('#app');
const viewContainer = $('#view-container');
const toast = $('#toast');
let toastTimer;
let scannerStream = null;
let installPrompt = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  $('#install-button')?.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  $('#install-button')?.classList.add('hidden');
  showToast('Karen Auto Spares was installed.');
});

$('#install-button')?.addEventListener('click', async () => {
  if (!installPrompt) return showToast('Use your browser menu and choose Install app.');
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $('#install-button').classList.add('hidden');
});

function stopScanner() {
  scannerStream?.getTracks().forEach((track) => track.stop());
  scannerStream = null;
}

function formatToday() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
}

function userFromDetails(name, email, role) {
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return { name, email, initials, role: role === 'admin' ? 'Administrator' : 'Sales agent', isAdmin: role === 'admin' };
}

function productImage(product) {
  return `<img class="product-image" src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">`;
}

function productMatches(product, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [product.name, product.acronym, product.barcode, product.sku].some((value) => value.toLowerCase().includes(needle));
}

function lowStockItems() {
  return state.products.filter((item) => item.stock <= item.reorder);
}

function lowStockRows() {
  return lowStockItems().map((item) => `<div class="low-stock-row">${productImage(item)}<div><strong>${escapeHtml(item.name)}</strong><span>${item.stock} left · buy ${item.reorder - item.stock} units</span></div><button class="text-button" data-stock-part="${item.id}">Add stock</button></div>`).join('');
}

function signIn(event) {
  event.preventDefault();
  const name = $('#login-name').value.trim();
  const email = $('#login-email').value.trim().toLowerCase();
  const role = $('#login-role').value;
  state.user = userFromDetails(name, email, role);
  persist();
  bootApp();
}

function bootApp() {
  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');
  $('#today-line').textContent = formatToday();
  $('#profile-name').textContent = state.user.name;
  $('#profile-role').textContent = state.user.role;
  $('#profile-avatar').textContent = state.user.initials;
  document.querySelector('.nav-item[data-view="team"]').classList.toggle('hidden', !state.user.isAdmin);
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => {
    const agentAllowed = button.dataset.view === 'sales';
    button.classList.toggle('hidden', !state.user.isAdmin && !agentAllowed);
  });
  setView(state.user.isAdmin ? 'overview' : 'sales');
}

function metricCard(label, value, change, warning = false) {
  return `<div class="metric"><div class="metric-label">${label}<span>•••</span></div><strong class="metric-value">${value}</strong><span class="metric-change ${warning ? 'warn' : ''}">${change}</span></div>`;
}

function saleRows(limit = 4) {
  return state.sales.slice(0, limit).map((sale) => { const product = state.products.find((item) => item.name === sale.product); return `<div class="sale-line">${product ? productImage(product) : `<div class="product-icon">${sale.product.charAt(0)}</div>`}<div><strong>${escapeHtml(sale.product)}</strong><span>${escapeHtml(sale.agent)} · ${sale.qty} units · ${sale.time}</span></div><strong class="sale-amount">${money(sale.total)}</strong></div>`; }).join('');
}

function overviewView() {
  const revenue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = state.sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalStock = state.products.reduce((sum, item) => sum + item.stock, 0);
  return `<div class="overview-grid">
    <div class="metric-row">${metricCard('Revenue today', money(revenue), '↑ 12.6% vs yesterday')}${metricCard('Gross profit', money(profit), '↑ 8.2% vs yesterday')}${metricCard('Units sold', '21', '↑ 14 units today')}${metricCard('Parts to buy', String(lowStockItems().length).padStart(2, '0'), 'Needs attention', true)}</div>
    <div class="dashboard-columns"><div class="surface"><div class="surface-header"><div><h3>Revenue pulse</h3><p class="surface-sub">Sales performance over the last 7 days</p></div><button class="text-button">This week⌄</button></div><div class="chart-wrap"><div class="chart"><svg viewBox="0 0 650 190" preserveAspectRatio="none"><path d="M0 157 C58 145 75 152 120 119 S180 127 220 94 S272 126 320 79 S382 106 430 57 S491 90 535 38 S590 57 650 12" fill="none" stroke="#1f6a62" stroke-width="3"/><path d="M0 157 C58 145 75 152 120 119 S180 127 220 94 S272 126 320 79 S382 106 430 57 S491 90 535 38 S590 57 650 12 V190 H0 Z" fill="url(#chartFill)" opacity=".55"/><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#b6ddca"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><circle cx="535" cy="38" r="5" fill="#e8785f" stroke="#fff" stroke-width="3"/></svg></div><div class="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Today</span></div></div></div>
      <div class="surface"><div class="surface-header"><div><h3>Top sellers</h3><p class="surface-sub">By revenue this week</p></div><button class="text-button" data-view-jump="sales">View all</button></div><div class="sales-list">${saleRows(4)}</div></div></div>
    <div class="dashboard-columns"><div class="surface"><div class="surface-header"><div><h3>Stock health</h3><p class="surface-sub">${totalStock} total units across 6 products</p></div><button class="text-button" data-view-jump="inventory">Manage stock</button></div><div class="progress-list">${state.products.slice(0, 4).map((item) => `<div class="progress-row"><div class="progress-name"><strong>${escapeHtml(item.name)}</strong><span>${item.stock} in stock</span></div><div class="progress-track"><div class="progress-fill ${item.stock <= item.reorder ? 'low' : ''}" style="width:${Math.min(item.stock / (item.reorder * 3) * 100, 100)}%"></div></div></div>`).join('')}</div></div><div class="surface"><div class="surface-header"><div><h3>Buy next</h3><p class="surface-sub">Low stock parts needing purchase</p></div><button class="text-button" data-view-jump="inventory">Open inventory</button></div><div class="low-stock-list">${lowStockRows() || '<p class="empty-state">All parts are stocked above their reorder levels.</p>'}</div></div></div>
  </div>`;
}

function inventoryView() {
  return `<div class="section-head"><div><p class="section-kicker">${state.business}</p><h3>Inventory control</h3></div><button class="button button-primary" id="add-stock-button">＋ Add stock</button></div><div class="surface table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Acronym</th><th>Barcode</th><th>Available</th><th>Unit cost</th><th>Sell price</th><th>Status</th></tr></thead><tbody>${state.products.map((item) => `<tr><td class="product-cell">${productImage(item)}<strong>${escapeHtml(item.name)}</strong></td><td class="mono muted">${item.acronym}</td><td class="mono muted">${item.barcode}</td><td class="mono">${item.stock}</td><td class="mono">${money(item.cost)}</td><td class="mono">${money(item.price)}</td><td><span class="stock-pill ${item.stock <= item.reorder ? 'low' : ''}">${item.stock <= item.reorder ? 'Reorder soon' : 'Healthy'}</span></td></tr>`).join('')}</tbody></table></div>`;
}

function salesView() {
  const visibleSales = state.user.isAdmin ? state.sales : state.sales.filter((sale) => sale.time !== 'Yesterday');
  return `<div class="section-head"><div><p class="section-kicker">${state.user.isAdmin ? 'Transactions' : 'Today only'}</p><h3>Sales & receipts</h3></div><button class="button button-primary" id="sales-page-new">＋ Record sale</button></div><div class="surface table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Product</th><th>Sales agent</th><th>Quantity</th><th>Total</th><th>Profit</th><th>Timestamp</th><th></th></tr></thead><tbody>${visibleSales.map((sale) => `<tr><td class="mono">${sale.id}</td><td><strong>${escapeHtml(sale.product)}</strong></td><td class="muted">${escapeHtml(sale.agent)}</td><td class="mono">${sale.qty}</td><td class="mono">${money(sale.total)}</td><td class="mono trend-up">${money(sale.profit)}</td><td class="mono muted">${sale.time}</td><td><button class="text-button" data-print-receipt="${sale.id}">Print</button></td></tr>`).join('')}</tbody></table></div>`;
}

function pricesView() {
  return `<div class="section-head"><div><p class="section-kicker">Planning</p><h3>Price watch</h3></div><button class="button button-primary" id="add-price-button">＋ Add price alert</button></div><div class="price-grid">${state.prices.map((item) => `<div class="surface price-card"><div class="price-head"><span class="stock-pill ${item.direction === 'down' ? 'low' : ''}">${item.direction === 'up' ? 'Market rising' : 'Market easing'}</span><span class="mono ${item.direction === 'up' ? 'trend-up' : 'trend-down'}">${item.change}</span></div><h4>${escapeHtml(item.product)}</h4><div><span class="price-value">${item.current}</span><span class="muted"> current</span></div><p class="price-meta">Market reference ${item.market} · ${item.note}</p></div>`).join('')}</div>`;
}

function teamView() {
  const people = [{ initials: 'AM', name: 'Amina M.', role: 'Administrator', status: 'Full access' }, { initials: 'JB', name: 'Jon Bell', role: 'Sales agent', status: 'Sales & receipts' }, { initials: 'MK', name: 'Maya K.', role: 'Sales agent', status: 'Sales & receipts' }];
  return `<div class="section-head"><div><p class="section-kicker">Workspace settings</p><h3>Team access</h3></div><button class="button button-primary" id="invite-button">＋ Invite member</button></div><p class="permission-note">Administrators can manage stock, prices, team access, and all reports. Sales agents can record sales and view their receipts.</p><div class="team-grid">${people.map((person) => `<div class="surface team-card"><div class="avatar">${person.initials}</div><div><h4>${person.name}</h4><p>${person.role} · ${person.status}</p></div></div>`).join('')}</div>`;
}

function purchasingView() {
  return `<div class="section-head"><div><p class="section-kicker">Procurement</p><h3>Purchasing & suppliers</h3></div><button class="button button-primary" id="new-purchase-button">＋ New purchase order</button></div><div class="dashboard-columns"><div class="surface"><div class="surface-header"><div><h3>Purchase orders</h3><p class="surface-sub">Track parts from order to receiving</p></div><span class="stock-pill low">${state.purchases.filter((item) => item.status === 'Draft').length} draft</span></div><div class="sales-list">${state.purchases.map((order) => `<div class="sale-line"><div class="product-icon">PO</div><div><strong>${order.id} · ${escapeHtml(order.supplier)}</strong><span>${order.items} line items · ${order.date}</span></div><strong class="sale-amount">${money(order.total)}</strong></div>`).join('')}</div></div><div class="surface"><div class="surface-header"><div><h3>Suppliers</h3><p class="surface-sub">Your trusted parts network</p></div></div><div class="sales-list">${state.suppliers.map((supplier) => `<div class="sale-line"><div class="product-icon">${supplier.name.charAt(0)}</div><div><strong>${escapeHtml(supplier.name)}</strong><span>${supplier.contact} · ${supplier.lead} lead time</span></div><span class="stock-pill">${supplier.status}</span></div>`).join('')}</div></div></div>`;
}

function customersView() {
  return `<div class="section-head"><div><p class="section-kicker">Relationships</p><h3>Customers & vehicles</h3></div><button class="button button-primary" id="new-customer-button">＋ Add customer</button></div><div class="surface table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Vehicle</th><th>Visits</th><th>Last visit</th></tr></thead><tbody>${state.customers.map((customer) => `<tr><td><strong>${escapeHtml(customer.name)}</strong></td><td class="mono muted">${customer.phone}</td><td>${escapeHtml(customer.vehicle)}</td><td class="mono">${customer.visits}</td><td class="muted">${customer.last}</td></tr>`).join('')}</tbody></table></div>`;
}

function reportsView() {
  const revenue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = state.sales.reduce((sum, sale) => sum + sale.profit, 0);
  const units = state.sales.reduce((sum, sale) => sum + sale.qty, 0);
  return `<div class="section-head"><div><p class="section-kicker">Business intelligence</p><h3>Reports</h3></div><button class="button button-primary" id="print-report-button">Print report</button></div><div class="metric-row">${metricCard('Sales revenue', money(revenue), 'Current records')}${metricCard('Gross profit', money(profit), `${Math.round((profit / revenue) * 100)}% margin`)}${metricCard('Units moved', units, 'Across all receipts')}${metricCard('Inventory value', money(state.products.reduce((sum, item) => sum + item.stock * item.cost, 0)), 'At cost')}</div><div class="surface report-summary"><div class="surface-header"><div><h3>Best-selling parts</h3><p class="surface-sub">Sales volume by product</p></div></div><div class="progress-list">${state.products.map((product) => { const sold = state.sales.filter((sale) => sale.product === product.name).reduce((sum, sale) => sum + sale.qty, 0); return `<div class="progress-row"><div class="progress-name"><strong>${escapeHtml(product.name)}</strong><span>${sold} units sold</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(sold * 8, 100)}%"></div></div></div>`; }).join('')}</div></div>`;
}

function returnsView() {
  return `<div class="section-head"><div><p class="section-kicker">After-sales</p><h3>Returns & warranty</h3></div><button class="button button-primary" id="new-return-button">＋ Log return</button></div><div class="surface table-wrap"><table class="data-table"><thead><tr><th>Return</th><th>Receipt</th><th>Part</th><th>Customer</th><th>Reason</th><th>Status</th></tr></thead><tbody>${state.returns.map((item) => `<tr><td class="mono">${item.id}</td><td class="mono muted">${item.receipt}</td><td><strong>${escapeHtml(item.product)}</strong></td><td>${escapeHtml(item.customer)}</td><td class="muted">${item.reason}</td><td><span class="stock-pill low">${item.status}</span></td></tr>`).join('')}</tbody></table></div>`;
}

function activityView() {
  return `<div class="section-head"><div><p class="section-kicker">Accountability</p><h3>Activity log</h3></div><span class="live-pill">Live history</span></div><div class="surface sales-list">${state.audit.map((event) => `<div class="sale-line"><div class="product-icon">◷</div><div><strong>${escapeHtml(event.action)}</strong><span>${escapeHtml(event.detail)} · ${escapeHtml(event.user)}</span></div><span class="mono muted">${event.time}</span></div>`).join('')}</div>`;
}

function openSimpleModal(type) {
  const config = {
    purchase: { title: 'New purchase order', button: 'Create purchase order', fields: '<label>Supplier<select id="simple-supplier">' + state.suppliers.map((item) => `<option>${escapeHtml(item.name)}</option>`).join('') + '</select></label><label>Part and quantity<input id="simple-detail" placeholder="e.g. BAT60 x 10" required></label>' },
    customer: { title: 'Add customer and vehicle', button: 'Save customer', fields: '<div class="form-grid"><label>Customer name<input id="simple-name" required></label><label>Phone<input id="simple-phone" required></label></div><label>Vehicle registration and model<input id="simple-detail" placeholder="e.g. KDA 482L · Toyota Fielder" required></label>' },
    return: { title: 'Log return or warranty claim', button: 'Save return', fields: '<div class="form-grid"><label>Receipt number<input id="simple-name" placeholder="SL-0000" required></label><label>Part<input id="simple-detail" required></label></div><label>Reason<input id="simple-reason" placeholder="Wrong size, faulty, warranty" required></label>' }
  }[type];
  $('#modal-root').innerHTML = `<div class="modal-backdrop" id="simple-modal"><div class="modal"><div class="modal-header"><h3>${config.title}</h3><button class="close-button" data-close-modal>×</button></div><form class="modal-form" id="simple-form">${config.fields}<button class="button button-primary button-wide" type="submit">${config.button} <span>→</span></button></form></div></div>`;
  $('#simple-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (type === 'purchase') state.purchases.unshift({ id: `PO-${204 + state.purchases.length + 1}`, supplier: $('#simple-supplier').value, items: 1, total: 0, status: 'Draft', date: 'Today' });
    if (type === 'customer') state.customers.unshift({ id: Date.now(), name: $('#simple-name').value, phone: $('#simple-phone').value, vehicle: $('#simple-detail').value, visits: 1, last: 'Today' });
    if (type === 'return') state.returns.unshift({ id: `RT-${19 + state.returns.length + 1}`, receipt: $('#simple-name').value, product: $('#simple-detail').value, customer: 'New claim', reason: $('#simple-reason').value, status: 'Open', date: 'Today' });
    state.audit.unshift({ action: config.title, detail: 'New record created', user: state.user.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    persist();
    $('#modal-root').innerHTML = '';
    showToast(`${config.title} saved.`);
    setView({ purchase: 'purchasing', customer: 'customers', return: 'returns' }[type]);
  });
  $('#simple-modal').addEventListener('click', (event) => { if (event.target.id === 'simple-modal' || event.target.closest('[data-close-modal]')) $('#modal-root').innerHTML = ''; });
}

function printReceipt(receiptId) {
  const sale = state.sales.find((item) => item.id === receiptId);
  if (!sale) return;
  const printWindow = window.open('', '_blank', 'width=420,height=640');
  if (!printWindow) return showToast('Allow pop-ups to print the receipt.');
  printWindow.document.write(`<html><head><title>${sale.id} · Karen Auto Spares</title><style>body{font:14px Arial;padding:30px;color:#18211f}h1{font-size:20px}hr{border:0;border-top:1px solid #ddd;margin:20px 0}.row{display:flex;justify-content:space-between;margin:12px 0}.total{font-weight:bold;border-top:2px solid;padding-top:15px}</style></head><body><h1>Karen Auto Spares</h1><p>Sales receipt · ${sale.id}</p><hr><div class="row"><span>Part</span><strong>${escapeHtml(sale.product)}</strong></div><div class="row"><span>Quantity</span><strong>${sale.qty}</strong></div><div class="row total"><span>Total</span><strong>${money(sale.total)}</strong></div><p>Served by ${escapeHtml(sale.agent)} · ${sale.time}</p><script>window.print();</script></body></html>`);
  printWindow.document.close();
}

function openNotifications() {
  $('#modal-root').innerHTML = `<div class="modal-backdrop" id="notifications-modal"><div class="modal"><div class="modal-header"><h3>Notifications</h3><button class="close-button" data-close-modal>×</button></div><div class="sales-list">${state.notifications.map((item) => `<div class="sale-line"><div class="product-icon">!</div><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div><span class="stock-pill low">${item.type}</span></div>`).join('')}</div></div></div>`;
  $('#notifications-modal').addEventListener('click', (event) => { if (event.target.id === 'notifications-modal' || event.target.closest('[data-close-modal]')) $('#modal-root').innerHTML = ''; });
}

function setView(view) {
  const adminOnlyViews = ['overview', 'inventory', 'purchasing', 'customers', 'prices', 'reports', 'returns', 'activity', 'team'];
  if (!state.user.isAdmin && adminOnlyViews.includes(view)) {
    showToast('Sales agents can only record today\'s sales.');
    view = 'sales';
  }
  if (!state.user.isAdmin && view === 'team') {
    showToast('Only administrators can manage team access.');
    view = 'overview';
  }
  const titles = { overview: `Good morning, ${state.user.name.split(' ')[0]}`, sales: 'Sales & receipts', inventory: 'Inventory control', purchasing: 'Purchasing & suppliers', customers: 'Customers & vehicles', prices: 'Price watch', reports: 'Reports', returns: 'Returns & warranty', activity: 'Activity log', team: 'Team access' };
  $('#page-title').textContent = titles[view];
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  viewContainer.innerHTML = ({ overview: overviewView, sales: salesView, inventory: inventoryView, purchasing: purchasingView, customers: customersView, prices: pricesView, reports: reportsView, returns: returnsView, activity: activityView, team: teamView }[view])();
  bindViewActions();
}

function openSaleModal() {
  const options = state.products.map((item) => `<option value="${item.id}">${escapeHtml(item.acronym)} · ${escapeHtml(item.name)} · ${item.barcode} (${item.stock} available)</option>`).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop" id="sale-modal"><div class="modal"><div class="modal-header"><h3>Record today’s sale</h3><button class="close-button" data-close-modal>×</button></div><form class="modal-form" id="sale-form"><label>Find part by name, acronym or barcode<input id="sale-search" type="search" placeholder="Try FBP or scan 600100100001" autofocus /></label><button class="text-button scan-button" type="button" id="scan-barcode">Scan barcode with camera</button><video id="barcode-video" class="barcode-video" playsinline hidden></video><label>Product<select id="sale-product">${options}</select></label><div class="form-grid"><label>Quantity<input id="sale-quantity" type="number" min="1" value="1" required /></label><label>Payment reference<input id="sale-reference" type="text" placeholder="Optional" /></label></div><button class="button button-primary button-wide" type="submit">Create receipt <span>→</span></button></form></div></div>`;
  $('#sale-form').addEventListener('submit', submitSale);
  $('#sale-search').addEventListener('input', (event) => {
    const filtered = state.products.filter((item) => productMatches(item, event.target.value));
    $('#sale-product').innerHTML = filtered.length ? filtered.map((item) => `<option value="${item.id}">${escapeHtml(item.acronym)} · ${escapeHtml(item.name)} · ${item.barcode} (${item.stock} available)</option>`).join('') : '<option>No matching part</option>';
  });
  $('#scan-barcode').addEventListener('click', async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) return showToast('Camera barcode scanning is not supported in this browser. Type the barcode instead.');
    try {
      const video = $('#barcode-video');
      scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.hidden = false;
      video.srcObject = scannerStream;
      await video.play();
      const detector = new BarcodeDetector({ formats: ['ean_13', 'code_128', 'qr_code'] });
      const scan = async () => {
        if (!$('#barcode-video')) return stopScanner();
        const codes = await detector.detect(video);
        if (codes.length) {
          $('#sale-search').value = codes[0].rawValue;
          $('#sale-search').dispatchEvent(new Event('input'));
          stopScanner();
          video.hidden = true;
          showToast(`Barcode found: ${codes[0].rawValue}`);
          return;
        }
        requestAnimationFrame(scan);
      };
      scan();
    } catch (error) {
      stopScanner();
      showToast('Camera access was unavailable. Type the barcode instead.');
    }
  });
  $('#sale-modal').addEventListener('click', (event) => { if (event.target.id === 'sale-modal' || event.target.closest('[data-close-modal]')) { stopScanner(); $('#modal-root').innerHTML = ''; } });
}

function openStockModal(productId = null) {
  if (!state.user.isAdmin) return showToast('Only administrators can add stock.');
  const options = state.products.map((item) => `<option value="${item.id}">${escapeHtml(item.acronym)} · ${escapeHtml(item.name)} · ${item.barcode}</option>`).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop" id="stock-modal"><div class="modal"><div class="modal-header"><h3>Add stock intake</h3><button class="close-button" data-close-modal>×</button></div><form class="modal-form" id="stock-form"><label>Find part by name, acronym or barcode<input id="stock-search" type="search" placeholder="Scan or type a barcode" autofocus /></label><label>Product<select id="stock-product">${options}</select></label><div class="form-grid"><label>Units received<input id="stock-quantity" type="number" min="1" value="1" required /></label><label>Supplier reference<input id="stock-reference" type="text" placeholder="Optional" /></label></div><button class="button button-primary button-wide" type="submit">Update available stock <span>→</span></button></form></div></div>`;
  if (productId) $('#stock-product').value = String(productId);
  $('#stock-search').addEventListener('input', (event) => {
    const filtered = state.products.filter((item) => productMatches(item, event.target.value));
    $('#stock-product').innerHTML = filtered.length ? filtered.map((item) => `<option value="${item.id}">${escapeHtml(item.acronym)} · ${escapeHtml(item.name)} · ${item.barcode}</option>`).join('') : '<option>No matching part</option>';
  });
  $('#stock-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const product = state.products.find((item) => item.id === Number($('#stock-product').value));
    const quantity = Number($('#stock-quantity').value);
    if (!product || quantity < 1) return showToast('Choose a valid part and quantity.');
    product.stock += quantity;
    persist();
    $('#modal-root').innerHTML = '';
    showToast(`${quantity} units added to ${product.name}.`);
    setView('inventory');
  });
  $('#stock-modal').addEventListener('click', (event) => { if (event.target.id === 'stock-modal' || event.target.closest('[data-close-modal]')) $('#modal-root').innerHTML = ''; });
}

function submitSale(event) {
  event.preventDefault();
  const product = state.products.find((item) => item.id === Number($('#sale-product').value));
  const quantity = Number($('#sale-quantity').value);
  if (!product || quantity < 1 || quantity > product.stock) return showToast('Check the quantity available for this product.');
  product.stock -= quantity;
  const now = new Date();
  const total = product.price * quantity;
  state.sales.unshift({ id: `SL-${1048 + state.sales.length + 1}`, product: product.name, agent: state.user.name, qty: quantity, total, profit: (product.price - product.cost) * quantity, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  persist();
  $('#modal-root').innerHTML = '';
  showToast('Sale recorded and stock updated.');
  setView('sales');
}

function bindViewActions() {
  document.querySelectorAll('[data-view-jump]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.viewJump)));
  document.querySelectorAll('[data-stock-part]').forEach((button) => button.addEventListener('click', () => openStockModal(Number(button.dataset.stockPart))));
  document.querySelectorAll('[data-print-receipt]').forEach((button) => button.addEventListener('click', () => printReceipt(button.dataset.printReceipt)));
  $('#sales-page-new')?.addEventListener('click', openSaleModal);
  $('#add-stock-button')?.addEventListener('click', openStockModal);
  $('#new-purchase-button')?.addEventListener('click', () => openSimpleModal('purchase'));
  $('#new-customer-button')?.addEventListener('click', () => openSimpleModal('customer'));
  $('#new-return-button')?.addEventListener('click', () => openSimpleModal('return'));
  $('#print-report-button')?.addEventListener('click', () => window.print());
  $('.icon-button')?.addEventListener('click', openNotifications);
  $('#add-price-button')?.addEventListener('click', () => showToast('Price alert form is ready for the next step.'));
  $('#invite-button')?.addEventListener('click', () => showToast('Invite flow is ready for a hosted email service.'));
}

$('#login-form').addEventListener('submit', signIn);
$('#new-sale-button').addEventListener('click', openSaleModal);
$('#logout-button').addEventListener('click', () => { state.user = null; persist(); app.classList.add('hidden'); loginScreen.classList.remove('hidden'); });
document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));

if (state.user) bootApp();
