// =============================================
// 🎯 القرية المظلمة - العميل المعدل لـ GitHub Pages
// =============================================

// 🔌 الاتصال مع الخادم - استخدم Render أو Glitch
const socket = io('https://dark-village-server.onrender.com');

// 🎯 حالة التطبيق
const state = {
    currentPlayer: {
        name: '',
        id: '',
        isGameMaster: false,
        role: null,
        isAlive: true
    },
    currentRoom: {
        id: '',
        name: '',
        code: '',
        players: [],
        maxPlayers: 10,
        gameState: 'waiting'
    },
    isInRoom: false
};

// 🎭 تعريف الأدوار
const ROLES = {
    VILLAGER: { id: 'villager', name: 'قروي', emoji: '👨‍🌾', color: '#FFFFFF' },
    SEER: { id: 'seer', name: 'العرافة', emoji: '🔮', color: '#FFFFFF' },
    WITCH: { id: 'witch', name: 'الساحرة', emoji: '🧪', color: '#8A2BE2' },
    GUARDIAN: { id: 'guardian', name: 'الضامن', emoji: '💙', color: '#1E90FF' },
    HUNTER: { id: 'hunter', name: 'الصياد', emoji: '💚', color: '#32CD32' },
    CHEF: { id: 'chef', name: 'القائد', emoji: '👑', color: '#FFD700' },
    WEREWOLF_ALPHA: { id: 'werewolf_alpha', name: 'الذئب ألفا', emoji: '🖤', color: '#000000' },
    WEREWOLF: { id: 'werewolf', name: 'ذئب', emoji: '🖤', color: '#000000' }
};

// 🎯 عناصر DOM
const elements = {};

// 🚀 تهيئة التطبيق
function initializeApp() {
    console.log('🚀 تهيئة التطبيق لـ GitHub Pages...');
    initializeElements();
    attachEventListeners();
    initializeSocketListeners();
    
    console.log('✅ التطبيق جاهز على GitHub Pages');
}

// 🔗 تجهيز العناصر
function initializeElements() {
    elements.playerNameInput = document.getElementById('playerName');
    elements.createRoomBtn = document.getElementById('createRoomBtn');
    elements.joinRoomBtn = document.getElementById('joinRoomBtn');
    elements.roomInfo = document.getElementById('roomInfo');
    elements.roomNameDisplay = document.getElementById('roomNameDisplay');
    elements.roomCodeDisplay = document.getElementById('roomCodeDisplay');
    elements.playerRoleDisplay = document.getElementById('playerRoleDisplay');
    elements.playersList = document.getElementById('playersList');
    elements.errorMessage = document.getElementById('error-message');
    
    // النوافذ المنبثقة
    elements.createRoomPopup = document.getElementById('createRoomPopup');
    elements.joinRoomPopup = document.getElementById('joinRoomPopup');
    elements.roomNameInput = document.getElementById('roomNameInput');
    elements.roomCodeInput = document.getElementById('roomCodeInput');
    elements.joinRoomCodeInput = document.getElementById('joinRoomCodeInput');
    elements.confirmCreateRoomBtn = document.getElementById('confirmCreateRoomBtn');
    elements.confirmJoinRoomBtn = document.getElementById('confirmJoinRoomBtn');
    elements.closeCreateRoomBtn = document.getElementById('closeCreateRoomBtn');
    elements.closeJoinRoomBtn = document.getElementById('closeJoinRoomBtn');
    elements.createRoomError = document.getElementById('createRoomError');
    elements.joinRoomError = document.getElementById('joinRoomError');
    
    // حالة الاتصال
    elements.connectionStatus = document.getElementById('connectionStatus');
}

// 🎧 إضافة مستمعي الأحداث
function attachEventListeners() {
    elements.createRoomBtn.addEventListener('click', handleCreateRoom);
    elements.joinRoomBtn.addEventListener('click', handleJoinRoom);
    elements.confirmCreateRoomBtn.addEventListener('click', handleConfirmCreateRoom);
    elements.confirmJoinRoomBtn.addEventListener('click', handleConfirmJoinRoom);
    elements.closeCreateRoomBtn.addEventListener('click', () => closePopup('createRoomPopup'));
    elements.closeJoinRoomBtn.addEventListener('click', () => closePopup('joinRoomPopup'));
    
    // إدخال البيانات
    elements.playerNameInput.addEventListener('input', validatePlayerName);
    elements.roomNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConfirmCreateRoom();
    });
    elements.roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConfirmCreateRoom();
    });
    elements.joinRoomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConfirmJoinRoom();
    });
}

