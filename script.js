// ================= 1. DỮ LIỆU MẪU & DANH MỤC =================
const CATEGORIES = {
    income: [
        { name: 'Lương', icon: '💼' },
        { name: 'Làm thêm', icon: '💻' },
        { name: 'Tiền thưởng', icon: '🎁' },
        { name: 'Nguồn khác', icon: '✨' }
    ],
    expense: [
        { name: 'Ăn uống', icon: '🍔' },
        { name: 'Đi lại', icon: '🛵' },
        { name: 'Mua sắm', icon: '🛍️' },
        { name: 'Học tập', icon: '📚' },
        { name: 'Chi phí cố định', icon: '🏠' },
        { name: 'Trả nợ', icon: '💳' },
        { name: 'Khác', icon: '✨' }
    ],
    saving: [
        { name: 'Quỹ tiết kiệm tháng', icon: '🐷' },
        { name: 'Mua điện thoại', icon: '📱' },
        { name: 'Quỹ khẩn cấp', icon: '🛡️' },
        { name: 'Du lịch', icon: '✈️' }
    ]
};

const CATEGORY_BUDGETS = {
    'Ăn uống': 2000000,
    'Đi lại': 600000,
    'Mua sắm': 800000,
    'Học tập': 1000000,
    'Chi phí cố định': 3000000,
    'Trả nợ': 2000000,
    'Khác': 500000
};

const WEEKLY_BUDGET_LIMIT = 1500000;

let goalConfig = JSON.parse(localStorage.getItem('meow_goal_config')) || {
    title: 'Mua điện thoại & Quỹ dự phòng',
    type: 'month',
    amount: 10000000
};

let goalViewMode = 'month';

const DEFAULT_TRANSACTIONS = [
    { id: 1, type: 'income', wallet: 'bank', amount: 15000000, category: 'Lương', date: '2026-10-05', note: 'Lương tháng 10 chuyển khoản' },
    { id: 2, type: 'expense', wallet: 'cash', amount: 350000, category: 'Ăn uống', date: '2026-10-03', note: 'Đi chợ & cà phê cuối tuần (Tuần 1)' },
    { id: 3, type: 'expense', wallet: 'bank', amount: 400000, category: 'Học tập', date: '2026-10-09', note: 'Mua tài liệu & khóa học (Tuần 2)' },
    { id: 4, type: 'saving', wallet: 'bank', amount: 5000000, category: 'Quỹ tiết kiệm tháng', date: '2026-10-10', note: 'Gửi tiết kiệm online' },
    { id: 5, type: 'expense', wallet: 'cash', amount: 550000, category: 'Ăn uống', date: '2026-10-15', note: 'Liên hoan nhóm (Tuần 3)' },
    { id: 6, type: 'expense', wallet: 'cash', amount: 150000, category: 'Đi lại', date: '2026-10-17', note: 'Đổ xăng & gửi xe (Tuần 3)' },
    { id: 7, type: 'expense', wallet: 'bank', amount: 350000, category: 'Mua sắm', date: '2026-10-18', note: 'Săn sale Shopee (Tuần 3)' },
    { id: 8, type: 'expense', wallet: 'cash', amount: 150000, category: 'Ăn uống', date: '2026-10-19', note: 'Ăn trưa & trà sữa hôm nay' }
];

const DEFAULT_WALLET_BASE = { bank: 2000000, cash: 2500000 };
const DEFAULT_FUTURE_INCOMES = [
    { id: 101, title: 'Tiền làm dự án Web Freelance', amount: 3500000, wallet: 'bank', date: '2026-10-25', note: 'Khách hẹn thanh toán đợt 2', received: false }
];
const DEFAULT_DEBTS = [
    { id: 201, title: 'Trả tiền mượn bạn Minh', amount: 500000, wallet: 'bank', date: '2026-10-22', note: 'Chuyển khoản trả tiền ăn nhóm', paid: false }
];

let transactions = JSON.parse(localStorage.getItem('meow_transactions')) || DEFAULT_TRANSACTIONS;
let walletBase = JSON.parse(localStorage.getItem('meow_wallet_base')) || DEFAULT_WALLET_BASE;
let futureIncomes = JSON.parse(localStorage.getItem('meow_future_incomes')) || DEFAULT_FUTURE_INCOMES;
let debts = JSON.parse(localStorage.getItem('meow_debts')) || DEFAULT_DEBTS;

let currentPeriodMode = 'month';
let pieChartInstance = null;
let lineChartInstance = null;

// ================= 2. HÀM TIỆN ÍCH & KIỂM TRA NGÀY HIỆN TẠI =================
// Lấy ngày hôm nay theo múi giờ địa phương (Định dạng YYYY-MM-DD)
function getTodayDateString() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatVND(number) {
    return Number(number || 0).toLocaleString('vi-VN') + ' ₫';
}

