// ==========================================================================
// APP STATE & CONFIG
// ==========================================================================
const BASE_URL = window.location.origin + '/api'; // Proxied via Nginx

let currentUser = null;
let activeTimers = {}; // Store intervals for active countdowns
let currentView = 'auth'; // 'auth' or 'dashboard'
let activeAuthTab = 'login'; // 'login' or 'register'

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    restoreSession();
    // Start polling auction data if logged in, otherwise show auth
    if (currentUser) {
        switchView('dashboard');
    } else {
        switchView('auth');
    }
    
    // Start global update loop for countdowns
    startTimerLoop();
});

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('notification-toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // Reset styles
    toast.className = 'toast';
    toast.classList.add(`toast-${type}`);
    
    // Set message
    toastMessage.textContent = message;

    // Set icon
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
    } else {
        toastIcon.className = 'fas fa-exclamation-circle';
    }

    // Slide in
    toast.classList.remove('hidden');

    // Auto slide out after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function formatIDR(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fillDemo(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
}

// ==========================================================================
// SESSION MANAGEMENT
// ==========================================================================
function saveSession(user) {
    currentUser = user;
    localStorage.setItem('lelang_user', JSON.stringify(user));
    updateUserMenuBar();
}

function restoreSession() {
    const session = localStorage.getItem('lelang_user');
    if (session) {
        currentUser = JSON.parse(session);
        updateUserMenuBar();
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('lelang_user');
    updateUserMenuBar();
    switchView('auth');
    showToast('Anda telah keluar dari sistem.');
}

function updateUserMenuBar() {
    const statusBar = document.getElementById('user-status-bar');
    if (currentUser) {
        statusBar.innerHTML = `
            <div class="user-badge">
                <i class="fas fa-user"></i>
                <span>${currentUser.username}</span>
                <span class="user-role-badge role-${currentUser.role}">${currentUser.role}</span>
            </div>
            <button class="btn-logout" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i> Keluar
            </button>
        `;
    } else {
        statusBar.innerHTML = `
            <span class="guest-text"><i class="fas fa-user-circle"></i> Guest Mode</span>
        `;
    }
}

// ==========================================================================
// VIEW ROUTING
// ==========================================================================
function switchView(viewName) {
    currentView = viewName;
    const viewAuth = document.getElementById('view-auth');
    const viewDashboard = document.getElementById('view-dashboard');

    if (viewName === 'auth') {
        viewAuth.classList.remove('hidden');
        viewDashboard.classList.add('hidden');
    } else {
        viewAuth.classList.add('hidden');
        viewDashboard.classList.remove('hidden');
        
        // Custom greeting
        document.getElementById('welcome-title').textContent = `Halo, ${currentUser.username}!`;
        if (currentUser.role === 'admin') {
            document.getElementById('welcome-subtitle').textContent = 'Anda masuk sebagai Pelelang (Admin). Kelola barang lelang di bawah.';
            document.getElementById('admin-panel').classList.remove('hidden');
        } else {
            document.getElementById('welcome-subtitle').textContent = 'Jelajahi dan tawarkan harga terbaik Anda untuk memenangkan barang.';
            document.getElementById('admin-panel').classList.add('hidden');
        }
        
        fetchBarang();
    }
}

function switchAuthTab(tab) {
    activeAuthTab = tab;
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabLoginBtn.classList.remove('active');
        tabRegisterBtn.classList.add('active');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

// ==========================================================================
// API REQUESTS & BUSINESS LOGIC
// ==========================================================================

async function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        const data = await response.json();

        if (response.ok) {
            saveSession(data.user);
            switchView('dashboard');
            showToast(`Selamat datang, ${data.user.username}!`);
            document.getElementById('login-form').reset();
        } else {
            showToast(data.message || 'Login gagal.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('register-username').value;
    const passwordInput = document.getElementById('register-password').value;
    const roleInput = document.getElementById('register-role').value;

    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput, role: roleInput })
        });
        const data = await response.json();

        if (response.ok) {
            showToast('Registrasi berhasil! Silakan masuk.');
            switchAuthTab('login');
            // Auto fill username
            document.getElementById('login-username').value = usernameInput;
            document.getElementById('register-form').reset();
        } else {
            showToast(data.message || 'Registrasi gagal.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server.', 'error');
    }
}

async function fetchBarang() {
    const container = document.getElementById('barang-container');
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Memuat data barang lelang...</p>
        </div>
    `;

    try {
        const response = await fetch(`${BASE_URL}/barang`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const items = await response.json();
        
        renderBarangList(items);
        updateStatistics(items);
    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger)"></i>
                <p>Gagal memuat barang lelang. Pastikan database dan backend aktif.</p>
            </div>
        `;
    }
}