// 🔌 مستمعي Socket.io
function initializeSocketListeners() {
    // حالة الاتصال
    socket.on('connect', () => {
        console.log('✅ متصل بالخادم:', socket.id);
        updateConnectionStatus('connected');
        showSuccess('تم الاتصال بالخادم بنجاح! 🚀');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ انقطع الاتصال');
        updateConnectionStatus('disconnected');
        showError('انقطع الاتصال بالخادم');
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ خطأ في الاتصال:', error);
        showError('تعذر الاتصال بالخادم. جاري إعادة المحاولة...');
    });

    socket.on('connection-status', (data) => {
        console.log('📡 حالة الاتصال:', data);
    });
    
    // أحداث الغرفة
    socket.on('room-created', (data) => {
        console.log('✅ تم إنشاء الغرفة:', data);
        showSuccess(data.message);
        closePopup('createRoomPopup');
    });
    
    socket.on('create-error', (message) => {
        console.error('❌ خطأ في الإنشاء:', message);
        showCreateRoomError(message);
    });
    
    socket.on('join-success', (roomData) => {
        console.log('✅ تم الانضمام:', roomData);
        handleJoinSuccess(roomData);
    });
    
    socket.on('join-error', (message) => {
        console.error('❌ خطأ في الانضمام:', message);
        showJoinRoomError(message);
    });
    
    socket.on('room-updated', (roomData) => {
        console.log('🔄 تحديث الغرفة:', roomData);
        state.currentRoom = roomData;
        updateRoomDisplay();
    });
    
    socket.on('player-joined', (data) => {
        console.log('👋 لاعب جديد:', data);
        showSuccess(`${data.playerName} انضم إلى الغرفة!`);
    });
    
    socket.on('player-left', (data) => {
        console.log('👋 لاعب غادر:', data);
        showSuccess(`${data.playerName} غادر الغرفة`);
    });
    
    // الأدوار والإشعارات
    socket.on('roles-assigned', (roomData) => {
        console.log('🎭 تم توزيع الأدوار:', roomData);
        state.currentRoom = roomData;
        updateRoomDisplay();
        showSuccess('تم توزيع الأدوار بنجاح! 🎭');
    });
    
    socket.on('roles-error', (message) => {
        console.error('❌ خطأ في توزيع الأدوار:', message);
        showError(message);
    });
    
    socket.on('chef-assigned', (roomData) => {
        console.log('👑 تم تعيين القائد:', roomData);
        state.currentRoom = roomData;
        updateRoomDisplay();
    });
    
    socket.on('notification', (data) => {
        console.log('💡 إشعار:', data);
        if (data.type === 'success') {
            showSuccess(data.message);
        } else {
            showInfo(data.message);
        }
    });
    
    socket.on('game-started', (roomData) => {
        console.log('🎮 بدأت اللعبة:', roomData);
        state.currentRoom = roomData;
        showSuccess('بدأت اللعبة! استعدوا... 🎮');
        updateRoomDisplay();
    });
}

// 🧪 اختبار الاتصال بالخادم
function testServerConnection() {
    console.log('🧪 اختبار الاتصال بالخادم...');
    fetch('https://dark-village-server.onrender.com/test')
        .then(response => response.json())
        .then(data => {
            console.log('✅ اختبار الاتصال ناجح:', data);
        })
        .catch(error => {
            console.error('❌ فشل اختبار الاتصال:', error);
        });
}

// 🏠 إنشاء غرفة
function handleCreateRoom() {
    console.log('🎮 إنشاء غرفة جديدة...');
    
    if (!validateInputs()) return;
    openPopup('createRoomPopup');
}