function formatDateVN(dateStr) {
    const parts = (dateStr || getTodayDateString()).split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function getCategoryIcon(type, categoryName) {
    const list = CATEGORIES[type] || [];
    const found = list.find(c => c.name === categoryName);
    return found ? found.icon : '🐾';
}

function getWeekCodeFromDate(dateStr) {
    const [yyyy, mm, dd] = (dateStr || getTodayDateString()).split('-');
    const day = Number(dd);
    let w = 'W4';
    if (day <= 7) w = 'W1';
    else if (day <= 14) w = 'W2';
    else if (day <= 21) w = 'W3';
    return `${yyyy}-${mm}-${w}`;
}

function getWeekLabel(weekCode) {
    const parts = weekCode.split('-');
    const ym = `${parts[1]}/${parts[0]}`;
    const map = {
        'W1': `Tuần 1 (01 - 07/${ym})`,
        'W2': `Tuần 2 (08 - 14/${ym})`,
        'W3': `Tuần 3 (15 - 21/${ym})`,
        'W4': `Tuần 4 (22 - cuối tháng ${ym})`
    };
    return map[parts[2]] || weekCode;
}

function saveToStorage() {
    localStorage.setItem('meow_transactions', JSON.stringify(transactions));
    localStorage.setItem('meow_wallet_base', JSON.stringify(walletBase));
    localStorage.setItem('meow_future_incomes', JSON.stringify(futureIncomes));
    localStorage.setItem('meow_debts', JSON.stringify(debts));
    localStorage.setItem('meow_goal_config', JSON.stringify(goalConfig));
}

// ================= 3. LỌC THỜI GIAN TOÀN CỤC =================
window.setPeriodMode = function(mode) {
    currentPeriodMode = mode;
    document.querySelectorAll('.period-btn:not(.goal-view-btn)').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    document.getElementById('picker-day').style.display = mode === 'day' ? 'inline-block' : 'none';
    document.getElementById('picker-week').style.display = mode === 'week' ? 'inline-block' : 'none';
    document.getElementById('picker-month').style.display = mode === 'month' ? 'inline-block' : 'none';

    const groupSelect = document.getElementById('expense-group-mode');
    if (groupSelect) {
        if (mode === 'day') groupSelect.value = 'day';
        else if (mode === 'week') groupSelect.value = 'day';
        else if (mode === 'month') groupSelect.value = 'week';
        else groupSelect.value = 'month';
    }

    renderApp();
};

window.quickViewPeriod = function(mode) {
    window.setPeriodMode(mode);
    window.switchTab('expense');
};

function getFilteredTransactionsByPeriod() {
    const dayVal = document.getElementById('picker-day').value || getTodayDateString();
    const weekVal = document.getElementById('picker-week').value || '2026-10-W3';
    const monthVal = document.getElementById('picker-month').value || '2026-10';

    let label = 'Tất cả thời gian';
    let filtered = [...transactions];

    if (currentPeriodMode === 'day') {
        filtered = transactions.filter(t => t.date === dayVal);
        label = `Ngày ${formatDateVN(dayVal)}`;
    } else if (currentPeriodMode === 'week') {
        filtered = transactions.filter(t => getWeekCodeFromDate(t.date) === weekVal);
        label = getWeekLabel(weekVal);
    } else if (currentPeriodMode === 'month') {
        filtered = transactions.filter(t => (t.date || '').startsWith(monthVal));
        const [y, m] = monthVal.split('-');
        label = `Tháng ${m}/${y}`;
    }

    return { filtered, label };
}

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('#nav-links li').forEach(li => li.classList.remove('active'));

    const targetPane = document.getElementById('tab-' + tabId);
    if (targetPane) targetPane.classList.add('active');

    const activeNav = document.querySelector('#nav-links li[data-tab="' + tabId + '"]');
    if (activeNav) activeNav.classList.add('active');
};

function calculateWalletBalances() {
    let bank = Number(walletBase.bank || 0);
    let cash = Number(walletBase.cash || 0);

    transactions.forEach(t => {
        const w = t.wallet || 'bank';
        const amt = Number(t.amount || 0);
        if (t.type === 'income') {
            if (w === 'cash') cash += amt;
            else bank += amt;
        } else if (t.type === 'expense' || t.type === 'saving') {
            if (w === 'cash') cash -= amt;
            else bank -= amt;
        }
    });

    return { bank, cash, total: bank + cash };
}