function updateStatistics(items) {
    const statsContainer = document.getElementById('dashboard-stats');
    const totalItems = items.length;
    const activeItems = items.filter(item => item.status === 'aktif').length;
    
    if (currentUser.role === 'admin') {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-val">${totalItems}</div>
                <div class="stat-label">Total Barang</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" style="color: var(--success);">${activeItems}</div>
                <div class="stat-label">Lelang Aktif</div>
            </div>
        `;
    } else {
        const yourBidsCount = items.filter(item => item.pemenang_id === currentUser.id).length;
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-val" style="color: var(--success);">${activeItems}</div>
                <div class="stat-label">Lelang Aktif</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" style="color: var(--secondary);">${yourBidsCount}</div>
                <div class="stat-label">Tawaran Anda Tertinggi</div>
            </div>
        `;
    }
}

function renderBarangList(items) {
    const container = document.getElementById('barang-container');
    if (items.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-box-open" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
                <p>Belum ada barang lelang terdaftar saat ini.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    // Clear old active timer references
    activeTimers = {};

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = `barang-card glass`;
        card.id = `item-card-${item.id}`;

        // Badge determination
        let badgeClass = 'badge-active';
        let badgeLabel = 'LIVE';
        
        if (item.status === 'selesai') {
            badgeClass = 'badge-ended';
            badgeLabel = 'EXPIRED';
        } else if (item.status === 'ditutup') {
            badgeClass = 'badge-closed';
            badgeLabel = 'CLOSED';
        }

        // Check if current user is winning
        const isWinning = currentUser && item.pemenang_id === currentUser.id;
        const winnerDisplay = item.pemenang_nama ? 
            `<span class="${isWinning ? 'winner-label' : ''}">${item.pemenang_nama} ${isWinning ? '(Anda)' : ''}</span>` : 
            `<span class="text-muted">- Belum Ada -</span>`;

        // Render card inner body
        card.innerHTML = `
            <span class="card-badge ${badgeClass}">${badgeLabel}</span>
            <div class="card-body">
                <h3 class="card-title">${item.nama_barang}</h3>
                <p class="card-desc" title="${item.deskripsi}">${item.deskripsi}</p>
                
                <div class="card-details">
                    <div class="detail-row">
                        <span class="detail-lbl">Harga Awal:</span>
                        <span class="detail-val">${formatIDR(item.harga_awal)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">Tawaran Tertinggi:</span>
                        <span class="detail-val price-now">${formatIDR(item.harga_sekarang)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">Penawar Tertinggi:</span>
                        <span class="detail-val">${winnerDisplay}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">Sisa Waktu:</span>
                        <span class="detail-val countdown running" id="countdown-${item.id}">--:--:--</span>
                    </div>
                </div>

                <div class="bid-form">
                    ${item.status === 'aktif' ? `
                        ${currentUser.role === 'user' ? `
                            <div class="bid-input-container">
                                <input type="number" id="bid-input-${item.id}" 
                                       placeholder="Nominal (Min. ${Math.floor(item.harga_sekarang + 10000)})" 
                                       min="${item.harga_sekarang + 1}">
                                <button class="btn btn-primary" onclick="placeBid(${item.id})">
                                    <i class="fas fa-hand-holding-usd"></i> Tawar
                                </button>
                            </div>
                        ` : ''}
                        
                        <div class="bid-actions">
                            <button class="btn btn-outline btn-sm history-btn-span" onclick="viewHistory(${item.id}, '${item.nama_barang}')">
                                <i class="fas fa-history"></i> Riwayat
                            </button>
                            ${currentUser.role === 'admin' ? `
                                <button class="btn btn-purple btn-sm" onclick="closeAuction(${item.id})">
                                    <i class="fas fa-gavel"></i> Tutup Lelang
                                </button>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="ended-status-msg" style="text-align: center; font-size: 0.9rem; padding: 8px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.02); color: var(--color-text-secondary); width: 100%;">
                            <i class="fas fa-lock"></i> Lelang Selesai. Pemenang: <strong>${item.pemenang_nama || 'Tidak ada'}</strong>
                        </div>
                        <div style="margin-top: 10px; width: 100%;">
                            <button class="btn btn-outline btn-sm btn-block" onclick="viewHistory(${item.id}, '${item.nama_barang}')">
                                <i class="fas fa-history"></i> Lihat Riwayat Tawaran
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;

        container.appendChild(card);

        // Keep track of countdown target date
        if (item.status === 'aktif') {
            activeTimers[item.id] = {
                targetDate: new Date(item.tanggal_selesai),
                elementId: `countdown-${item.id}`
            };
        } else {
            const timerEl = document.getElementById(`countdown-${item.id}`);
            if (timerEl) {
                timerEl.textContent = 'SELESAI';
                timerEl.className = 'detail-val countdown expired';
            }
        }
    });

    // Run first manual update to set times immediately
    updateCountdowns();
}

async function handleAddBarang(event) {
    event.preventDefault();
    const nama = document.getElementById('add-nama').value;
    const deskripsi = document.getElementById('add-deskripsi').value;
    const hargaAwal = document.getElementById('add-harga-awal').value;
    const durasi = document.getElementById('add-durasi').value;

    try {
        const response = await fetch(`${BASE_URL}/barang`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama_barang: nama,
                deskripsi: deskripsi,
                harga_awal: hargaAwal,
                durasi_menit: durasi
            })
        });
        const data = await response.json();

        if (response.ok) {
            showToast('Barang lelang berhasil dirilis!');
            document.getElementById('add-barang-form').reset();
            fetchBarang();
        } else {
            showToast(data.message || 'Gagal menambahkan barang.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server.', 'error');
    }
}

async function placeBid(itemId) {
    const input = document.getElementById(`bid-input-${itemId}`);
    const jumlahTawaran = parseFloat(input.value);

    if (isNaN(jumlahTawaran) || jumlahTawaran <= 0) {
        showToast('Masukkan jumlah tawaran yang valid!', 'error');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/barang/${itemId}/bid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                jumlah_tawaran: jumlahTawaran
            })
        });
        const data = await response.json();

        if (response.ok) {
            showToast('Tawaran Anda berhasil diajukan!');
            input.value = '';
            fetchBarang();
        } else {
            showToast(data.message || 'Tawaran ditolak.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal mengirim penawaran.', 'error');
    }
}

async function closeAuction(itemId) {
    if (!confirm('Apakah Anda yakin ingin menutup lelang barang ini secara manual sekarang?')) {
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/barang/${itemId}/tutup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (response.ok) {
            showToast(`Lelang ditutup! Pemenang: ${data.pemenang} (${formatIDR(data.harga_akhir)})`);
            fetchBarang();
        } else {
            showToast(data.message || 'Gagal menutup lelang.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server.', 'error');
    }
}

async function viewHistory(itemId, namaBarang) {
    document.getElementById('modal-title').textContent = `Riwayat: ${namaBarang}`;
    
    const infoEl = document.getElementById('modal-item-info');
    infoEl.innerHTML = `<p style="color:var(--color-text-secondary)"><i class="fas fa-spinner fa-spin"></i> Mengambil riwayat bid...</p>`;
    
    const rowsEl = document.getElementById('modal-history-rows');
    rowsEl.innerHTML = '';

    document.getElementById('history-modal').classList.remove('hidden');

    try {
        const response = await fetch(`${BASE_URL}/barang/${itemId}/tawaran`);
        if (!response.ok) throw new Error('Fail');
        const history = await response.json();
        
        infoEl.innerHTML = `
            <p style="color:var(--color-text-secondary)">Total penawaran diajukan: <strong>${history.length} kali</strong></p>
        `;

        if (history.length === 0) {
            rowsEl.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;color:var(--color-text-muted)">Belum ada penawaran untuk barang ini.</td>
                </tr>
            `;
            return;
        }

        history.forEach((bid, idx) => {
            const date = new Date(bid.waktu_tawaran);
            const timeStr = date.toLocaleTimeString('id-ID') + ' - ' + date.toLocaleDateString('id-ID');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${idx + 1}</strong></td>
                <td><i class="fas fa-user-circle" style="color:var(--primary);margin-right:5px"></i> ${bid.username}</td>
                <td style="color:var(--success);font-weight:bold">${formatIDR(bid.jumlah_tawaran)}</td>
                <td style="color:var(--color-text-muted);font-size:0.8rem">${timeStr}</td>
            `;
            rowsEl.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        infoEl.innerHTML = `<p style="color:var(--danger)">Gagal memuat riwayat penawaran.</p>`;
    }
}

function closeHistoryModal() {
    document.getElementById('history-modal').classList.add('hidden');
}

// Close modal on click outside content
window.onclick = function(event) {
    const modal = document.getElementById('history-modal');
    if (event.target === modal) {
        modal.classList.add('hidden');
    }
}

// ==========================================================================
// COUNTDOWN TIMER LOOP
// ==========================================================================
function startTimerLoop() {
    setInterval(updateCountdowns, 1000);
}

function updateCountdowns() {
    const now = new Date().getTime();
    
    Object.keys(activeTimers).forEach(id => {
        const timer = activeTimers[id];
        const distance = timer.targetDate.getTime() - now;
        const element = document.getElementById(timer.elementId);

        if (!element) return;

        if (distance < 0) {
            element.textContent = 'WAKTU HABIS';
            element.className = 'detail-val countdown expired';
            delete activeTimers[id];
            
            // Reload list quietly to update state
            setTimeout(fetchBarang, 2000);
        } else {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const pad = (num) => String(num).padStart(2, '0');
            element.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
    });
}
