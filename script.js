// =============================================
// 🎯 القرية المظلمة - نظام الأدوار المكتمل
// =============================================

// -------------------------
// 🎯 المتغيرات العامة
// -------------------------

/**
 * حالة التطبيق الرئيسية
 */
const state = {
    currentPlayer: {
        name: '',
        id: '',
        isGameMaster: false,
        role: ''
    },
    currentRoom: {
        id: '',
        name: '',
        code: '',
        players: [],
        maxPlayers: 10
    },
    isInRoom: false,
    roleSystem: {
        rolesAssigned: false,
        currentChef: null,
        werewolfAlpha: null,
        cursedPlayers: []
    }
};

/**
 * 🎭 تعريف جميع الأدوار مع الألوان والرموز
 */
const ROLES = {
    VILLAGER: {
        id: 'villager',
        name: 'قروي',
        team: 'VILLAGE',
        color: '#FFFFFF',
        emoji: '👨‍🌾',
        description: 'قروي عادي يعتمد على الذكاء والاستنتاج'
    },
    SEER: {
        id: 'seer', 
        name: 'العرافة',
        team: 'VILLAGE',
        color: '#FFFFFF',
        emoji: '🔮',
        description: 'تكشف دور لاعب واحد كل ليلة'
    },
    WITCH: {
        id: 'witch',
        name: 'الساحرة', 
        team: 'VILLAGE',
        color: '#8A2BE2',
        emoji: '🧪',
        description: 'تمتلك قدرات سحرية خاصة'
    },
    GUARDIAN: {
        id: 'guardian',
        name: 'الضامن',
        team: 'VILLAGE', 
        color: '#1E90FF',
        emoji: '💙',
        description: 'يحمي لاعباً من الهجوم الليلي'
    },
    HUNTER: {
        id: 'hunter',
        name: 'الصياد',
        team: 'VILLAGE',
        color: '#32CD32', 
        emoji: '💚',
        description: 'يقتل لاعباً عند موته'
    },
    CHEF: {
        id: 'chef',
        name: 'شاف القرية',
        team: 'VILLAGE',
        color: '#FFD700',
        emoji: '👑',
        description: 'قائد القرية - يتميز بالتاج الأصفر'
    },
    WEREWOLF_ALPHA: {
        id: 'werewolf_alpha',
        name: 'الذئب ألفا',
        team: 'WEREWOLVES',
        color: '#000000',
        emoji: '🖤',
        description: 'قائد الذئاب - يختار المستذئب'
    },
    WEREWOLF: {
        id: 'werewolf', 
        name: 'ذئب',
        team: 'WEREWOLVES',
        color: '#000000',
        emoji: '🖤',
        description: 'ينفذ هجمات الليل مع الفريق'
    },
    WEREWOLF_CURSED: {
        id: 'werewolf_cursed',
        name: 'مستذئب',
        team: 'WEREWOLVES', 
        color: '#808080',
        emoji: '🐺',
        description: 'يتحول لاحقاً باختيار الذئب ألفا'
    }
};

/**
 * عناصر DOM الرئيسية
 */
const elements = {};

// -------------------------
// 🎯 وظائف التهيئة
// -------------------------

/**
 * ✅ تهيئة التطبيق عند تحميل الصفحة
 */
function initializeApp() {
    console.log('🚀 تهيئة التطبيق...');
    
    try {
        initializeElements();
        attachEventListeners();
        resetState();
        loadSavedData();
        
        console.log('✅ التطبيق جاهز للاستخدام');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
        showError('حدث خطأ في تحميل التطبيق. يرجى تحديث الصفحة.');
    }
}

/**
 * ✅ تجهيز عناصر الصفحة
 */