function renderApp() {
    const { filtered, label } = getFilteredTransactionsByPeriod();
    const todayStr = getTodayDateString();

    document.getElementById('header-period-label').textContent = `Đang xem: ${label}`;
    document.getElementById('dash-income-label').textContent = `Thu nhập (${label})`;
    document.getElementById('dash-expense-label').textContent = `Chi tiêu (${label})`;
    document.getElementById('expense-banner-label').textContent = `Tổng chi tiêu (${label})`;
    document.getElementById('income-banner-label').textContent = `Tổng thu nhập (${label})`;

    const periodIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const periodExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalSavingAll = transactions.filter(t => t.type === 'saving').reduce((s, t) => s + Number(t.amount), 0);

    const todayTx = transactions.filter(t => t.type === 'expense' && t.date === todayStr);
    const currentWeekCode = getWeekCodeFromDate(todayStr);
    const weekTx = transactions.filter(t => t.type === 'expense' && getWeekCodeFromDate(t.date) === currentWeekCode);
    const currentMonthPrefix = todayStr.slice(0, 7);
    const monthTx = transactions.filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthPrefix));

    document.getElementById('stat-today-expense').textContent = formatVND(todayTx.reduce((s, t) => s + Number(t.amount), 0));
    document.getElementById('stat-today-count').textContent = `${todayTx.length} khoản chi`;
    document.getElementById('stat-week-expense').textContent = formatVND(weekTx.reduce((s, t) => s + Number(t.amount), 0));
    document.getElementById('stat-week-count').textContent = `${weekTx.length} khoản chi`;
    document.getElementById('stat-month-expense').textContent = formatVND(monthTx.reduce((s, t) => s + Number(t.amount), 0));
    document.getElementById('stat-month-count').textContent = `${monthTx.length} khoản chi`;

    const balances = calculateWalletBalances();
    document.getElementById('dash-balance').textContent = formatVND(balances.total);
    document.getElementById('dash-bank-mini').textContent = formatVND(balances.bank);
    document.getElementById('dash-cash-mini').textContent = formatVND(balances.cash);
    document.getElementById('dash-income').textContent = formatVND(periodIncome);
    document.getElementById('dash-expense').textContent = formatVND(periodExpense);
    document.getElementById('dash-saving').textContent = formatVND(totalSavingAll);

    renderGoalProgressSection(totalSavingAll);

    const weekSum = weekTx.reduce((s, t) => s + Number(t.amount), 0);
    const weekPercent = (weekSum / WEEKLY_BUDGET_LIMIT) * 100;
    const weekProgressEl = document.getElementById('dash-week-progress');
    document.getElementById('dash-week-spent').textContent = formatVND(weekSum);
    weekProgressEl.style.width = Math.min(100, weekPercent) + '%';
    applyBudgetColor(weekProgressEl, weekPercent);

    const weekStatusEl = document.getElementById('dash-week-status');
    if (weekSum <= WEEKLY_BUDGET_LIMIT) {
        weekStatusEl.textContent = 'Bạn còn ' + formatVND(WEEKLY_BUDGET_LIMIT - weekSum) + ' cho tuần này.';
        weekStatusEl.style.color = 'var(--text-muted)';
    } else {
        weekStatusEl.textContent = 'Vượt ' + formatVND(weekSum - WEEKLY_BUDGET_LIMIT) + ' (' + Math.round(weekPercent) + '% ngân sách tuần!)';
        weekStatusEl.style.color = 'var(--danger)';
        weekStatusEl.style.fontWeight = '700';
    }

    document.getElementById('tab-income-total').textContent = formatVND(periodIncome);
    document.getElementById('tab-expense-total').textContent = formatVND(periodExpense);
    document.getElementById('tab-saving-total').textContent = formatVND(totalSavingAll);

    const uniqueExpenseDays = new Set(filtered.filter(t => t.type === 'expense').map(t => t.date)).size;
    const avgDaily = uniqueExpenseDays > 0 ? Math.round(periodExpense / uniqueExpenseDays) : 0;
    document.getElementById('expense-avg-daily').textContent =
        `Trung bình: ${formatVND(avgDaily)} / ngày có phát sinh chi tiêu (${uniqueExpenseDays} ngày)`;

    renderWeeklyBreakdownGrid();
    renderWalletAndDebtsTab(balances);
    renderTransactionLists(filtered);
    renderCategoryBudgets();
    updateCharts(filtered, label);
}

function applyBudgetColor(element, percentage) {
    if (percentage < 80) element.style.backgroundColor = 'var(--primary-pink)';
    else if (percentage >= 80 && percentage < 100) element.style.backgroundColor = 'var(--warning)';
    else element.style.backgroundColor = 'var(--danger)';
}

// ================= 4. QUẢN LÝ MỤC TIÊU THEO NGÀY / TUẦN / THÁNG =================
window.switchGoalView = function(viewMode) {
    goalViewMode = viewMode;
    document.querySelectorAll('.goal-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.goalview === viewMode);
    });
    renderGoalProgressSection(transactions.filter(t => t.type === 'saving').reduce((s, t) => s + Number(t.amount), 0));
};

