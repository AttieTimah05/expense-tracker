// ---------- State ----------
let expenses = JSON.parse(localStorage.getItem('mk_expenses') || '[]');

// ---------- Elements ----------
const categorySelect   = document.getElementById('category-select');
const amountInput      = document.getElementById('amount-input');
const dateInput        = document.getElementById('date-input');
const addBtn           = document.getElementById('add-btn');
const expenseTableBody = document.getElementById('expense-table-body');
const expenseTable     = document.getElementById('expense-table');
const totalAmountCell  = document.getElementById('total-amount');
const emptyState       = document.getElementById('empty-state');
const messageEl        = document.getElementById('message');

const tabExpenses = document.getElementById('tab-expenses');
const tabSummary  = document.getElementById('tab-summary');
const viewExpenses = document.getElementById('view-expenses');
const viewSummary  = document.getElementById('view-summary');
const monthFilter  = document.getElementById('month-filter');
const summaryTotal = document.getElementById('summary-total');
const summaryEmpty = document.getElementById('summary-empty');
const summaryBars  = document.getElementById('summary-bars');

// ---------- Helpers ----------
function formatMk(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let messageTimer;
function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
    clearTimeout(messageTimer);
    if (type === 'success') {
        messageTimer = setTimeout(function () { messageEl.textContent = ''; }, 3000);
    }
}

// ---------- View switching ----------
function showView(name) {
    const isSummary = name === 'summary';
    viewExpenses.classList.toggle('hidden', isSummary);
    viewSummary.classList.toggle('hidden', !isSummary);
    tabExpenses.classList.toggle('active', !isSummary);
    tabSummary.classList.toggle('active', isSummary);
    if (isSummary) renderSummary();
}
tabExpenses.addEventListener('click', function () { showView('expenses'); });
tabSummary.addEventListener('click', function () { showView('summary'); });

// ---------- Expenses view ----------
function updateTotalAmount() {
    const total = expenses.reduce(function (sum, e) { return sum + e.amount; }, 0);
    totalAmountCell.textContent = formatMk(total);
}

function updateExpenseTable() {
    expenseTableBody.innerHTML = '';
    const hasData = expenses.length > 0;
    emptyState.classList.toggle('hidden', hasData);
    expenseTable.classList.toggle('hidden', !hasData);

    expenses.forEach(function (expense) {
        const newRow = expenseTableBody.insertRow();
        newRow.insertCell().textContent = expense.category;
        newRow.insertCell().textContent = formatMk(expense.amount);
        newRow.insertCell().textContent = expense.date;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-button');
        deleteBtn.setAttribute('aria-label',
            'Delete ' + expense.category + ' expense of Mk ' + formatMk(expense.amount));
        deleteBtn.addEventListener('click', function () {
            if (!confirm('Delete this ' + expense.category + ' expense of Mk ' + formatMk(expense.amount) + '?')) return;
            expenses.splice(expenses.indexOf(expense), 1);
            saveAndRender();
            showMessage('Expense deleted.', 'success');
        });
        newRow.insertCell().appendChild(deleteBtn);
    });
}

function saveAndRender() {
    localStorage.setItem('mk_expenses', JSON.stringify(expenses));
    updateExpenseTable();
    updateTotalAmount();
}

addBtn.addEventListener('click', function () {
    const category = categorySelect.value;
    const amount   = Number(amountInput.value);
    const date     = dateInput.value;

    amountInput.classList.remove('invalid');
    dateInput.classList.remove('invalid');

    if (amountInput.value === '' || isNaN(amount) || amount <= 0) {
        amountInput.classList.add('invalid');
        amountInput.focus();
        showMessage('Please enter an amount greater than 0.', 'error');
        return;
    }
    if (date === '') {
        dateInput.classList.add('invalid');
        dateInput.focus();
        showMessage('Please choose a date.', 'error');
        return;
    }

    expenses.push({ category, amount, date });
    saveAndRender();
    showMessage('Added ' + category + ': Mk ' + formatMk(amount) + '.', 'success');

    amountInput.value = '';
    amountInput.focus();
});

// Enter key submits from the amount field
amountInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addBtn.click();
});

// ---------- Summary view ----------
function monthLabel(ym) {
    const d = new Date(ym + '-01T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildMonthFilter() {
    const previous = monthFilter.value || 'all';
    const months = Array.from(new Set(expenses.map(function (e) { return e.date.slice(0, 7); })))
        .sort().reverse();
    monthFilter.innerHTML = '';
    monthFilter.add(new Option('All time', 'all'));
    months.forEach(function (m) { monthFilter.add(new Option(monthLabel(m), m)); });
    monthFilter.value = (previous === 'all' || months.includes(previous)) ? previous : 'all';
}

function renderSummary() {
    buildMonthFilter();
    const selected = monthFilter.value;
    const filtered = expenses.filter(function (e) {
        return selected === 'all' || e.date.slice(0, 7) === selected;
    });

    summaryBars.innerHTML = '';
    const total = filtered.reduce(function (s, e) { return s + e.amount; }, 0);
    summaryEmpty.classList.toggle('hidden', filtered.length > 0);
    summaryTotal.textContent = filtered.length ? 'Total spent: Mk ' + formatMk(total) : '';

    const byCategory = {};
    filtered.forEach(function (e) { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

    Object.entries(byCategory)
        .sort(function (a, b) { return b[1] - a[1]; })
        .forEach(function (entry) {
            const pct = (entry[1] / total) * 100;
            const row = document.createElement('div');
            row.className = 'bar-row';

            const label = document.createElement('div');
            label.className = 'bar-label';
            const name = document.createElement('span');
            name.textContent = entry[0];
            const value = document.createElement('span');
            value.textContent = 'Mk ' + formatMk(entry[1]) + ' (' + pct.toFixed(0) + '%)';
            label.append(name, value);

            const track = document.createElement('div');
            track.className = 'bar-track';
            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.width = pct + '%';
            track.appendChild(fill);

            row.append(label, track);
            summaryBars.appendChild(row);
        });
}
monthFilter.addEventListener('change', renderSummary);

// ---------- Init ----------
dateInput.value = new Date().toISOString().split('T')[0];
saveAndRender();