function initializeElements() {
    console.log('🔗 ربط عناصر DOM...');
    
    // عناصر الإدخال
    elements.playerNameInput = document.getElementById('playerName');
    
    // الأزرار الرئيسية
    elements.createRoomBtn = document.getElementById('createRoomBtn');
    elements.joinRoomBtn = document.getElementById('joinRoomBtn');
    elements.storyBtn = document.getElementById('storyBtn');
    
    // عناصر الغرفة
    elements.roomInfo = document.getElementById('roomInfo');
    elements.roomNameDisplay = document.getElementById('roomNameDisplay');
    elements.roomCodeDisplay = document.getElementById('roomCodeDisplay');
    elements.playerRoleDisplay = document.getElementById('playerRoleDisplay');
    elements.playersList = document.getElementById('playersList');
    elements.roleManagement = document.getElementById('roleManagement');
    
    // النوافذ المنبثقة
    elements.storyPopup = document.getElementById('storyPopup');
    elements.closeStoryBtn = document.getElementById('closeStoryBtn');
    elements.understandBtn = document.getElementById('understandBtn');
    
    // نوافذ الغرف
    elements.createRoomPopup = document.getElementById('createRoomPopup');
    elements.joinRoomPopup = document.getElementById('joinRoomPopup');
    elements.roomNameInput = document.getElementById('roomNameInput');
    elements.roomCodeInput = document.getElementById('roomCodeInput');
    elements.joinRoomCodeInput = document.getElementById('joinRoomCodeInput');
    elements.closeCreateRoomBtn = document.getElementById('closeCreateRoomBtn');
    elements.closeJoinRoomBtn = document.getElementById('closeJoinRoomBtn');
    elements.confirmCreateRoomBtn = document.getElementById('confirmCreateRoomBtn');
    elements.confirmJoinRoomBtn = document.getElementById('confirmJoinRoomBtn');
    elements.createRoomError = document.getElementById('createRoomError');
    elements.joinRoomError = document.getElementById('joinRoomError');
    
    // نوافذ نظام الأدوار
    elements.manualRolePopup = document.getElementById('manualRolePopup');
    elements.chefAssignmentPopup = document.getElementById('chefAssignmentPopup');
    elements.closeManualRoleBtn = document.getElementById('closeManualRoleBtn');
    elements.closeChefBtn = document.getElementById('closeChefBtn');
    elements.confirmManualRoles = document.getElementById('confirmManualRoles');
    elements.confirmChefAssignment = document.getElementById('confirmChefAssignment');
    elements.manualRolePlayersList = document.getElementById('manualRolePlayersList');
    elements.chefPlayerSelect = document.getElementById('chefPlayerSelect');
    elements.manualRoleError = document.getElementById('manualRoleError');
    elements.chefAssignmentError = document.getElementById('chefAssignmentError');
    
    // أزرار إدارة الأدوار
    elements.autoAssignRoles = document.getElementById('autoAssignRoles');
    elements.manualAssignRoles = document.getElementById('manualAssignRoles');
    elements.assignChef = document.getElementById('assignChef');
    elements.roleAssignmentResults = document.getElementById('roleAssignmentResults');
    
    // رسائل النظام
    elements.errorMessage = document.getElementById('error-message');
    
    console.log('✅ تم ربط جميع العناصر');
}

/**
 * ✅ إضافة المستمعين للأحداث
 */
function attachEventListeners() {
    console.log('🎧 إضافة مستمعين الأحداث...');
    
    // أزرار الحركة الرئيسية
    elements.createRoomBtn.addEventListener('click', handleCreateRoom);
    elements.joinRoomBtn.addEventListener('click', handleJoinRoom);
    elements.storyBtn.addEventListener('click', showGameStory);
    
    // النوافذ المنبثقة
    elements.closeStoryBtn.addEventListener('click', closePopup);
    elements.understandBtn.addEventListener('click', closePopup);
    
    // نوافذ الغرف
    elements.closeCreateRoomBtn.addEventListener('click', closeCreateRoomPopup);
    elements.closeJoinRoomBtn.addEventListener('click', closeJoinRoomPopup);
    elements.confirmCreateRoomBtn.addEventListener('click', handleConfirmCreateRoom);
    elements.confirmJoinRoomBtn.addEventListener('click', handleConfirmJoinRoom);
    
    // نوافذ نظام الأدوار
    elements.closeManualRoleBtn.addEventListener('click', closeManualRolePopup);
    elements.closeChefBtn.addEventListener('click', closeChefAssignmentPopup);
    elements.confirmManualRoles.addEventListener('click', handleConfirmManualRoles);
    elements.confirmChefAssignment.addEventListener('click', handleConfirmChefAssignment);
    
    // أزرار إدارة الأدوار
    elements.autoAssignRoles.addEventListener('click', handleAutoAssignRoles);
    elements.manualAssignRoles.addEventListener('click', handleManualAssignRoles);
    elements.assignChef.addEventListener('click', handleAssignChef);
    
    // إغلاق النوافذ بالضغط خارجها
    elements.storyPopup.addEventListener('click', function(event) {
        if (event.target === elements.storyPopup) closePopup();
    });
    
    elements.createRoomPopup.addEventListener('click', function(event) {
        if (event.target === elements.createRoomPopup) closeCreateRoomPopup();
    });
    
    elements.joinRoomPopup.addEventListener('click', function(event) {
        if (event.target === elements.joinRoomPopup) closeJoinRoomPopup();
    });
    
    elements.manualRolePopup.addEventListener('click', function(event) {
        if (event.target === elements.manualRolePopup) closeManualRolePopup();
    });
    
    elements.chefAssignmentPopup.addEventListener('click', function(event) {
        if (event.target === elements.chefAssignmentPopup) closeChefAssignmentPopup();
    });
    
    // إغلاق النوافذ بالزر Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePopup();
            closeCreateRoomPopup();
            closeJoinRoomPopup();
            closeManualRolePopup();
            closeChefAssignmentPopup();
        }
    });
    
    // إدخال البيانات بالزر Enter
    elements.roomNameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') handleConfirmCreateRoom();
    });
    
    elements.roomCodeInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') handleConfirmCreateRoom();
    });
    
    elements.joinRoomCodeInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') handleConfirmJoinRoom();
    });
    
    // التحقق من صحة الإدخال أثناء الكتابة
    elements.playerNameInput.addEventListener('input', validatePlayerName);
    
    console.log('✅ تم إضافة جميع المستمعين');
}