function renderGoalProgressSection(totalSaving) {
    let targetAmount = Number(goalConfig.amount || 10000000);
    let titlePrefix = 'Tháng';
    let currentSaved = totalSaving;

    if (goalViewMode === 'week') {
        targetAmount = Math.round(targetAmount / 4);
        currentSaved = Math.round(totalSaving / 4);
        titlePrefix = 'Tuần';
    } else if (goalViewMode === 'day') {
        targetAmount = Math.round(targetAmount / 30);
        currentSaved = Math.round(totalSaving / 30);
        titlePrefix = 'Ngày';
    }

    const percent = Math.min(100, Math.round((currentSaved / targetAmount) * 100));

    document.getElementById('goal-view-title').textContent = `Mục tiêu ${titlePrefix}: ${goalConfig.title}`;
    document.getElementById('goal-view-target').textContent = formatVND(targetAmount);
    document.getElementById('goal-progress-bar').style.width = `${percent}%`;
    document.getElementById('goal-detail-text').textContent = `Đã đạt: ${formatVND(currentSaved)} / ${formatVND(targetAmount)} (${percent}%)`;
    document.getElementById('dash-goal').textContent = formatVND(targetAmount);
    document.getElementById('dash-saving-percent').textContent = `Đã đạt ${percent}% mục tiêu`;

    const goalRemain = Math.max(0, targetAmount - currentSaved);
    document.getElementById('dash-goal-remain').textContent = goalRemain > 0 ? `Cần thêm ${formatVND(goalRemain)}` : 'Đã hoàn thành mục tiêu! 🎉';

    const suggestionEl = document.getElementById('goal-suggestion-text');
    if (percent >= 100) {
        suggestionEl.textContent = 'Xuất sắc! Bạn đã vượt mục tiêu tiết kiệm kỳ này! 🏆';
        suggestionEl.style.color = 'var(--success)';
    } else if (percent >= 50) {
        suggestionEl.textContent = 'Cố gắng lên! Bạn đã đi được nửa chặng đường. 💪';
        suggestionEl.style.color = 'var(--primary-pink)';
    } else {
        suggestionEl.textContent = 'Hãy trích thêm một khoản nhỏ vào quỹ tiết kiệm nhé! 🐾';
        suggestionEl.style.color = 'var(--warning)';
    }
}

window.openGoalSettingsModal = function() {
    document.getElementById('goal-title-input').value = goalConfig.title;
    document.getElementById('goal-type-select').value = goalConfig.type;
    document.getElementById('goal-amount-input').value = goalConfig.amount;
    document.getElementById('goal-modal').classList.add('open');
};

window.closeGoalSettingsModal = function() {
    document.getElementById('goal-modal').classList.remove('open');
};

window.handleGoalSubmit = function(e) {
    e.preventDefault();
    goalConfig.title = document.getElementById('goal-title-input').value.trim();
    goalConfig.type = document.getElementById('goal-type-select').value;
    goalConfig.amount = Number(document.getElementById('goal-amount-input').value);

    saveToStorage();
    renderApp();
    closeGoalSettingsModal();
};

// ================= 5. CÁC HÀM RENDER KHÁC =================
function renderWeeklyBreakdownGrid() {
    const monthVal = document.getElementById('picker-month').value || '2026-10';
    const [yyyy, mm] = monthVal.split('-');
    const weeks = [
        { code: `${monthVal}-W1`, title: 'Tuần 1', range: `01/${mm} - 07/${mm}` },
        { code: `${monthVal}-W2`, title: 'Tuần 2', range: `08/${mm} - 14/${mm}` },
        { code: `${monthVal}-W3`, title: 'Tuần 3', range: `15/${mm} - 21/${mm}` },
        { code: `${monthVal}-W4`, title: 'Tuần 4', range: `22/${mm} - Cuối tháng` }
    ];

    const selectedWeek = document.getElementById('picker-week').value;
    const container = document.getElementById('weekly-breakdown-grid');

    container.innerHTML = weeks.map(w => {
        const spent = transactions
            .filter(t => t.type === 'expense' && getWeekCodeFromDate(t.date) === w.code)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const isActive = currentPeriodMode === 'week' && selectedWeek === w.code;

        return `
            <div class="week-box ${isActive ? 'active-week' : ''}" onclick="selectSpecificWeek('${w.code}')">
                <h4>${w.title}</h4>
                <p class="week-range">${w.range}</p>
                <p class="week-amt">${formatVND(spent)}</p>
            </div>
        `;
    }).join('');
}