function handleConfirmCreateRoom() {
    const roomName = elements.roomNameInput.value.trim();
    const roomCode = elements.roomCodeInput.value.trim();
    
    if (!roomName) {
        showCreateRoomError('يجب إدخال اسم الغرفة');
        return;
    }
    
    if (!roomCode) {
        showCreateRoomError('يجب إدخال رقم الغرفة');
        return;
    }
    
    if (!/^\d{3}$/.test(roomCode)) {
        showCreateRoomError('رقم الغرفة يجب أن يكون 3 أرقام فقط');
        return;
    }
    
    const playerName = elements.playerNameInput.value.trim();
    
    // إرسال طلب إنشاء الغرفة
    socket.emit('create-room', {
        roomCode: roomCode,
        roomName: roomName,
        playerName: playerName
    });
}

// 🔗 الانضمام إلى غرفة
function handleJoinRoom() {
    console.log('🔗 انضمام إلى غرفة...');
    
    if (!validateInputs()) return;
    openPopup('joinRoomPopup');
}

function handleConfirmJoinRoom() {
    const roomCode = elements.joinRoomCodeInput.value.trim();
    
    if (!roomCode) {
        showJoinRoomError('يجب إدخال رقم الغرفة');
        return;
    }
    
    if (!/^\d{3}$/.test(roomCode)) {
        showJoinRoomError('رقم الغرفة يجب أن يكون 3 أرقام');
        return;
    }
    
    const playerName = elements.playerNameInput.value.trim();
    
    // إرسال طلب الانضمام
    socket.emit('join-room', {
        roomCode: roomCode,
        playerName: playerName,
        isGameMaster: false
    });
}

// ✅ معالجة نجاح الانضمام
function handleJoinSuccess(roomData) {
    state.currentRoom = roomData;
    state.isInRoom = true;
    
    // تحديث اللاعب الحالي
    const currentPlayer = roomData.players.find(p => p.socketId === socket.id);
    if (currentPlayer) {
        state.currentPlayer = { ...state.currentPlayer, ...currentPlayer };
    }
    
    updateRoomDisplay();
    showRoomInfo();
    
    showSuccess('تم الانضمام للغرفة بنجاح! 🎉');
}

// 🎯 تحديث الواجهة
function updateRoomDisplay() {
    elements.roomNameDisplay.textContent = state.currentRoom.name;
    elements.roomCodeDisplay.textContent = state.currentRoom.code;
    
    // تحديث دور اللاعب الحالي
    const currentPlayer = state.currentRoom.players.find(p => p.socketId === socket.id);
    if (currentPlayer && currentPlayer.role) {
        const role = currentPlayer.role;
        elements.playerRoleDisplay.innerHTML = `
            <span style="background: ${role.color}; color: ${role.color === '#FFFFFF' || role.color === '#FFD700' ? '#000' : '#FFF'}; padding: 5px 10px; border-radius: 15px; font-weight: bold;">
                ${role.emoji} ${role.name}
            </span>
        `;
    } else {
        elements.playerRoleDisplay.textContent = 'في انتظار التوزيع...';
    }
    
    updatePlayersList();
    
    // إظهار أزرار الإدارة للمشرف
    if (currentPlayer && currentPlayer.isGameMaster) {
        showRoleManagement();
    }
}

function updatePlayersList() {
    elements.playersList.innerHTML = '';
    
    if (!state.currentRoom.players || state.currentRoom.players.length === 0) {
        elements.playersList.innerHTML = '<li>لا يوجد لاعبين في الغرفة</li>';
        return;
    }
    
    state.currentRoom.players.forEach(player => {
        const li = document.createElement('li');
        
        let playerText = player.name;
        if (player.isGameMaster) playerText += ' 👑';
        if (player.socketId === socket.id) playerText += ' (أنت)';
        
        // إضافة الدور إذا كان معيناً
        if (player.role) {
            const role = player.role;
            const textColor = role.color === '#FFFFFF' || role.color === '#FFD700' ? '#000' : '#FFF';
            playerText += ` - <span style="background: ${role.color}; color: ${textColor}; padding: 2px 8px; border-radius: 10px; font-size: 0.9em;">${role.emoji} ${role.name}</span>`;
        }
        
        li.innerHTML = playerText;
        elements.playersList.appendChild(li);
    });
}

