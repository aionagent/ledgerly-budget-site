/* Ledgerly — household budget dashboard.
   Vanilla JS, zero dependencies, fully offline.
   All data lives in localStorage under "ledgerly.v1". */
'use strict';

var STORE_KEY = 'ledgerly.v1';

/* ---------- Categories ---------- */
var CATEGORIES = {
  income: ['Salary', 'Freelance', 'Refund', 'Other income'],
  expense: ['Housing', 'Groceries', 'Dining out', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Kids', 'Other']
};
var CAT_COLORS = {
  Housing: '#1d6b4f', Groceries: '#4c9a6c', 'Dining out': '#d9a441', Transport: '#5b7fa6',
  Utilities: '#8a6fb8', Health: '#c65d7b', Entertainment: '#e07856', Shopping: '#7a9e7e',
  Kids: '#c98bb9', Other: '#9a938a', Salary: '#1d6b4f', Freelance: '#4c9a6c',
  Refund: '#8a6fb8', 'Other income': '#9a938a'
};
function catColor(name) { return CAT_COLORS[name] || '#9a938a'; }
function allCategories() { return CATEGORIES.expense.concat(CATEGORIES.income); }

/* ---------- Sample data (first load only) ---------- */
function sampleData() {
  var y = currentMonth.year, m = currentMonth.month; // 0-based month
  function d(day) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'); }
  var txns = [
    { type: 'income', amount: 5200.00, date: d(1), category: 'Salary', description: 'November salary', note: 'Payday', sample: true },
    { type: 'income', amount: 340.00, date: d(12), category: 'Freelance', description: 'Weekend design work', note: '', sample: true },
    { type: 'expense', amount: 1450.00, date: d(2), category: 'Housing', description: 'Monthly rent', note: 'Bank transfer', sample: true },
    { type: 'expense', amount: 86.40, date: d(3), category: 'Groceries', description: 'Weekly groceries', note: 'Market on 5th Ave', sample: true },
    { type: 'expense', amount: 74.20, date: d(6), category: 'Groceries', description: 'Weekly groceries', note: '', sample: true },
    { type: 'expense', amount: 52.00, date: d(7), category: 'Dining out', description: 'Family dinner', note: 'Noodle house', sample: true },
    { type: 'expense', amount: 38.50, date: d(8), category: 'Transport', description: 'Metro card top-up', note: '', sample: true },
    { type: 'expense', amount: 128.00, date: d(10), category: 'Utilities', description: 'Electricity bill', note: '', sample: true },
    { type: 'expense', amount: 65.00, date: d(11), category: 'Health', description: 'Pharmacy', note: 'Vitamins', sample: true },
    { type: 'expense', amount: 92.30, date: d(14), category: 'Groceries', description: 'Weekly groceries', note: '', sample: true },
    { type: 'expense', amount: 45.00, date: d(15), category: 'Entertainment', description: 'Movie night', note: 'Two tickets', sample: true },
    { type: 'expense', amount: 120.00, date: d(18), category: 'Kids', description: 'Art class fee', note: '', sample: true },
    { type: 'expense', amount: 210.75, date: d(20), category: 'Shopping', description: 'Winter coats', note: 'Two coats', sample: true },
    { type: 'expense', amount: 28.90, date: d(21), category: 'Dining out', description: 'Lunch with friends', note: '', sample: true },
    { type: 'expense', amount: 41.60, date: d(24), category: 'Transport', description: 'Taxi to airport', note: '', sample: true }
  ];
  txns.forEach(function (t, i) { t.id = 'sample-' + (i + 1); });
  return {
    transactions: txns,
    budgets: { Housing: 1500, Groceries: 420, 'Dining out': 180, Transport: 120, Utilities: 200, Health: 150, Entertainment: 120, Shopping: 250, Kids: 200 },
    goals: [
      { id: 'goal-1', name: 'Emergency fund', target: 6000, saved: 3850, date: '2027-06-30' },
      { id: 'goal-2', name: 'Summer family trip', target: 2400, saved: 960, date: '2027-07-01' }
    ]
  };
}

/* ---------- State ---------- */
var now = new Date();
var currentMonth = { year: now.getFullYear(), month: now.getMonth() };
var state = load();

function load() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions)) return parsed;
    }
  } catch (e) { /* corrupted storage: start fresh below */ }
  var fresh = sampleData();
  save(fresh);
  return fresh;
}
function save(s) {
  state = s || state;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
}
function uid(prefix) { return prefix + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

/* ---------- Helpers ---------- */
function $(id) { return document.getElementById(id); }
function money(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function monthKey(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }
function monthName(y, m) {
  return new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function monthTxns() {
  var key = monthKey(currentMonth.year, currentMonth.month);
  return state.transactions.filter(function (t) { return t.date.slice(0, 7) === key; });
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function fmtDate(iso) {
  var parts = iso.split('-');
  return parts[1] + '/' + parts[2] + '/' + parts[0];
}

/* ---------- Navigation ---------- */
var VIEWS = ['dashboard', 'transactions', 'budgets', 'goals'];
function showView(name) {
  if (VIEWS.indexOf(name) < 0) name = 'dashboard';
  VIEWS.forEach(function (v) {
    $('view-' + v).classList.toggle('active', v === name);
  });
  document.querySelectorAll('[data-nav]').forEach(function (a) {
    a.classList.toggle('active', a.getAttribute('data-nav') === name);
  });
  render();
}
window.addEventListener('hashchange', function () {
  showView(location.hash.replace('#', ''));
});
document.querySelectorAll('[data-nav]').forEach(function (a) {
  a.addEventListener('click', function () { showView(a.getAttribute('data-nav')); });
});

/* ---------- Rendering ---------- */
function render() {
  renderMonthLabel();
  renderSummary();
  renderAlert();
  renderDonut();
  renderBudgetGlance();
  renderGoalGlance();
  renderRecent();
  renderTxnTable();
  renderBudgetDetail();
  renderGoals();
}

function renderMonthLabel() {
  $('month-label').textContent = monthName(currentMonth.year, currentMonth.month);
}

function renderSummary() {
  var txns = monthTxns();
  var income = 0, expense = 0, incCount = 0, expCount = 0;
  txns.forEach(function (t) {
    if (t.type === 'income') { income += t.amount; incCount++; }
    else { expense += t.amount; expCount++; }
  });
  var balance = income - expense;
  $('sum-income').textContent = money(income);
  $('sum-income-sub').textContent = incCount + (incCount === 1 ? ' entry' : ' entries') + ' this month';
  $('sum-expense').textContent = money(expense);
  $('sum-expense-sub').textContent = expCount + (expCount === 1 ? ' entry' : ' entries') + ' this month';
  $('sum-balance').textContent = money(balance);
  $('sum-balance-sub').textContent = balance >= 0 ? 'Income minus spending' : 'Spending is above income';
  var rate = income > 0 ? Math.max(0, balance) / income * 100 : null;
  $('sum-rate').textContent = rate == null ? '—' : rate.toFixed(0) + '%';
  $('sum-rate-sub').textContent = rate == null ? 'No income this month' : 'Share of income kept';
}

function budgetStatus() {
  var txns = monthTxns();
  var spent = {};
  txns.forEach(function (t) {
    if (t.type === 'expense') spent[t.category] = (spent[t.category] || 0) + t.amount;
  });
  return Object.keys(state.budgets).sort().map(function (cat) {
    var limit = state.budgets[cat];
    var used = spent[cat] || 0;
    var pct = limit > 0 ? used / limit * 100 : 0;
    return { category: cat, limit: limit, used: used, pct: pct,
      status: pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok' };
  });
}

function renderAlert() {
  var over = budgetStatus().filter(function (b) { return b.status === 'over'; });
  var warn = budgetStatus().filter(function (b) { return b.status === 'warn'; });
  var el = $('budget-alert');
  if (over.length) {
    el.className = 'alert bad';
    el.textContent = 'Over budget: ' + over.map(function (b) {
      return b.category + ' is over by ' + money(b.used - b.limit);
    }).join('; ') + '.';
  } else if (warn.length) {
    el.className = 'alert warn';
    el.textContent = 'Heads up: ' + warn.map(function (b) {
      return b.category + ' is at ' + Math.round(b.pct) + '% of its budget';
    }).join('; ') + '.';
  } else {
    el.className = 'alert hidden';
    el.textContent = '';
  }
}

function renderDonut() {
  var txns = monthTxns();
  var byCat = {};
  txns.forEach(function (t) {
    if (t.type === 'expense') byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });
  var entries = Object.keys(byCat).map(function (c) { return { category: c, amount: byCat[c] }; })
    .sort(function (a, b) { return b.amount - a.amount; });
  var total = entries.reduce(function (s, e) { return s + e.amount; }, 0);
  $('donut-total').textContent = total ? entries.length + ' categories' : 'No spending yet';
  $('donut-center-value').textContent = money(total).replace('.00', '');
  var canvas = $('donut');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var cx = 110, cy = 110, r = 88, inner = 58;
  if (!total) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#ece7da'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = '#fffdf8'; ctx.fill();
  } else {
    var start = -Math.PI / 2;
    entries.forEach(function (e) {
      var sweep = e.amount / total * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + sweep); ctx.closePath();
      ctx.fillStyle = catColor(e.category); ctx.fill();
      start += sweep;
    });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = '#fffdf8'; ctx.fill();
  }
  var legend = $('category-legend');
  legend.innerHTML = entries.map(function (e) {
    return '<li><span class="swatch" style="background:' + catColor(e.category) + '"></span>' +
      escapeHtml(e.category) + '<span class="pct">' + Math.round(e.amount / total * 100) + '%</span>' +
      '<span class="amt">' + money(e.amount) + '</span></li>';
  }).join('') || '<li class="muted">Add an expense to see the breakdown.</li>';
}

function budgetRowHtml(b, detailed) {
  var pct = Math.min(100, b.pct);
  var cls = b.status === 'over' ? 'over' : b.status === 'warn' ? 'warn' : '';
  var flag = b.status === 'over' ? '<span class="b-flag">Over by ' + money(b.used - b.limit) + '</span>'
    : b.status === 'warn' ? '<span class="b-flag warn">' + Math.round(b.pct) + '% used</span>' : '';
  return '<div class="budget-row"><div><span class="b-name">' + escapeHtml(b.category) + '</span>' +
    '<span class="b-note">' + money(b.used) + ' of ' + money(b.limit) + '</span></div>' +
    '<div class="bar ' + cls + '" role="progressbar" aria-valuenow="' + Math.round(b.pct) + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + escapeHtml(b.category) + ' budget"><i style="width:' + pct + '%"></i></div>' +
    '<div style="text-align:right"><span class="b-amt ' + cls + '">' + Math.round(b.pct) + '%</span><br>' + flag + '</div></div>';
}

function renderBudgetGlance() {
  var rows = budgetStatus().slice(0, 4);
  $('budget-glance').innerHTML = rows.length
    ? rows.map(function (b) { return budgetRowHtml(b); }).join('')
    : '<p class="muted">No budgets set yet. <a href="#budgets" data-nav="budgets">Set one</a> to track spending.</p>';
}

function renderBudgetDetail() {
  var rows = budgetStatus();
  $('budget-detail').innerHTML = rows.length
    ? '<div class="card">' + rows.map(function (b) { return budgetRowHtml(b, true); }).join('') + '</div>'
    : '<div class="card"><p class="muted">No budgets set yet — use the form below to add your first one.</p></div>';
}

function renderGoalGlance() {
  var el = $('goal-glance');
  if (!state.goals.length) { el.innerHTML = '<p class="muted">No savings goals yet.</p>'; return; }
  var totalSaved = state.goals.reduce(function (s, g) { return s + g.saved; }, 0);
  var totalTarget = state.goals.reduce(function (s, g) { return s + g.target; }, 0);
  var pct = totalTarget > 0 ? totalSaved / totalTarget * 100 : 0;
  el.innerHTML = '<div class="budget-row"><div><span class="b-name">All goals</span>' +
    '<span class="b-note">' + money(totalSaved) + ' of ' + money(totalTarget) + '</span></div>' +
    '<div class="bar"><i style="width:' + Math.min(100, pct) + '%"></i></div>' +
    '<div style="text-align:right"><span class="b-amt">' + Math.round(pct) + '%</span></div></div>';
}

function txnRowHtml(t, showNote) {
  var sign = t.type === 'income' ? '+' : '−';
  var cells = '<td>' + fmtDate(t.date) + '</td>' +
    '<td>' + escapeHtml(t.description) + (t.sample ? ' <span class="pill pill-sample">sample</span>' : '') + '</td>' +
    '<td><span class="cat-dot" style="background:' + catColor(t.category) + '"></span>' + escapeHtml(t.category) + '</td>';
  if (showNote) cells += '<td class="muted">' + escapeHtml(t.note || '—') + '</td>';
  cells += '<td class="num ' + t.type + '">' + sign + money(t.amount) + '</td>' +
    '<td class="row-actions"><button type="button" class="icon-btn" data-edit="' + t.id + '">Edit</button>' +
    '<button type="button" class="icon-btn danger" data-del="' + t.id + '">Delete</button></td>';
  return '<tr>' + cells + '</tr>';
}

function renderRecent() {
  var txns = monthTxns().slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 6);
  $('recent-body').innerHTML = txns.map(function (t) { return txnRowHtml(t, false); }).join('');
  $('recent-empty').classList.toggle('hidden', txns.length > 0);
}

function filteredTxns() {
  var type = $('filter-type').value;
  var cat = $('filter-category').value;
  var q = $('filter-search').value.trim().toLowerCase();
  return monthTxns().filter(function (t) {
    if (type !== 'all' && t.type !== type) return false;
    if (cat !== 'all' && t.category !== cat) return false;
    if (q && (t.description + ' ' + (t.note || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function (a, b) { return b.date.localeCompare(a.date) || b.description.localeCompare(a.description); });
}

function renderTxnTable() {
  var txns = filteredTxns();
  $('txn-body').innerHTML = txns.map(function (t) { return txnRowHtml(t, true); }).join('');
  $('txn-empty').classList.toggle('hidden', txns.length > 0);
  var all = monthTxns().length;
  $('txn-count').textContent = txns.length + ' of ' + all + ' shown';
}

function renderGoals() {
  var el = $('goal-list');
  if (!state.goals.length) { el.innerHTML = '<p class="muted">No goals yet — add one to start saving with a target.</p>'; return; }
  el.innerHTML = state.goals.map(function (g) {
    var pct = g.target > 0 ? Math.min(100, g.saved / g.target * 100) : 0;
    var remaining = Math.max(0, g.target - g.saved);
    var meta = remaining > 0 ? money(remaining) + ' to go' + (g.date ? ' · by ' + g.date : '')
      : 'Goal reached — nicely done!';
    return '<article class="card goal-card"><h3>' + escapeHtml(g.name) + '</h3>' +
      '<p class="g-amounts">' + money(g.saved) + ' <small>of ' + money(g.target) + '</small></p>' +
      '<p class="g-meta">' + escapeHtml(meta) + '</p>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="goal-actions">' +
      '<button type="button" class="btn" data-goal-add="' + g.id + '">+ Add savings</button>' +
      '<button type="button" class="btn" data-goal-edit="' + g.id + '">Edit</button>' +
      '<button type="button" class="btn btn-danger-ghost" data-goal-del="' + g.id + '">Delete</button>' +
      '</div></article>';
  }).join('');
}

/* ---------- Month navigation ---------- */
function shiftMonth(delta) {
  var d = new Date(currentMonth.year, currentMonth.month + delta, 1);
  currentMonth = { year: d.getFullYear(), month: d.getMonth() };
  render();
}
$('prev-month').addEventListener('click', function () { shiftMonth(-1); });
$('next-month').addEventListener('click', function () { shiftMonth(1); });
$('today-btn').addEventListener('click', function () {
  currentMonth = { year: now.getFullYear(), month: now.getMonth() };
  render();
});

/* ---------- Transaction dialog ---------- */
var txnDialog = $('txn-dialog');
function fillCategorySelect(select, type) {
  var cats = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  select.innerHTML = cats.map(function (c) { return '<option>' + escapeHtml(c) + '</option>'; }).join('');
}
function openTxnDialog(existing) {
  fillCategorySelect($('txn-category'), existing ? existing.type : 'expense');
  $('txn-id').value = existing ? existing.id : '';
  $('txn-dialog-title').textContent = existing ? 'Edit transaction' : 'Add transaction';
  $('txn-type').value = existing ? existing.type : 'expense';
  $('txn-amount').value = existing ? existing.amount.toFixed(2) : '';
  $('txn-date').value = existing ? existing.date : monthKey(currentMonth.year, currentMonth.month) + '-' + String(now.getDate()).padStart(2, '0');
  if (existing) $('txn-category').value = existing.category;
  $('txn-desc').value = existing ? existing.description : '';
  $('txn-note').value = existing ? (existing.note || '') : '';
  $('txn-error').classList.add('hidden');
  txnDialog.showModal();
}
$('txn-type').addEventListener('change', function () { fillCategorySelect($('txn-category'), $('txn-type').value); });
function openTxn() { openTxnDialog(null); }
$('add-txn-top').addEventListener('click', openTxn);
$('add-txn-btn').addEventListener('click', openTxn);
$('txn-cancel').addEventListener('click', function () { txnDialog.close(); });
$('txn-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var amount = parseFloat($('txn-amount').value);
  var err = $('txn-error');
  if (!isFinite(amount) || amount <= 0) {
    err.textContent = 'Enter an amount greater than zero.'; err.classList.remove('hidden'); return;
  }
  var id = $('txn-id').value;
  var rec = {
    id: id || uid('txn'),
    type: $('txn-type').value,
    amount: Math.round(amount * 100) / 100,
    date: $('txn-date').value,
    category: $('txn-category').value,
    description: $('txn-desc').value.trim(),
    note: $('txn-note').value.trim(),
    sample: false
  };
  if (id) {
    var idx = state.transactions.findIndex(function (t) { return t.id === id; });
    if (idx >= 0) { rec.sample = state.transactions[idx].sample; state.transactions[idx] = rec; }
  } else {
    state.transactions.push(rec);
    var d = new Date(rec.date + 'T00:00:00');
    currentMonth = { year: d.getFullYear(), month: d.getMonth() };
  }
  save();
  txnDialog.close();
  render();
});
document.addEventListener('click', function (e) {
  var editBtn = e.target.closest('[data-edit]');
  if (editBtn) {
    var t = state.transactions.find(function (x) { return x.id === editBtn.getAttribute('data-edit'); });
    if (t) openTxnDialog(t);
    return;
  }
  var delBtn = e.target.closest('[data-del]');
  if (delBtn) {
    var id = delBtn.getAttribute('data-del');
    var t2 = state.transactions.find(function (x) { return x.id === id; });
    if (t2 && confirm('Delete "' + t2.description + '" (' + money(t2.amount) + ')?')) {
      state.transactions = state.transactions.filter(function (x) { return x.id !== id; });
      save(); render();
    }
    return;
  }
  var goalAdd = e.target.closest('[data-goal-add]');
  if (goalAdd) {
    var g = state.goals.find(function (x) { return x.id === goalAdd.getAttribute('data-goal-add'); });
    if (!g) return;
    var add = prompt('How much did you add to "' + g.name + '"?', '100');
    if (add === null) return;
    var n = parseFloat(add);
    if (isFinite(n) && n > 0) { g.saved = Math.round((g.saved + n) * 100) / 100; save(); render(); }
    else alert('Enter an amount greater than zero.');
    return;
  }
  var goalEdit = e.target.closest('[data-goal-edit]');
  if (goalEdit) {
    var g2 = state.goals.find(function (x) { return x.id === goalEdit.getAttribute('data-goal-edit'); });
    if (g2) openGoalDialog(g2);
    return;
  }
  var goalDel = e.target.closest('[data-goal-del]');
  if (goalDel) {
    var g3 = state.goals.find(function (x) { return x.id === goalDel.getAttribute('data-goal-del'); });
    if (g3 && confirm('Delete the goal "' + g3.name + '"?')) {
      state.goals = state.goals.filter(function (x) { return x.id !== g3.id; });
      save(); render();
    }
  }
});

/* ---------- Goal dialog ---------- */
var goalDialog = $('goal-dialog');
function openGoalDialog(existing) {
  $('goal-id').value = existing ? existing.id : '';
  $('goal-dialog-title').textContent = existing ? 'Edit savings goal' : 'New savings goal';
  $('goal-name').value = existing ? existing.name : '';
  $('goal-target').value = existing ? existing.target.toFixed(2) : '';
  $('goal-saved').value = existing ? existing.saved.toFixed(2) : '0.00';
  $('goal-date').value = existing ? (existing.date || '') : '';
  goalDialog.showModal();
}
$('add-goal-btn').addEventListener('click', function () { openGoalDialog(null); });
$('goal-cancel').addEventListener('click', function () { goalDialog.close(); });
$('goal-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var target = parseFloat($('goal-target').value);
  var saved = parseFloat($('goal-saved').value);
  if (!isFinite(target) || target <= 0 || !isFinite(saved) || saved < 0) return;
  var id = $('goal-id').value;
  var rec = {
    id: id || uid('goal'),
    name: $('goal-name').value.trim(),
    target: Math.round(target * 100) / 100,
    saved: Math.round(saved * 100) / 100,
    date: $('goal-date').value || ''
  };
  if (id) {
    var idx = state.goals.findIndex(function (g) { return g.id === id; });
    if (idx >= 0) state.goals[idx] = rec;
  } else state.goals.push(rec);
  save();
  goalDialog.close();
  render();
});

/* ---------- Budgets ---------- */
function fillBudgetSelects() {
  var cats = allCategories().filter(function (c) { return CATEGORIES.expense.indexOf(c) >= 0; });
  $('budget-category').innerHTML = cats.map(function (c) { return '<option>' + escapeHtml(c) + '</option>'; }).join('');
  var fc = $('filter-category');
  fc.innerHTML = '<option value="all">All categories</option>' +
    allCategories().map(function (c) { return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>'; }).join('');
}
$('budget-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var amount = parseFloat($('budget-amount').value);
  if (!isFinite(amount) || amount < 0) return;
  state.budgets[$('budget-category').value] = Math.round(amount * 100) / 100;
  save(); render();
});
$('budget-remove').addEventListener('click', function () {
  var cat = $('budget-category').value;
  if (state.budgets[cat] != null && confirm('Remove the budget for ' + cat + '?')) {
    delete state.budgets[cat];
    save(); render();
  }
});

/* ---------- Filters / sample data / export ---------- */
['filter-type', 'filter-category'].forEach(function (id) {
  $(id).addEventListener('change', renderTxnTable);
});
$('filter-search').addEventListener('input', renderTxnTable);

$('clear-sample-btn').addEventListener('click', function () {
  var n = state.transactions.filter(function (t) { return t.sample; }).length;
  if (!n) { alert('There is no sample data to clear.'); return; }
  if (confirm('Remove ' + n + ' sample transactions? Your own entries stay.')) {
    state.transactions = state.transactions.filter(function (t) { return !t.sample; });
    save(); render();
  }
});

$('export-csv').addEventListener('click', function () {
  var rows = [['Date', 'Type', 'Description', 'Category', 'Note', 'Amount']];
  state.transactions.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }).forEach(function (t) {
    rows.push([t.date, t.type, t.description, t.category, t.note || '', t.amount.toFixed(2)]);
  });
  var csv = rows.map(function (r) {
    return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ledgerly-transactions.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
});

/* ---------- Boot ---------- */
fillBudgetSelects();
fillCategorySelect($('txn-category'), 'expense');
showView((location.hash || '#dashboard').replace('#', ''));
