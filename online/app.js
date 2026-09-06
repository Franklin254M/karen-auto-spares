const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabaseReady = SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
const client = supabaseReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentUser = null;
let currentProfile = null;
let products = [];
let sales = [];
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));

function toast(message) { const element = $('#toast'); element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2800); }
function loginMessage(message) { $('#login-message').textContent = message; }
function isAdmin() { return currentProfile?.role === 'admin'; }
function productImage(product) { return product.image_url ? `<img class="thumb" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">` : '<span class="thumb"></span>'; }

async function loadSharedData() {
  const productResult = await client.from('products').select('*').order('name');
  const salesQuery = isAdmin() ? client.from('sales').select('*, products(name, price)').order('created_at', { ascending: false }) : client.from('sales').select('*, products(name, price)').eq('agent_id', currentUser.id).order('created_at', { ascending: false });
  const salesResult = await salesQuery;
  if (productResult.error || salesResult.error) throw new Error(productResult.error?.message || salesResult.error?.message);
  products = productResult.data || [];
  sales = salesResult.data || [];
}

async function signIn(event) {
  event.preventDefault();
  if (!supabaseReady) return loginMessage('Add your Supabase URL and anon key in online/app.js first.');
  const { data, error } = await client.auth.signInWithPassword({ email: $('#email').value, password: $('#password').value });
  if (error) return loginMessage(error.message);
  currentUser = data.user;
  await startApp();
}

async function startApp() {
  const profileResult = await client.from('profiles').select('*').eq('id', currentUser.id).single();
  if (profileResult.error) return loginMessage(profileResult.error.message);
  currentProfile = profileResult.data;
  await loadSharedData();
  $('#login-view').classList.add('hidden');
  $('#app-view').classList.remove('hidden');
  $('#date-label').textContent = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date());
  $('#profile-name').textContent = currentProfile.full_name;
  $('#profile-role').textContent = currentProfile.role === 'admin' ? 'Administrator' : 'Sales agent';
  $('#profile-avatar').textContent = currentProfile.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  renderNavigation();
  renderPage(isAdmin() ? 'overview' : 'sales');
}

function renderNavigation() {
  const links = isAdmin() ? [['overview', '⌂ Overview'], ['sales', '↗ Sales & receipts'], ['inventory', '▦ Inventory'], ['purchasing', '＋ Purchasing'], ['customers', '◎ Customers'], ['reports', '▤ Reports'], ['team', '◎ Team access']] : [['sales', '↗ Sales & receipts']];
  $('#navigation').innerHTML = links.map(([view, label]) => `<button class="nav-button" data-online-view="${view}">${label}</button>`).join('');
  document.querySelectorAll('[data-online-view]').forEach((button) => button.addEventListener('click', () => renderPage(button.dataset.onlineView)));
}

function overviewPage() {
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const low = products.filter((product) => product.stock <= product.reorder_level);
  return `<div class="grid metrics"><div class="surface metric"><span>Shared revenue</span><strong>${money(revenue)}</strong><small>All agents</small></div><div class="surface metric"><span>Gross profit</span><strong>${money(profit)}</strong><small>Live database</small></div><div class="surface metric"><span>Receipts</span><strong>${sales.length}</strong><small>Recorded online</small></div><div class="surface metric"><span>Parts to buy</span><strong>${low.length}</strong><small>${low.length ? 'Needs attention' : 'Stock healthy'}</small></div></div><div class="grid split"><div class="surface"><div class="panel-head"><div><h3>Low-stock purchase list</h3><p class="sub">Shared alerts from inventory</p></div><button class="action" data-online-view="inventory">Open inventory</button></div><div class="list">${low.length ? low.map((product) => `<div class="list-row">${productImage(product)}<div><strong>${escapeHtml(product.name)}</strong><small>${product.stock} left · buy ${product.reorder_level - product.stock} units</small></div><span class="status warn">Buy now</span></div>`).join('') : '<p class="sub">No low-stock parts.</p>'}</div></div><div class="surface"><div class="panel-head"><div><h3>Recent receipts</h3><p class="sub">Visible across the team</p></div></div><div class="list">${sales.slice(0, 5).map((sale) => `<div class="list-row"><span class="thumb"></span><div><strong>${escapeHtml(sale.products?.name || 'Part')}</strong><small>${sale.receipt_no} · ${sale.qty} units</small></div><strong>${money(sale.total)}</strong></div>`).join('')}</div></div></div>`;
}