function showRoleManagement() {
    // إضافة أزرار الإدارة إذا لم تكن موجودة
    if (!document.getElementById('roleManagement')) {
        const managementHTML = `
            <div id="roleManagement" style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <h4>🎭 إدارة الأدوار</h4>
                <button onclick="assignRoles()" class="btn btn-primary" style="width: 100%; margin: 5px 0;">
                    🔄 توزيع الأدوار
                </button>
                <button onclick="startGame()" class="btn" style="width: 100%; background: #27ae60; color: white; margin: 5px 0;">
                    🎮 بدء اللعبة
                </button>
                <button onclick="leaveRoom()" class="btn" style="width: 100%; background: #e74c3c; color: white; margin: 5px 0;">
                    🚪 مغادرة الغرفة
                </button>
            </div>
        `;
        elements.roomInfo.insertAdjacentHTML('beforeend', managementHTML);
    }
}

// 🎭 وظائف الإدارة
function assignRoles() {
    console.log('🎯 توزيع الأدوار...');
    socket.emit('assign-roles', {
        roomCode: state.currentRoom.code
    });
}

function startGame() {
    console.log('🎮 بدء اللعبة...');
    socket.emit('start-game', state.currentRoom.code);
}

function leaveRoom() {
    console.log('🚪 مغادرة الغرفة...');
    
    socket.emit('leave-room', {
        roomCode: state.currentRoom.code,
        playerName: state.currentPlayer.name
    });
    
    // إعادة التعيين
    state.currentRoom = { code: '', name: '', players: [] };
    state.isInRoom = false;
    updateRoomDisplay();
    showSuccess('تم مغادرة الغرفة');
}

// 🪟 إدارة النوافذ
function openPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'flex';
        // تفريغ الحقول
        if (popupId === 'createRoomPopup') {
            elements.roomNameInput.value = '';
            elements.roomCodeInput.value = '';
            elements.createRoomError.style.display = 'none';
        } else if (popupId === 'joinRoomPopup') {
            elements.joinRoomCodeInput.value = '';
            elements.joinRoomError.style.display = 'none';
        }
    }
}

function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) popup.style.display = 'none';
}

function showRoomInfo() {
    elements.roomInfo.style.display = 'block';
    elements.roomInfo.scrollIntoView({ behavior: 'smooth' });
}

function updateConnectionStatus(status) {
    if (elements.connectionStatus) {
        elements.connectionStatus.textContent = status === 'connected' ? '🟢 متصل' : '🔴 غير متصل';
        elements.connectionStatus.className = `connection-status ${status}`;
    }
}

// 📝 التحقق من الصحة
function validateInputs() {
    const playerName = elements.playerNameInput.value.trim();
    
    if (!playerName) {
        showError('يجب إدخال اسم اللاعب');
        return false;
    }
    
    if (playerName.length < 2) {
        showError('اسم اللاعب يجب أن يكون على الأقل حرفين');
        return false;
    }
    
    hideError();
    return true;
}

function validatePlayerName() {
    const playerName = elements.playerNameInput.value.trim();
    if (playerName.length > 0 && playerName.length < 2) {
        showError('اسم اللاعب قصير جداً');
    } else {
        hideError();
    }
}

// 💬 الرسائل
function showError(message) {
    console.error('❌ خطأ:', message);
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
    }
    setTimeout(hideError, 5000);
}

function hideError() {
    if (elements.errorMessage) {
        elements.errorMessage.style.display = 'none';
    }
}

function showSuccess(message) {
    console.log('✅ نجاح:', message);
    // يمكن استبدال هذا بنظام إشعارات أفضل
    alert('✅ ' + message);
}

function showInfo(message) {
    console.log('💡 معلومات:', message);
    alert('💡 ' + message);
}

function showCreateRoomError(message) {
    if (elements.createRoomError) {
        elements.createRoomError.textContent = message;
        elements.createRoomError.style.display = 'block';
    }
}

function showJoinRoomError(message) {
    if (elements.joinRoomError) {
        elements.joinRoomError.textContent = message;
        elements.joinRoomError.style.display = 'block';
    }
}

// 🚀 تشغيل التطبيق
document.addEventListener('DOMContentLoaded', initializeApp);
console.log('🎯 تم تحميل script.js - جاهز لـ GitHub Pages!');