// -------------------------
// 🎯 وظائف إدارة الغرف
// -------------------------

/**
 * ✅ معالجة إنشاء غرفة جديدة
 */
function handleCreateRoom() {
    console.log('🎮 محاولة إنشاء غرفة جديدة...');
    
    try {
        if (!validateInputs()) return;
        openCreateRoomPopup();
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الغرفة:', error);
        showError('حدث خطأ غير متوقع أثناء إنشاء الغرفة');
    }
}

/**
 * ✅ فتح نافذة إنشاء غرفة
 */
function openCreateRoomPopup() {
    console.log('🏠 فتح نافذة إنشاء الغرفة...');
    
    elements.createRoomPopup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    elements.roomNameInput.value = '';
    elements.roomCodeInput.value = '';
    elements.createRoomError.style.display = 'none';
    
    setTimeout(() => elements.roomNameInput.focus(), 100);
}

/**
 * ✅ إغلاق نافذة إنشاء غرفة
 */
function closeCreateRoomPopup() {
    console.log('❌ إغلاق نافذة إنشاء الغرفة...');
    elements.createRoomPopup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * ✅ معالجة تأكيد إنشاء غرفة
 */
function handleConfirmCreateRoom() {
    console.log('🎮 تأكيد إنشاء غرفة جديدة...');
    
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
    
    if (!/^\d+$/.test(roomCode)) {
        showCreateRoomError('رقم الغرفة يجب أن يحتوي على أرقام فقط');
        return;
    }
    
    if (roomCode.length < 3) {
        showCreateRoomError('رقم الغرفة يجب أن يكون على الأقل 3 أرقام');
        return;
    }
    
    closeCreateRoomPopup();
    createNewRoom(roomName, roomCode);
}

/**
 * ✅ إنشاء غرفة جديدة
 */
function createNewRoom(roomName, roomCode) {
    console.log(`🏠 إنشاء غرفة: ${roomName} (${roomCode})`);
    
    state.currentPlayer.name = elements.playerNameInput.value.trim();
    state.currentPlayer.id = generatePlayerId();
    state.currentPlayer.isGameMaster = true;
    
    state.currentRoom.name = roomName;
    state.currentRoom.code = roomCode;
    state.currentRoom.id = generateRoomId();
    state.currentRoom.players = [{
        id: state.currentPlayer.id,
        name: state.currentPlayer.name,
        isGameMaster: true,
        role: null,
        isAlive: true
    }];
    
    state.isInRoom = true;
    
    saveToLocalStorage();
    updateRoomDisplay();
    showRoomInfo();
    initializeRoleSystem();
    
    showSuccess(`تم إنشاء الغرفة "${roomName}" بنجاح!`);
    console.log('✅ تم إنشاء الغرفة:', state.currentRoom);
}

/**
 * ✅ معالجة الانضمام إلى غرفة
 */
function handleJoinRoom() {
    console.log('🔗 محاولة الانضمام إلى غرفة...');
    
    try {
        if (!validateInputs()) return;
        openJoinRoomPopup();
        
    } catch (error) {
        console.error('❌ خطأ في الانضمام للغرفة:', error);
        showError('حدث خطأ غير متوقع أثناء الانضمام للغرفة');
    }
}

/**
 * ✅ فتح نافذة الانضمام إلى غرفة
 */
function openJoinRoomPopup() {
    console.log('🔗 فتح نافذة الانضمام للغرفة...');
    
    elements.joinRoomPopup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    elements.joinRoomCodeInput.value = '';
    elements.joinRoomError.style.display = 'none';
    
    setTimeout(() => elements.joinRoomCodeInput.focus(), 100);
}

/**
 * ✅ إغلاق نافذة الانضمام إلى غرفة
 */
function closeJoinRoomPopup() {
    console.log('❌ إغلاق نافذة الانضمام للغرفة...');
    elements.joinRoomPopup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * ✅ معالجة تأكيد الانضمام إلى غرفة
 */
function handleConfirmJoinRoom() {
    console.log('🔗 تأكيد الانضمام إلى غرفة...');
    
    const roomCode = elements.joinRoomCodeInput.value.trim();
    
    if (!roomCode) {
        showJoinRoomError('يجب إدخال رقم الغرفة');
        return;
    }
    
    if (!/^\d+$/.test(roomCode)) {
        showJoinRoomError('رقم الغرفة يجب أن يحتوي على أرقام فقط');
        return;
    }
    
    closeJoinRoomPopup();
    joinExistingRoom(roomCode);
}

/**
 * ✅ الانضمام إلى غرفة موجودة
 */
function joinExistingRoom(roomCode) {
    console.log(`🔗 الانضمام إلى غرفة: ${roomCode}`);
    
    state.currentPlayer.name = elements.playerNameInput.value.trim();
    state.currentPlayer.id = generatePlayerId();
    state.currentPlayer.isGameMaster = false;
    
    state.currentRoom.name = `غرفة ${roomCode}`;
    state.currentRoom.code = roomCode;
    state.currentRoom.id = roomCode;
    
    // إضافة لاعب جديد للغرفة (محاكاة)
    state.currentRoom.players.push({
        id: state.currentPlayer.id,
        name: state.currentPlayer.name,
        isGameMaster: false,
        role: null,
        isAlive: true
    });
    
    state.isInRoom = true;
    
    saveToLocalStorage();
    updateRoomDisplay();
    showRoomInfo();
    initializeRoleSystem();
    
    showSuccess(`تم الانضمام للغرفة ${roomCode} بنجاح!`);
    console.log('✅ تم الانضمام للغرفة:', state.currentRoom);
}

// -------------------------
// 🎯 نظام الأدوار - الوظائف الرئيسية
// -------------------------

/**
 * 🎯 تهيئة نظام الأدوار
 */
function initializeRoleSystem() {
    console.log('🎭 تهيئة نظام الأدوار...');
    
    // إظهار واجهة إدارة الأدوار للمشرف فقط
    if (state.currentPlayer.isGameMaster) {
        elements.roleManagement.style.display = 'block';
    }
}

/**
 * 🎯 معالجة التوزيع التلقائي للأدوار
 */
function handleAutoAssignRoles() {
    console.log('🔄 بدء التوزيع التلقائي للأدوار...');
    
    if (!validateRoleAssignment()) return;
    
    const players = state.currentRoom.players.filter(p => p.isAlive);
    const rolesToAssign = calculateOptimalRoles(players.length);
    
    assignRolesToPlayers(players, rolesToAssign);
    showRoleAssignmentResults('تم التوزيع التلقائي للأدوار بنجاح!');
    sendNotificationToAll('تم توزيع الأدوار تلقائياً');
}

/**
 * 🎯 معالجة التوزيع اليدوي للأدوار
 */
function handleManualAssignRoles() {
    console.log('🎯 فتح واجهة التوزيع اليدوي...');
    
    if (!validateRoleAssignment()) return;
    
    openManualRoleAssignmentPopup();
}

/**
 * 🎯 معالجة تعيين القائد (Chef)
 */
function handleAssignChef() {
    console.log('👑 فتح نافذة تعيين القائد...');
    openChefAssignmentPopup();
}

/**
 * 🎯 التحقق من إمكانية توزيع الأدوار
 */
function validateRoleAssignment() {
    if (state.currentRoom.players.length < 5) {
        showError('يجب أن يكون هناك على الأقل 5 لاعبين لتوزيع الأدوار');
        return false;
    }
    
    if (!state.currentPlayer.isGameMaster) {
        showError('فقط المشرف يمكنه توزيع الأدوار');
        return false;
    }
    
    return true;
}

/**
 * 🎯 حساب التوزيع الأمثل للأدوار بناءً على عدد اللاعبين
 */
function calculateOptimalRoles(playerCount) {
    console.log(`🧮 حساب الأدوار لـ ${playerCount} لاعبين...`);
    
    const roles = [];
    
    // إضافة الأدوار الأساسية
    roles.push(ROLES.WEREWOLF_ALPHA);
    roles.push(ROLES.SEER);
    roles.push(ROLES.WITCH);
    roles.push(ROLES.GUARDIAN);
    
    // إضافة ذئاب إضافية بناءً على عدد اللاعبين
    const additionalWolves = Math.max(1, Math.floor(playerCount / 4));
    for (let i = 0; i < additionalWolves; i++) {
        roles.push(ROLES.WEREWOLF);
    }
    
    // إضافة الصياد للاعبين 7 أو أكثر
    if (playerCount >= 7) {
        roles.push(ROLES.HUNTER);
    }
    
    // الباقي قرويين
    const remainingPlayers = playerCount - roles.length;
    for (let i = 0; i < remainingPlayers; i++) {
        roles.push(ROLES.VILLAGER);
    }
    
    console.log('📊 الأدوار المحسوبة:', roles.map(r => r.name));
    return roles;
}

/**
 * 🎯 توزيع الأدوار على اللاعبين
 */
function assignRolesToPlayers(players, roles) {
    console.log('🎭 توزيع الأدوار على اللاعبين...');
    
    // خلط اللاعبين والأدوار عشوائياً
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    
    // توزيع الأدوار
    shuffledPlayers.forEach((player, index) => {
        if (index < shuffledRoles.length) {
            player.role = shuffledRoles[index];
            
            // تعيين الذئب ألفا تلقائياً
            if (shuffledRoles[index].id === 'werewolf_alpha') {
                state.roleSystem.werewolfAlpha = player.id;
            }
        }
    });
    
    state.roleSystem.rolesAssigned = true;
    updateRoomDisplay();
    saveToLocalStorage();
    
    console.log('✅ تم توزيع الأدوار:', shuffledPlayers.map(p => `${p.name}: ${p.role?.name}`));
}

/**
 * 🎯 فتح نافذة التوزيع اليدوي
 */
function openManualRoleAssignmentPopup() {
    console.log('🎯 فتح نافذة التوزيع اليدوي...');
    
    elements.manualRolePopup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    elements.manualRoleError.style.display = 'none';
    
    // تعبئة قائمة اللاعبين
    populateManualRoleAssignment();
}

/**
 * 🎯 تعبئة قائمة اللاعبين للتوزيع اليدوي
 */
function populateManualRoleAssignment() {
    const players = state.currentRoom.players.filter(p => p.isAlive);
    let html = '';
    
    players.forEach(player => {
        const currentRole = player.role ? player.role.name : 'لم يتم التعيين';
        html += `
            <div class="player-role-item">
                <div class="player-role-info">
                    <div class="player-role-name">${player.name} ${player.isGameMaster ? '👑' : ''}</div>
                    <div class="player-role-assigned">الدور الحالي: ${currentRole}</div>
                </div>
                <select class="role-select" data-player-id="${player.id}">
                    <option value="">-- اختر دور --</option>
                    ${Object.values(ROLES).map(role => 
                        `<option value="${role.id}" ${player.role?.id === role.id ? 'selected' : ''}>
                            ${role.emoji} ${role.name}
                        </option>`
                    ).join('')}
                </select>
            </div>
        `;
    });
    
    elements.manualRolePlayersList.innerHTML = html;
}

/**
 * 🎯 إغلاق نافذة التوزيع اليدوي
 */
function closeManualRolePopup() {
    console.log('❌ إغلاق نافذة التوزيع اليدوي...');
    elements.manualRolePopup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * 🎯 معالجة تأكيد التوزيع اليدوي
 */
function handleConfirmManualRoles() {
    console.log('✅ تأكيد التوزيع اليدوي...');
    
    const roleSelects = elements.manualRolePlayersList.querySelectorAll('.role-select');
    const assignedRoles = {};
    let hasEmptySelection = false;
    
    // جمع الأدوار المختارة
    roleSelects.forEach(select => {
        const playerId = select.getAttribute('data-player-id');
        const roleId = select.value;
        
        if (!roleId) {
            hasEmptySelection = true;
        }
        
        assignedRoles[playerId] = roleId;
    });
    
    if (hasEmptySelection) {
        elements.manualRoleError.textContent = 'يجب تعيين دور لكل لاعب';
        elements.manualRoleError.style.display = 'block';
        return;
    }
    
    // تطبيق الأدوار المختارة
    Object.entries(assignedRoles).forEach(([playerId, roleId]) => {
        const player = state.currentRoom.players.find(p => p.id === playerId);
        if (player) {
            player.role = ROLES[Object.keys(ROLES).find(key => ROLES[key].id === roleId)];
            
            // تحديث الذئب ألفا
            if (roleId === 'werewolf_alpha') {
                state.roleSystem.werewolfAlpha = playerId;
            }
        }
    });
    
    state.roleSystem.rolesAssigned = true;
    closeManualRolePopup();
    updateRoomDisplay();
    saveToLocalStorage();
    showRoleAssignmentResults('تم التوزيع اليدوي للأدوار بنجاح!');
    sendNotificationToAll('تم توزيع الأدوار يدوياً');
}

/**
 * 🎯 فتح نافذة تعيين القائد
 */
function openChefAssignmentPopup() {
    console.log('👑 فتح نافذة تعيين القائد...');
    
    elements.chefAssignmentPopup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    elements.chefAssignmentError.style.display = 'none';
    
    // تعبئة قائمة اللاعبين
    populateChefAssignment();
}

/**
 * 🎯 تعبئة قائمة اللاعبين لتعيين القائد
 */
function populateChefAssignment() {
    const players = state.currentRoom.players.filter(p => p.isAlive && !p.isGameMaster);
    let html = '<option value="">-- اختر لاعب --</option>';
    
    players.forEach(player => {
        const currentRole = player.role ? ` (${player.role.emoji} ${player.role.name})` : '';
        html += `<option value="${player.id}">${player.name}${currentRole}</option>`;
    });
    
    elements.chefPlayerSelect.innerHTML = html;
    
    // تحديد القائد الحالي إذا موجود
    if (state.roleSystem.currentChef) {
        elements.chefPlayerSelect.value = state.roleSystem.currentChef;
    }
}

/**
 * 🎯 إغلاق نافذة تعيين القائد
 */
function closeChefAssignmentPopup() {
    console.log('❌ إغلاق نافذة تعيين القائد...');
    elements.chefAssignmentPopup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * 🎯 معالجة تأكيد تعيين القائد
 */
function handleConfirmChefAssignment() {
    console.log('✅ تأكيد تعيين القائد...');
    
    const selectedPlayerId = elements.chefPlayerSelect.value;
    
    if (!selectedPlayerId) {
        elements.chefAssignmentError.textContent = 'يجب اختيار لاعب لتعيينه قائداً';
        elements.chefAssignmentError.style.display = 'block';
        return;
    }
    
    const selectedPlayer = state.currentRoom.players.find(p => p.id === selectedPlayerId);
    
    if (!selectedPlayer) {
        elements.chefAssignmentError.textContent = 'اللاعب المحدد غير موجود';
        elements.chefAssignmentError.style.display = 'block';
        return;
    }
    
    // إزالة دور القائد السابق إذا موجود
    if (state.roleSystem.currentChef) {
        const previousChef = state.currentRoom.players.find(p => p.id === state.roleSystem.currentChef);
        if (previousChef && previousChef.role?.id === 'chef') {
            // استعادة الدور الأصلي أو تعيينه كقروي
            previousChef.role = ROLES.VILLAGER;
        }
    }
    
    // تعيين القائد الجديد
    selectedPlayer.role = ROLES.CHEF;
    state.roleSystem.currentChef = selectedPlayerId;
    
    closeChefAssignmentPopup();
    updateRoomDisplay();
    saveToLocalStorage();
    showRoleAssignmentResults(`تم تعيين ${selectedPlayer.name} كقائد للقرية!`);
    sendNotificationToAll(`تم تعيين ${selectedPlayer.name} كقائد جديد للقرية`);
}

/**
 * 🎯 عرض نتائج توزيع الأدوار
 */
function showRoleAssignmentResults(message) {
    elements.roleAssignmentResults.textContent = message;
    elements.roleAssignmentResults.className = 'role-results show';
    
    setTimeout(() => {
        elements.roleAssignmentResults.className = 'role-results';
    }, 5000);
}

/**
 * 🎯 إرسال إشعار لجميع اللاعبين
 */
function sendNotificationToAll(message) {
    console.log(`📢 إشعار للجميع: ${message}`);
    // في التطبيق الحقيقي، هنا سيتم إرسال الإشعارات عبر WebSockets
    showSuccess(message);
}

// -------------------------
// 🎯 وظائف النافذة المنبثقة
// -------------------------

/**
 * ✅ عرض نافذة قصة اللعبة
 */
function showGameStory() {
    console.log('📖 عرض قصة اللعبة...');
    
    try {
        elements.storyPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ خطأ في عرض القصة:', error);
    }
}

/**
 * ✅ إغلاق النافذة المنبثقة
 */
function closePopup() {
    console.log('❌ إغلاق النافذة المنبثقة...');
    
    try {
        elements.storyPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
        
    } catch (error) {
        console.error('❌ خطأ في إغلاق النافذة:', error);
    }
}

// -------------------------
// 🎯 وظائف تحديث الواجهة
// -------------------------

/**
 * ✅ عرض معلومات الغرفة
 */
function showRoomInfo() {
    console.log('🏠 عرض معلومات الغرفة...');
    elements.roomInfo.style.display = 'block';
    elements.roomInfo.scrollIntoView({ behavior: 'smooth' });
}

/**
 * ✅ تحديث عرض الغرفة
 */
function updateRoomDisplay() {
    console.log('🔄 تحديث عرض الغرفة...');
    
    elements.roomNameDisplay.textContent = state.currentRoom.name;
    elements.roomCodeDisplay.textContent = state.currentRoom.code;
    
    // تحديث دور اللاعب الحالي
    const currentPlayer = state.currentRoom.players.find(p => p.id === state.currentPlayer.id);
    if (currentPlayer && currentPlayer.role) {
        const role = currentPlayer.role;
        elements.playerRoleDisplay.innerHTML = `
            <span class="role-badge role-${role.id}" style="background: ${role.color}; color: ${role.color === '#FFFFFF' || role.color === '#FFD700' ? '#000' : '#FFF'}">
                ${role.emoji} ${role.name}
            </span>
        `;
    } else {
        elements.playerRoleDisplay.textContent = 'في انتظار التوزيع...';
    }
    
    updatePlayersList();
}

/**
 * ✅ تحديث قائمة اللاعبين
 */
function updatePlayersList() {
    console.log('👥 تحديث قائمة اللاعبين...');
    
    elements.playersList.innerHTML = '';
    
    state.currentRoom.players.forEach(player => {
        const li = document.createElement('li');
        
        let playerText = player.name;
        if (player.isGameMaster) playerText += ' 👑 (مشرف)';
        if (player.id === state.currentPlayer.id) playerText += ' (أنت)';
        
        // إضافة الدور إذا كان معيناً
        if (player.role) {
            const role = player.role;
            const textColor = role.color === '#FFFFFF' || role.color === '#FFD700' ? '#000' : '#FFF';
            playerText += ` - <span class="role-badge role-${role.id}" style="background: ${role.color}; color: ${textColor}">${role.emoji} ${role.name}</span>`;
        }
        
        li.innerHTML = playerText;
        elements.playersList.appendChild(li);
    });
}

// -------------------------
// 🎯 وظائف التحقق والتحقق
// -------------------------

/**
 * ✅ التحقق من صحة البيانات
 */
function validateInputs() {
    console.log('🔍 التحقق من صحة البيانات...');
    
    const playerName = elements.playerNameInput.value.trim();
    
    if (!playerName) {
        showError('يجب إدخال اسم اللاعب');
        return false;
    }
    
    if (playerName.length < 2) {
        showError('اسم اللاعب يجب أن يكون على الأقل حرفين');
        return false;
    }
    
    if (playerName.length > 20) {
        showError('اسم اللاعب يجب أن لا يتجاوز 20 حرف');
        return false;
    }
    
    hideError();
    return true;
}

/**
 * ✅ التحقق من اسم اللاعب أثناء الكتابة
 */
function validatePlayerName() {
    const playerName = elements.playerNameInput.value.trim();
    if (playerName.length > 0 && playerName.length < 2) {
        showError('اسم اللاعب قصير جداً');
    } else {
        hideError();
    }
}

// -------------------------
// 🎯 وظائف المساعدة
// -------------------------

/**
 * ✅ عرض رسالة خطأ
 */
function showError(message) {
    console.error('❌ خطأ:', message);
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
    
    setTimeout(() => hideError(), 5000);
}

/**
 * ✅ إخفاء رسالة الخطأ
 */
function hideError() {
    elements.errorMessage.style.display = 'none';
}

/**
 * ✅ عرض رسالة نجاح
 */
function showSuccess(message) {
    console.log('✅ نجاح:', message);
    
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    document.querySelector('.buttons-section').appendChild(successElement);
    
    setTimeout(() => successElement.remove(), 3000);
}

/**
 * ✅ عرض خطأ في نافذة إنشاء الغرفة
 */
function showCreateRoomError(message) {
    elements.createRoomError.textContent = message;
    elements.createRoomError.style.display = 'block';
    elements.createRoomPopup.style.animation = 'shake 0.5s ease';
    setTimeout(() => elements.createRoomPopup.style.animation = '', 500);
}

/**
 * ✅ عرض خطأ في نافذة الانضمام للغرفة
 */
function showJoinRoomError(message) {
    elements.joinRoomError.textContent = message;
    elements.joinRoomError.style.display = 'block';
    elements.joinRoomPopup.style.animation = 'shake 0.5s ease';
    setTimeout(() => elements.joinRoomPopup.style.animation = '', 500);
}

/**
 * ✅ توليد معرف فريد للاعب
 */
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

/**
 * ✅ توليد معرف فريد للغرفة
 */
function generateRoomId() {
    return 'room_' + Math.random().toString(36).substr(2, 9);
}

/**
 * ✅ إعادة تعيين الحالة
 */
function resetState() {
    state.currentPlayer = { name: '', id: '', isGameMaster: false, role: '' };
    state.currentRoom = { id: '', name: '', code: '', players: [], maxPlayers: 10 };
    state.isInRoom = false;
    state.roleSystem = { rolesAssigned: false, currentChef: null, werewolfAlpha: null, cursedPlayers: [] };
    console.log('🔄 تم إعادة تعيين الحالة');
}

// -------------------------
// 🎯 وظائف التخزين المحلي
// -------------------------

/**
 * ✅ حفظ البيانات في التخزين المحلي
 */
function saveToLocalStorage() {
    try {
        const saveData = {
            player: state.currentPlayer,
            room: state.currentRoom,
            roleSystem: state.roleSystem,
            timestamp: Date.now()
        };
        
        localStorage.setItem('darkVillage_save', JSON.stringify(saveData));
        console.log('💾 تم حفظ البيانات محلياً');
        
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
    }
}

/**
 * ✅ تحميل البيانات من التخزين المحلي
 */
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('darkVillage_save');
        
        if (savedData) {
            const data = JSON.parse(savedData);
            const oneHour = 60 * 60 * 1000;
            
            if (Date.now() - data.timestamp < oneHour) {
                state.currentPlayer = data.player;
                state.currentRoom = data.room;
                state.roleSystem = data.roleSystem || { rolesAssigned: false, currentChef: null, werewolfAlpha: null, cursedPlayers: [] };
                state.isInRoom = true;
                
                elements.playerNameInput.value = state.currentPlayer.name;
                updateRoomDisplay();
                showRoomInfo();
                initializeRoleSystem();
                
                console.log('📂 تم تحميل البيانات المحفوظة');
            } else {
                localStorage.removeItem('darkVillage_save');
                console.log('🗑️ تم مسح البيانات القديمة');
            }
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        localStorage.removeItem('darkVillage_save');
    }
}

// -------------------------
// 🎯 التهيئة النهائية
// -------------------------

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeApp);

// منع إغلاق الصفحة إذا كان هناك بيانات غير محفوظة
window.addEventListener('beforeunload', function(event) {
    if (state.isInRoom) {
        event.preventDefault();
        event.returnValue = 'هل تريد حقاً مغادرة الصفحة؟ قد تفقد تقدمك في اللعبة.';
        return event.returnValue;
    }
});

console.log('🎯 تم تحميل script.js بنجاح - نظام الأدوار مكتمل!');