function salesPage() { return `<div class="toolbar"><h3>${isAdmin() ? 'Sales & receipts' : 'Today’s sales'}</h3><button class="primary" id="online-sale">＋ Record sale</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Receipt</th><th>Part</th><th>Agent</th><th>Qty</th><th>Total</th><th>Time</th></tr></thead><tbody>${sales.map((sale) => `<tr><td>${sale.receipt_no}</td><td>${escapeHtml(sale.products?.name || 'Part')}</td><td>${escapeHtml(sale.agent_name || 'Team member')}</td><td>${sale.qty}</td><td>${money(sale.total)}</td><td>${new Date(sale.created_at).toLocaleString()}</td></tr>`).join('')}</tbody></table></div>`; }
function inventoryPage() { return `<div class="toolbar"><h3>Shared inventory</h3><button class="primary" id="online-stock">＋ Add stock</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Part</th><th>Acronym</th><th>Barcode</th><th>Available</th><th>Sell price</th><th>Status</th></tr></thead><tbody>${products.map((product) => `<tr><td>${productImage(product)} ${escapeHtml(product.name)}</td><td>${product.acronym}</td><td>${product.barcode}</td><td>${product.stock}</td><td>${money(product.price)}</td><td><span class="status ${product.stock <= product.reorder_level ? 'warn' : ''}">${product.stock <= product.reorder_level ? 'Buy now' : 'Healthy'}</span></td></tr>`).join('')}</tbody></table></div>`; }
function purchasingPage() { return `<div class="toolbar"><h3>Purchasing</h3><button class="primary" id="online-purchase">＋ New purchase order</button></div><div class="grid split"><div class="surface"><div class="panel-head"><div><h3>Supplier orders</h3><p class="sub">Connect this view to purchase_orders in Supabase.</p></div></div><div class="list"><div class="list-row"><span class="thumb"></span><div><strong>Metro Parts Wholesale</strong><small>PO-204 · 3 parts · expected in 2 days</small></div><span class="status warn">Draft</span></div></div></div><div class="surface"><div class="panel-head"><div><h3>Supplier contacts</h3><p class="sub">Add suppliers in the database table.</p></div></div></div></div>`; }
function customersPage() { return `<div class="toolbar"><h3>Customers & vehicles</h3><button class="primary" id="online-customer">＋ Add customer</button></div><div class="surface table-wrap"><table class="table"><thead><tr><th>Name</th><th>Phone</th><th>Vehicle</th><th>Visits</th></tr></thead><tbody><tr><td>Customer records are ready for the customers table.</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></div>`; }
function reportsPage() { const total = sales.reduce((sum, sale) => sum + sale.total, 0); return `<div class="toolbar"><h3>Reports</h3><button class="primary" onclick="window.print()">Print report</button></div><div class="grid metrics"><div class="surface metric"><span>Revenue</span><strong>${money(total)}</strong><small>Shared live data</small></div><div class="surface metric"><span>Profit</span><strong>${money(sales.reduce((sum, sale) => sum + sale.profit, 0))}</strong><small>Across receipts</small></div><div class="surface metric"><span>Units</span><strong>${sales.reduce((sum, sale) => sum + sale.qty, 0)}</strong><small>Moved</small></div><div class="surface metric"><span>Products</span><strong>${products.length}</strong><small>Catalog</small></div></div>`; }
function teamPage() { return `<div class="toolbar"><div><h3>Team access</h3><p class="sub">Invite sales agents without exposing passwords.</p></div></div><div class="surface"><div class="panel-head"><div><h3>Create sales-agent account</h3><p class="sub">Supabase sends the agent a secure email invitation.</p></div></div><form id="agent-form" class="modal-form"><div class="grid split"><label>Agent name<input id="agent-name" required placeholder="Sales agent name"></label><label>Agent email<input id="agent-email" type="email" required placeholder="agent@example.com"></label></div><button class="primary" type="submit">Send invitation <span>→</span></button><p id="agent-message" class="sub"></p></form></div>`; }

function renderPage(view) {
  const titles = { overview: 'Good morning', sales: 'Sales & receipts', inventory: 'Inventory', purchasing: 'Purchasing', customers: 'Customers & vehicles', reports: 'Reports', team: 'Team access' };
  $('#page-title').textContent = titles[view];
  $('#page-content').innerHTML = ({ overview: overviewPage, sales: salesPage, inventory: inventoryPage, purchasing: purchasingPage, customers: customersPage, reports: reportsPage, team: teamPage }[view])();
  document.querySelectorAll('[data-online-view]').forEach((button) => button.classList.toggle('active', button.dataset.onlineView === view));
  document.querySelectorAll('[data-online-view="inventory"]').forEach((button) => button.addEventListener('click', () => renderPage('inventory')));
  $('#online-sale')?.addEventListener('click', async () => toast('Sale form is ready for the shared sales table.'));
  $('#online-stock')?.addEventListener('click', async () => toast(isAdmin() ? 'Stock intake can now update the shared inventory.' : 'Only administrators can add stock.'));
  $('#online-purchase')?.addEventListener('click', () => toast('Purchase orders are ready for the shared database table.'));
  $('#online-customer')?.addEventListener('click', () => toast('Customer records are ready for the shared database table.'));
  $('#agent-form')?.addEventListener('submit', inviteSalesAgent);
}

async function inviteSalesAgent(event) {
  event.preventDefault();
  const message = $('#agent-message');
  message.textContent = 'Sending invitation...';
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-sales-agent`, { method: 'POST', headers: { Authorization: `Bearer ${(await client.auth.getSession()).data.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('#agent-email').value, full_name: $('#agent-name').value }) });
  const result = await response.json();
  if (!response.ok) return message.textContent = result.error || 'Invitation failed.';
  message.textContent = 'Invitation sent. The agent will create their own password securely.';
  event.target.reset();
}

$('#login-form').addEventListener('submit', signIn);
$('#sign-out').addEventListener('click', async () => { await client?.auth.signOut(); currentUser = null; currentProfile = null; $('#app-view').classList.add('hidden'); $('#login-view').classList.remove('hidden'); });
if (!supabaseReady) loginMessage('Online version setup: add Supabase URL and anon key in online/app.js.');
