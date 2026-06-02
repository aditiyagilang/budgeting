const APP_CONFIG = {
    endpointUrl: 'https://script.google.com/macros/s/AKfycbxMcv-Eqek9d8FYCMSJZ-TS-vCRP-wM9q1L9Owze8d7lvY4oxEcDBMGDjBaAu3-mw2g6A/exec',
    token: '1Ke5JjAZ7jsnYXR07bt13WyTe9zGTBRxa9A-iMnJSf0k',
    targetSheet: ''
};

let categoryOptions = {
    Pendapatan: ['Gaji', 'Bisnis', 'Usaha Sampingan', 'Dividen', 'Pendapatan Bunga', 'Komisi'],
    Pengeluaran: ['Makanan', 'Jajan', 'Dihutang', 'Parkir', 'Body care', 'Akomodasi', 'Transport'],
    Tabungan: ['Di Hutang', 'Dana Darurat', 'Investasi', 'Reksa Dana'],
    Tagihan: ['Kos', 'Listrik', 'Kuota'],
    'Pembayaran Utang': ['Cicilan', 'Pinjaman', 'Kartu Kredit']
};

const form = document.getElementById('transactionForm');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const categoryList = document.getElementById('categoryList');
const amountInput = document.getElementById('amount');
const noteInput = document.getElementById('note');
const statusPill = document.getElementById('connectionStatus');
const submitButton = document.getElementById('submitButton');
const logPanel = document.getElementById('logPanel');
const logList = document.getElementById('logList');

function updateConnectionStatus() {
    const isReady = isAppsScriptUrl(APP_CONFIG.endpointUrl) && Boolean(APP_CONFIG.token);
    statusPill.textContent = isReady ? 'Endpoint siap' : 'Endpoint belum lengkap';
    statusPill.classList.toggle('ready', isReady);
}

function renderCategoryList() {
    const options = categoryOptions[typeInput.value] || [];
    categoryList.innerHTML = options.map((item) => `<option value="${item}"></option>`).join('');
}

function normalizeAmount(value) {
    const cleaned = String(value).replace(/[^\d,-]/g, '').replace(',', '.');
    return Number(cleaned);
}

function addLog(message, tone = 'neutral') {
    logPanel.hidden = false;
    const row = document.createElement('div');
    row.className = `log-item ${tone}`;
    row.textContent = message;
    logList.prepend(row);
}

function isAppsScriptUrl(value) {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(String(value || '').trim());
}

async function sendTransaction(payload) {
    if (!APP_CONFIG.endpointUrl) {
        throw new Error('Apps Script Web App URL belum diisi.');
    }

    if (!isAppsScriptUrl(APP_CONFIG.endpointUrl)) {
        throw new Error('URL harus Web App Apps Script, bukan link spreadsheet. Formatnya https://script.google.com/macros/s/.../exec');
    }

    if (!APP_CONFIG.token) {
        throw new Error('Token rahasia belum diisi.');
    }

    const params = new URLSearchParams({
        action: 'add',
        source: 'web',
        token: APP_CONFIG.token,
        type: payload.type,
        category: payload.category,
        amount: String(payload.amount),
        note: payload.note,
        sheet: APP_CONFIG.targetSheet
    });

    const data = await requestJsonp(params);
    if (!data.ok) {
        throw new Error(data.message || 'Transaksi gagal disimpan.');
    }

    return data;
}

function requestJsonp(params) {
    return new Promise((resolve, reject) => {
        const callbackName = `budgetingCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        const timeout = window.setTimeout(() => {
            cleanup();
            reject(new Error('Request ke Apps Script timeout.'));
        }, 15000);

        function cleanup() {
            window.clearTimeout(timeout);
            delete window[callbackName];
            script.remove();
        }

        window[callbackName] = (data) => {
            cleanup();
            resolve(data);
        };

        params.set('callback', callbackName);
        script.src = `${APP_CONFIG.endpointUrl}?${params.toString()}`;
        script.onerror = () => {
            cleanup();
            reject(new Error('Tidak bisa menghubungi Apps Script.'));
        };
        document.body.appendChild(script);
    });
}

async function loadCategories() {
    const params = new URLSearchParams({
        action: 'categories',
        sheet: APP_CONFIG.targetSheet
    });
    const data = await requestJsonp(params);
    if (!data.ok) {
        throw new Error(data.message || 'Kategori gagal dimuat.');
    }
    categoryOptions = { ...categoryOptions, ...data.categories };
    renderCategoryList();
}

document.getElementById('clearButton').addEventListener('click', () => {
    form.reset();
    renderCategoryList();
});

typeInput.addEventListener('change', () => {
    categoryInput.value = '';
    renderCategoryList();
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = normalizeAmount(amountInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        addLog('Nominal harus berupa angka lebih dari 0.', 'error');
        amountInput.focus();
        return;
    }

    const payload = {
        type: typeInput.value,
        category: categoryInput.value.trim(),
        amount,
        note: noteInput.value.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';

    try {
        const result = await sendTransaction(payload);
        addLog(`Tersimpan di sheet ${result.sheetName} baris ${result.row}.`, 'success');
        form.reset();
        renderCategoryList();
    } catch (error) {
        addLog(error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan Transaksi';
    }
});

updateConnectionStatus();
renderCategoryList();
loadCategories().catch((error) => {
    addLog(error.message, 'error');
});
