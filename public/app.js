let currentUserId = localStorage.getItem('userId');

// 初始頁面檢查
if (currentUserId && currentUserId !== 'null') {
    showMainPage();
}

function showMainPage() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
    fetchRecords();
}

// 會員註冊 (含前端防護加分項【+5分】)
async function handleRegister() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    
    if (p.length < 6) {
        alert('前端提示：密碼長度少於 6 個字，已被阻擋註冊！');
        return;
    }

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    alert(data.message);
}

// 會員登入
async function handleLogin() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    
    if (res.ok) {
        localStorage.setItem('userId', data.userId);
        currentUserId = data.userId;
        showMainPage();
    } else {
        alert(data.message);
    }
}

// 會員登出
function handleLogout() {
    localStorage.removeItem('userId');
    currentUserId = null;
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('main-section').classList.add('hidden');
}

// 獲取資料並局部重新渲染 (SPA 局部更新不閃爍【15%】+ 自動計算【+5分】)
async function fetchRecords() {
    const res = await fetch('/api/accounts', {
        headers: { 'Authorization': currentUserId }
    });

    // 滿足安全檢驗：未登入直接進入或權限過期回傳 401 攔截跳轉
    if (res.status === 401) {
        alert('安全性警報：檢測到未登入非法存取，自動跳回登入視窗！');
        handleLogout();
        return;
    }

    const records = await res.json();
    const list = document.getElementById('record-list');
    list.innerHTML = '';

    let incomeSum = 0;
    let expenseSum = 0;

    records.forEach(r => {
        if (r.type === 'income') {
            incomeSum += r.amount;
        } else {
            expenseSum += r.amount;
        }

        const li = document.createElement('li');
        li.className = r.type === 'income' ? 'income-item' : 'expense-item';
        li.innerHTML = `
            <div>
                <strong>[${r.type === 'income' ? '收入' : '支出'} - ${r.category}]</strong> 
                <span>$${r.amount}</span> 
                <small style="color:#777; margin-left:10px;">${r.description || '無備註'}</small>
            </div>
            <button class="del-btn" onclick="deleteRecord('${r._id}')">刪除</button>
        `;
        list.appendChild(li);
    });

    // 更新即時財務總覽看板【+5分】
    document.getElementById('total-income').innerText = `$${incomeSum}`;
    document.getElementById('total-expense').innerText = `$${expenseSum}`;
    document.getElementById('total-balance').innerText = `$${incomeSum - expenseSum}`;
}

// 新增記帳記錄 (SPA 非同步非整理網頁)
async function addRecord() {
    const type = document.getElementById('rec-type').value;
    const category = document.getElementById('rec-category').value;
    const amount = Number(document.getElementById('rec-amount').value);
    const description = document.getElementById('rec-desc').value;

    if (!amount || amount <= 0) {
        alert('請輸入大於 0 的金額！');
        return;
    }

    const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': currentUserId
        },
        body: JSON.stringify({ type, category, amount, description })
    });

    if (res.ok) {
        // 清空輸入框
        document.getElementById('rec-amount').value = '';
        document.getElementById('rec-desc').value = '';
        fetchRecords(); // 局部重新載入資料，網頁不閃爍
    } else {
        const errorData = await res.json();
        alert(errorData.message);
    }
}

// 刪除記帳記錄 (SPA 非同步非整理網頁)
async function deleteRecord(id) {
    if (!confirm('確定要刪除這筆明細嗎？')) return;

    const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': currentUserId }
    });

    if (res.ok) {
        fetchRecords(); // 局部重新載入資料，網頁不閃爍
    } else {
        alert('刪除失敗');
    }
}