window.selectSpecificWeek = function(weekCode) {
    const pickerWeek = document.getElementById('picker-week');
    if (![...pickerWeek.options].some(o => o.value === weekCode)) {
        const opt = document.createElement('option');
        opt.value = weekCode;
        opt.textContent = getWeekLabel(weekCode);
        pickerWeek.appendChild(opt);
    }
    pickerWeek.value = weekCode;
    window.setPeriodMode('week');
};

function renderWalletAndDebtsTab(balances) {
    const unpaidDebtTotal = debts.filter(d => !d.paid).reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingIncomeTotal = futureIncomes.filter(f => !f.received).reduce((sum, f) => sum + Number(f.amount), 0);

    document.getElementById('wallet-total-now').textContent = formatVND(balances.total);
    document.getElementById('wallet-after-debt').textContent = formatVND(balances.total - unpaidDebtTotal);
    document.getElementById('wallet-bank-amount').textContent = formatVND(balances.bank);
    document.getElementById('wallet-cash-amount').textContent = formatVND(balances.cash);
    document.getElementById('wallet-bank-base').textContent = 'Số dư đầu kỳ: ' + formatVND(walletBase.bank);
    document.getElementById('wallet-cash-base').textContent = 'Số dư đầu kỳ: ' + formatVND(walletBase.cash);

    document.getElementById('future-income-total').textContent = formatVND(pendingIncomeTotal);
    document.getElementById('debt-total').textContent = formatVND(unpaidDebtTotal);

    document.getElementById('future-income-list').innerHTML = futureIncomes.map(item => {
        const walletLabel = item.wallet === 'cash' ? '💵 Tiền mặt' : '🏦 Tài khoản';
        return `
            <div class="tx-item ${item.received ? 'done-item' : ''}">
                <div class="tx-left">
                    <div class="tx-cat-icon">${item.received ? '✅' : '🌱'}</div>
                    <div class="tx-info">
                        <h4>${item.title} <span class="wallet-badge">${walletLabel}</span></h4>
                        <p>Dự kiến: ${formatDateVN(item.date)} · ${item.note || 'Không ghi chú'}</p>
                    </div>
                </div>
                <div class="tx-right">
                    <span class="tx-amount income-text">+${formatVND(item.amount)}</span>
                    <div class="tx-actions">
                        ${!item.received
                            ? `<button type="button" class="btn-action-small" onclick="markFutureIncomeReceived(${item.id})">Đã nhận</button>`
                            : `<span class="sub-text">Đã cộng ví</span>`
                        }
                        <button type="button" onclick="deletePlanItem('future_income', ${item.id})" title="Xóa">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<p class="sub-text">Chưa có khoản thu nhập dự kiến nào.</p>';

    document.getElementById('debt-list').innerHTML = debts.map(item => {
        const walletLabel = item.wallet === 'cash' ? '💵 Tiền mặt' : '🏦 Tài khoản';
        return `
            <div class="tx-item ${item.paid ? 'done-item' : ''}">
                <div class="tx-left">
                    <div class="tx-cat-icon">${item.paid ? '✅' : '💳'}</div>
                    <div class="tx-info">
                        <h4>${item.title} <span class="wallet-badge">${walletLabel}</span></h4>
                        <p>Hạn trả: ${formatDateVN(item.date)} · ${item.note || 'Không ghi chú'}</p>
                    </div>
                </div>
                <div class="tx-right">
                    <span class="tx-amount expense-text">-${formatVND(item.amount)}</span>
                    <div class="tx-actions">
                        ${!item.paid
                            ? `<button type="button" class="btn-action-small pay-debt" onclick="markDebtPaid(${item.id})">Trả nợ</button>`
                            : `<span class="sub-text">Đã trả xong</span>`
                        }
                        <button type="button" onclick="deletePlanItem('debt', ${item.id})" title="Xóa">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<p class="sub-text">Tuyệt vời! Bạn không có khoản nợ nào cần trả.</p>';
}

// Khi xác nhận nhận tiền hoặc trả nợ -> Ghi nhận theo ngày hôm nay (không vượt quá hiện tại)
window.markFutureIncomeReceived = function(id) {
    const item = futureIncomes.find(f => f.id === id);
    if (!item || item.received) return;
    item.received = true;
    const todayStr = getTodayDateString();
    transactions.push({
        id: Date.now(), type: 'income', wallet: item.wallet || 'bank',
        amount: Number(item.amount), category: 'Nguồn khác',
        date: item.date <= todayStr ? item.date : todayStr,
        note: `Nhận khoản thu dự kiến: ${item.title}`
    });
    saveToStorage();
    renderApp();
};

window.markDebtPaid = function(id) {
    const item = debts.find(d => d.id === id);
    if (!item || item.paid) return;
    item.paid = true;
    const todayStr = getTodayDateString();
    transactions.push({
        id: Date.now(), type: 'expense', wallet: item.wallet || 'bank',
        amount: Number(item.amount), category: 'Trả nợ',
        date: item.date <= todayStr ? item.date : todayStr,
        note: `Trả nợ: ${item.title}`
    });
    saveToStorage();
    renderApp();
};

window.deletePlanItem = function(type, id) {
    if (!confirm('Bạn có chắc muốn xóa mục này không? 🐾')) return;
    if (type === 'future_income') futureIncomes = futureIncomes.filter(f => f.id !== id);
    else debts = debts.filter(d => d.id !== id);
    saveToStorage();
    renderApp();
};

function createTransactionHTML(tx) {
    const icon = getCategoryIcon(tx.type, tx.category);
    const sign = tx.type === 'income' ? '+' : (tx.type === 'expense' ? '-' : '🐷 ');
    const colorClass = tx.type === 'income' ? 'income-text' : (tx.type === 'expense' ? 'expense-text' : '');
    const walletLabel = tx.wallet === 'cash' ? '💵 Tiền mặt' : '🏦 Tài khoản';

    return `
        <div class="tx-item">
            <div class="tx-left">
                <div class="tx-cat-icon">${icon}</div>
                <div class="tx-info">
                    <h4>${tx.category} <span class="wallet-badge">${walletLabel}</span></h4>
                    <p>${formatDateVN(tx.date)} · ${tx.note || 'Không có ghi chú'}</p>
                </div>
            </div>
            <div class="tx-right">
                <span class="tx-amount ${colorClass}">${sign}${formatVND(tx.amount)}</span>
                <div class="tx-actions">
                    <button type="button" onclick="editTransaction(${tx.id})" title="Sửa">✏️</button>
                    <button type="button" onclick="deleteTransaction(${tx.id})" title="Xóa">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

function renderGroupedTransactions(list, groupMode) {
    if (!list.length) return '<p class="sub-text">Không có giao dịch nào trong kỳ đã chọn.</p>';
    const groups = {};
    list.forEach(tx => {
        let key = tx.date;
        if (groupMode === 'week') key = getWeekCodeFromDate(tx.date);
        else if (groupMode === 'month') key = (tx.date || '').slice(0, 7);
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
    });

    return Object.entries(groups).map(([key, items]) => {
        const groupTotal = items.reduce((s, t) => s + Number(t.amount), 0);
        let title = `📅 Ngày ${formatDateVN(key)}`;
        if (groupMode === 'week') title = `📆 ${getWeekLabel(key)}`;
        else if (groupMode === 'month') {
            const [y, m] = key.split('-');
            title = `🗓️ Tháng ${m}/${y}`;
        }
        return `
            <div class="tx-group-block">
                <div class="tx-group-header">
                    <span>${title} (${items.length} khoản)</span>
                    <span>Tổng: ${formatVND(groupTotal)}</span>
                </div>
                <div class="transaction-list">${items.map(createTransactionHTML).join('')}</div>
            </div>
        `;
    }).join('');
}

window.renderTransactionLists = function(periodFilteredList) {
    const baseList = periodFilteredList || getFilteredTransactionsByPeriod().filtered;
    const sorted = [...baseList].sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById('recent-transactions-list').innerHTML =
        sorted.slice(0, 6).map(createTransactionHTML).join('') || '<p class="sub-text">Chưa có giao dịch nào trong kỳ này.</p>';

    const incomes = sorted.filter(t => t.type === 'income');
    document.getElementById('income-transactions-list').innerHTML = renderGroupedTransactions(incomes, 'day');

    const selectedCat = document.getElementById('expense-category-filter').value;
    const groupMode = document.getElementById('expense-group-mode').value || 'day';
    const expenses = sorted.filter(t => t.type === 'expense' && (selectedCat === 'all' || t.category === selectedCat));
    document.getElementById('expense-transactions-list').innerHTML = renderGroupedTransactions(expenses, groupMode);

    const allSavings = [...transactions].filter(t => t.type === 'saving').sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('saving-transactions-list').innerHTML =
        allSavings.map(createTransactionHTML).join('') || '<p class="sub-text">Chưa có giao dịch tiết kiệm nào.</p>';
};

function renderCategoryBudgets() {
    const monthVal = document.getElementById('picker-month').value || '2026-10';
    const container = document.getElementById('category-budgets-list');
    let hasOverBudget = false;

    const html = Object.entries(CATEGORY_BUDGETS).map(([category, limit]) => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === category && (t.date || '').startsWith(monthVal))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const percent = (spent / limit) * 100;
        let barColor = 'var(--primary-pink)';
        let statusText = 'Còn ' + formatVND(Math.max(0, limit - spent));
        let statusColor = 'var(--primary-pink)';

        if (percent >= 80 && percent < 100) {
            barColor = 'var(--warning)';
            statusText = 'Sắp chạm ngưỡng · Còn ' + formatVND(limit - spent);
            statusColor = 'var(--warning)';
        } else if (percent >= 100) {
            hasOverBudget = true;
            barColor = 'var(--danger)';
            const over = spent - limit;
            statusText = over > 0 ? 'Vượt ' + formatVND(over) + ' · ' + Math.round(percent) + '%' : 'Chạm giới hạn 100%';
            statusColor = 'var(--danger)';
        }

        return `
            <div class="budget-item">
                <div class="budget-item-top">
                    <span>${getCategoryIcon('expense', category)} ${category}</span>
                    <span style="color: var(--text-muted); font-weight: 600;">${formatVND(spent)} / ${formatVND(limit)}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${Math.min(100, percent)}%; background-color: ${barColor};"></div>
                </div>
                <p class="sub-text" style="color: ${statusColor}; font-weight: 700; margin-top: 6px;">${statusText}</p>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
    document.getElementById('over-budget-badge').style.display = hasOverBudget ? 'inline-block' : 'none';
}

window.updateCharts = function(periodFilteredList, periodLabel) {
    if (typeof Chart === 'undefined') return;

    const currentObj = periodFilteredList ? { filtered: periodFilteredList, label: periodLabel } : getFilteredTransactionsByPeriod();
    const list = currentObj.filtered;

    const pieMode = document.getElementById('pie-filter').value;
    const filteredTx = list.filter(t => t.type === pieMode);
    const grouped = {};
    filteredTx.forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount); });

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);

    const ctxPie = document.getElementById('pieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Chưa có dữ liệu trong kỳ'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#4A90E2', '#F59E0B', '#EF4444', '#A855F7', '#10B981', '#EC4899', '#6366F1'],
                borderWidth: 2, borderColor: '#ffffff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '62%' }
    });

    let incomeSeries = [0, 0, 0, 0];
    let expenseSeries = [0, 0, 0, 0];
    const monthVal = document.getElementById('picker-month').value || '2026-10';
    ['W1', 'W2', 'W3', 'W4'].forEach((w, idx) => {
        const code = `${monthVal}-${w}`;
        incomeSeries[idx] = transactions.filter(t => t.type === 'income' && getWeekCodeFromDate(t.date) === code).reduce((s, t) => s + Number(t.amount), 0) / 1000000;
        expenseSeries[idx] = transactions.filter(t => t.type === 'expense' && getWeekCodeFromDate(t.date) === code).reduce((s, t) => s + Number(t.amount), 0) / 1000000;
    });

    const ctxLine = document.getElementById('lineChart').getContext('2d');
    if (lineChartInstance) lineChartInstance.destroy();

    lineChartInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
            datasets: [
                { label: 'Thu nhập (Tr)', data: incomeSeries, borderColor: '#4A90E2', backgroundColor: 'rgba(74, 144, 226, 0.1)', tension: 0.4, fill: true },
                { label: 'Chi tiêu (Tr)', data: expenseSeries, borderColor: '#E91E63', backgroundColor: 'rgba(233, 30, 99, 0.1)', tension: 0.4, fill: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' tr' } }, x: { grid: { display: false } } }
        }
    });
};

