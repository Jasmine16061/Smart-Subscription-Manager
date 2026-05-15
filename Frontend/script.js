/* Backend API */
const API_URL = 'http://localhost:5000/api';
const CURRENT_USER_ID = 1; // Temporary test user ID from database

let subscriptions = [];
let myChart = null;

/* Page Initialization */
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('sub-date');
    if (dateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        dateInput.value = todayStr;
    }
    
    fetchSubscriptions(); // Fetch fresh data from MySQL backend on page load
});

/* Fetch Subscriptions from Backend (Read) */
async function fetchSubscriptions() {
    try {
        const response = await fetch(`${API_URL}/subscriptions/${CURRENT_USER_ID}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Map database naming conventions (snake_case) to frontend expectations
        subscriptions = data.map(sub => ({
            id: sub.id,
            name: sub.name,
            amount: parseFloat(sub.amount),
            category: sub.category,
            startDateStr: sub.start_date.split('T')[0], // Clean SQL Date string
            expiryDateStr: sub.expiry_date.split('T')[0],
            frequency: sub.frequency,
            duration: sub.duration,
            monthlyAvg: (sub.frequency === 'yearly') ? sub.amount / 12 : sub.amount
        }));
        
        updateUI();
    } catch (err) {
        console.error("Failed to fetch subscriptions:", err);
    }
}

/* Date Formatting Functions */
function formatDateWithSpaces(dateStr) {
    if (!dateStr) return "";
    let clean = dateStr.replace(/[\/-]/g, '-'); 
    let parts = clean.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[0]} / ${parts[1]} / ${parts[2]}`;
}

function calculateExpiry(startStr, freq, dur) {
    let date = new Date(startStr + 'T00:00:00');
    if (freq === 'monthly') {
        date.setMonth(date.getMonth() + dur);
    } else {
        date.setFullYear(date.getFullYear() + dur);
    }
    return date.toISOString().split('T')[0];
}

/* Input & Placeholder Update */
function updatePlaceholder() {
    const freq = document.getElementById('sub-frequency').value;
    document.getElementById('sub-duration').placeholder = (freq === 'yearly') ? "Duration (Years)" : "Duration (Months)";
}

/* Add Subscription Function */
document.getElementById('add-btn').addEventListener('click', async () => {
    const name = document.getElementById('sub-name').value.trim();
    const amount = parseFloat(document.getElementById('sub-amount').value);
    const category = document.getElementById('sub-category').value;
    const startDateStr = document.getElementById('sub-date').value;
    const frequency = document.getElementById('sub-frequency').value;
    const duration = parseInt(document.getElementById('sub-duration').value) || 1;

    if (!name || isNaN(amount) || amount <= 0) return;

    const expiryDateStr = calculateExpiry(startDateStr, frequency, duration);

    // Prepare data payload for backend API
    const newSubData = {
        user_id: CURRENT_USER_ID,
        name,
        amount,
        category,
        startDateStr,
        expiryDateStr,
        frequency,
        duration
    };

    try {
        const response = await fetch(`${API_URL}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSubData)
        });
        
        if (response.ok) {
            // Clear inputs and refresh data from server
            document.getElementById('sub-name').value = '';
            document.getElementById('sub-amount').value = '';
            fetchSubscriptions(); 
        } else {
            console.error("Server refused to add subscription");
        }
    } catch (err) {
        console.error("Error sending data to server:", err);
    }
});

/* Delete Subscription Function (Delete) */
async function deleteSub(id) {
    try {
        const response = await fetch(`${API_URL}/subscriptions/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            // Refresh list from server after deletion
            fetchSubscriptions();
        } else {
            console.error("Server refused to delete item");
        }
    } catch (err) {
        console.error("Error deleting subscription:", err);
    }
}

function getNextBilling(sub, today) {
    let next = new Date(sub.startDateStr + 'T00:00:00');
    const expiry = new Date(sub.expiryDateStr + 'T00:00:00');
    while (next.getTime() <= today.getTime() && next < expiry) {
        if (sub.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
        else next.setFullYear(next.getFullYear() + 1);
    }
    return next >= expiry ? expiry : next;
}

/* Main UI Rendering Function */
function updateUI() {
    const list = document.getElementById('sub-list');
    list.innerHTML = '';
    let totalMonthly = 0;
    let totalYearlyTotal = 0; 
    let categoryData = {};
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    subscriptions.sort((a, b) => {
        const expiryA = new Date(a.expiryDateStr + 'T00:00:00');
        const expiryB = new Date(b.expiryDateStr + 'T00:00:00');
        const isExpiredA = today >= expiryA;
        const isExpiredB = today >= expiryB;

        if (isExpiredA !== isExpiredB) {
            return isExpiredA ? 1 : -1;
        }

        const nextA = getNextBilling(a, today);
        const nextB = getNextBilling(b, today);
        return nextA - nextB;
    });

    /* Generate Subscription Cards */
    subscriptions.forEach(sub => {
        const start = new Date(sub.startDateStr + 'T00:00:00');
        const expiry = new Date(sub.expiryDateStr + 'T00:00:00');
        const isExpired = today >= expiry;

        if (!isExpired) {
            totalMonthly += sub.monthlyAvg;
            categoryData[sub.category] = (categoryData[sub.category] || 0) + sub.monthlyAvg;
        }

        /* Calculate yearly payment count */
        let countInCurrentYear = 0;
        let checkDate = new Date(sub.startDateStr + 'T00:00:00');
        const yearEnd = new Date(currentYear, 11, 31);
        while (checkDate <= yearEnd && checkDate < expiry) {
            if (checkDate.getFullYear() === currentYear) countInCurrentYear++;
            if (sub.frequency === 'monthly') checkDate.setMonth(checkDate.getMonth() + 1);
            else checkDate.setFullYear(checkDate.getFullYear() + 1);
        }
        totalYearlyTotal += sub.amount * countInCurrentYear;

        /* Warning & Expiry Logic */
        const nextBilling = getNextBilling(sub, today);
        const diffDays = Math.ceil((nextBilling - today) / (1000 * 60 * 60 * 24));
        const isWarning = !isExpired && diffDays <= 3;
        const dayLabel = diffDays <= 1 ? "day" : "days";
        const displayUnit = sub.frequency === 'yearly' ? 'year' : 'month';

        /* Create Subscription Card */
        const li = document.createElement('li');
        li.className = `sub-item ${isWarning ? 'warning-card' : ''} ${isExpired ? 'expired-card' : ''}`;
        
        li.innerHTML = `
            <div style="${isExpired ? 'opacity: 0.6;' : ''}">
                <span class="category-tag">${sub.category}</span>
                <span class="name">${sub.name} ${isExpired ? '(Expired)' : (isWarning ? '⚠️' : '')}</span>
                <div class="details">
                    ${isExpired ? 'Subscription Ended' : `Next Billing: <strong>${formatDateWithSpaces(nextBilling.toISOString().split('T')[0])}</strong> &nbsp;&nbsp; (<span class="${isWarning ? 'warning-text' : ''}">${diffDays} ${dayLabel} left</span>)`}<br>
                    Period: <strong>${formatDateWithSpaces(sub.startDateStr)}</strong> ~ <strong>${formatDateWithSpaces(sub.expiryDateStr)}</strong>
                </div>
            </div>
            <div style="display:flex;align-items:center;">
                <div class="sub-price">
                    <strong>$${Math.round(sub.amount)}</strong>
                    <small>/${displayUnit}</small>
                </div>
                <i class="fa-regular fa-trash-can delete-btn"></i>
            </div>
        `;
        li.querySelector('.delete-btn').addEventListener('click', () => deleteSub(sub.id));
        list.appendChild(li);
    });

    /* Update Dashboard Totals */
    document.getElementById('total-cost-month').innerText = `$ ${Math.round(totalMonthly)}`;
    document.getElementById('total-cost-year').innerText = `$ ${Math.round(totalYearlyTotal)}`;
    updateChart(categoryData);
}

/* Update Doughnut Chart */
function updateChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (myChart) myChart.destroy();
    if (Object.keys(data).length === 0) return;
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#6366f1', '#22c55e', '#fb923c', '#0ea5e9', '#facc15', '#f87171'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11, weight: '600' } } } } }
    });
}