// ================= 6. MODAL GIAO DỊCH (CÓ KHÓA NGÀY TƯƠNG LAI) =================
function populateCategories(type, selectedValue = '') {
    const txCategorySelect = document.getElementById('tx-category');
    const list = CATEGORIES[type] || [];
    txCategorySelect.innerHTML = list.map(c => `<option value="${c.name}" ${c.name === selectedValue ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
}

window.setModalType = function(type) {
    document.getElementById('tx-type').value = type;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
    populateCategories(type);
};

// Áp dụng giới hạn max = ngày hôm nay cho ô chọn ngày giao dịch
function enforceMaxTodayOnTransactionDate() {
    const todayStr = getTodayDateString();
    const txDateInput = document.getElementById('tx-date');
    if (txDateInput) {
        txDateInput.max = todayStr; // Khóa không cho chọn ngày tương lai trên lịch
    }
}

window.openModalWithType = function(type = 'expense') {
    const todayStr = getTodayDateString();
    const pickerDayVal = document.getElementById('picker-day').value;

    document.getElementById('modal-title').textContent = 'Thêm giao dịch';
    document.getElementById('tx-id').value = '';
    document.getElementById('transaction-form').reset();

    // Khóa max ngày hôm nay và gán mặc định là hôm nay (hoặc ngày quá khứ đang xem)
    enforceMaxTodayOnTransactionDate();
    document.getElementById('tx-date').value = (pickerDayVal && pickerDayVal <= todayStr) ? pickerDayVal : todayStr;

    document.getElementById('tx-wallet').value = 'bank';
    window.setModalType(type);
    document.getElementById('transaction-modal').classList.add('open');
};

window.closeModal = function() { document.getElementById('transaction-modal').classList.remove('open'); };

window.handleFormSubmit = function(e) {
    e.preventDefault();
    const todayStr = getTodayDateString();
    const selectedDate = document.getElementById('tx-date').value;

    // KIỂM TRA CHẶN NGÀY TƯƠNG LAI
    if (selectedDate > todayStr) {
        alert(`Meow! 🐾 Không được phép nhập giao dịch cho ngày tương lai (Chỉ được chọn từ ngày hôm nay ${formatDateVN(todayStr)} trở về trước).\n\n💡 Nếu đây là khoản dự kiến trong tương lai, bạn hãy thêm ở mục "💳 Ví & Nợ" nhé!`);
        document.getElementById('tx-date').value = todayStr;
        return;
    }

    const id = document.getElementById('tx-id').value;
    const newTx = {
        id: id ? Number(id) : Date.now(),
        type: document.getElementById('tx-type').value,
        wallet: document.getElementById('tx-wallet').value,
        amount: Number(document.getElementById('tx-amount').value),
        category: document.getElementById('tx-category').value,
        date: selectedDate,
        note: document.getElementById('tx-note').value.trim()
    };
    if (id) {
        const idx = transactions.findIndex(t => t.id === Number(id));
        if (idx > -1) transactions[idx] = newTx;
    } else {
        transactions.push(newTx);
    }
    saveToStorage();
    renderApp();
    window.closeModal();
};

window.editTransaction = function(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    document.getElementById('modal-title').textContent = 'Chỉnh sửa giao dịch';
    document.getElementById('tx-id').value = tx.id;
    window.setModalType(tx.type);
    populateCategories(tx.type, tx.category);
    enforceMaxTodayOnTransactionDate();
    document.getElementById('tx-wallet').value = tx.wallet || 'bank';
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-note').value = tx.note;
    document.getElementById('transaction-modal').classList.add('open');
};

window.deleteTransaction = function(id) {
    if (confirm('Bạn có chắc muốn xóa giao dịch này không? 🐾')) {
        transactions = transactions.filter(t => t.id !== id);
        saveToStorage(); renderApp();
    }
};

window.openEditWalletModal = function() {
    document.getElementById('base-bank-input').value = walletBase.bank || 0;
    document.getElementById('base-cash-input').value = walletBase.cash || 0;
    document.getElementById('wallet-modal').classList.add('open');
};
window.closeWalletModal = function() { document.getElementById('wallet-modal').classList.remove('open'); };
window.handleWalletSubmit = function(e) {
    e.preventDefault();
    walletBase.bank = Number(document.getElementById('base-bank-input').value) || 0;
    walletBase.cash = Number(document.getElementById('base-cash-input').value) || 0;
    saveToStorage(); renderApp(); window.closeWalletModal();
};

window.openPlanModal = function(planType) {
    document.getElementById('plan-form').reset();
    document.getElementById('plan-type').value = planType;
    document.getElementById('plan-date').value = '2026-10-25';
    document.getElementById('plan-modal').classList.add('open');
};
window.closePlanModal = function() { document.getElementById('plan-modal').classList.remove('open'); };
window.handlePlanSubmit = function(e) {
    e.preventDefault();
    const planType = document.getElementById('plan-type').value;
    const item = {
        id: Date.now(), title: document.getElementById('plan-title').value.trim(),
        amount: Number(document.getElementById('plan-amount').value),
        wallet: document.getElementById('plan-wallet').value,
        date: document.getElementById('plan-date').value, note: document.getElementById('plan-note').value.trim()
    };
    if (planType === 'future_income') { item.received = false; futureIncomes.push(item); }
    else { item.paid = false; debts.push(item); }
    saveToStorage(); renderApp(); window.closePlanModal();
};

document.addEventListener('DOMContentLoaded', function() {
    const todayStr = getTodayDateString();
    const pickerDay = document.getElementById('picker-day');
    if (pickerDay) {
        pickerDay.value = todayStr;
        pickerDay.max = todayStr; // Bộ lọc ngày cũng khóa tối đa ở ngày hôm nay
    }
    enforceMaxTodayOnTransactionDate();

    ['transaction-modal', 'wallet-modal', 'plan-modal', 'goal-modal'].forEach(modalId => {
        const el = document.getElementById(modalId);
        if (el) el.addEventListener('click', function(e) { if (e.target === el) el.classList.remove('open'); });
    });
    renderApp();
});