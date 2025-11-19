const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// إعدادات Socket.io للعمل مع GitHub Pages
const io = socketIo(server, {
  cors: {
    origin: ["https://kadi1929.github.io", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// تخزين البيانات
const rooms = new Map();
const players = new Map();

// 🔍 صفحة الاختبار
app.get('/test', (req, res) => {
  res.json({ 
    status: '✅ الخادم شغال على Render',
    message: 'جاهز للاتصال',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    players: players.size
  });
});

// 🏠 الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 📊 معلومات الخادم
app.get('/info', (req, res) => {
  res.json({
    server: 'Dark Village Server - Render',
    version: '2.0.0',
    uptime: process.uptime(),
    status: 'active'
  });
});

// 🔌 أحداث Socket.io
io.on('connection', (socket) => {
  console.log('🔗 لاعب متصل:', socket.id);
  
  // إرسال تأكيد الاتصال
  socket.emit('connection-status', { 
    status: 'connected', 
    message: 'مرحباً في القرية المظلمة!',
    socketId: socket.id
  });

  // 🏠 إنشاء غرفة جديدة
  socket.on('create-room', (data) => {
    console.log('🎮 طلب إنشاء غرفة:', data);
    
    try {
      const { roomCode, roomName, playerName } = data;
      
      // التحقق من البيانات
      if (!roomCode || !roomName || !playerName) {
        socket.emit('create-error', '❌ جميع الحقول مطلوبة');
        return;
      }

      // التحقق من وجود الغرفة
      if (rooms.has(roomCode)) {
        socket.emit('create-error', '❌ رقم الغرفة موجود مسبقاً');
        return;
      }

      // إنشاء غرفة جديدة
      const room = {
        name: roomName,
        code: roomCode,
        players: [],
        maxPlayers: 10,
        gameState: 'waiting',
        createdAt: new Date(),
        createdBy: playerName
      };

      rooms.set(roomCode, room);
      
      // إرسال نجاح الإنشاء
      socket.emit('room-created', { 
        roomCode: roomCode,
        roomName: roomName,
        message: '🎉 تم إنشاء الغرفة بنجاح!'
      });

      console.log(`✅ تم إنشاء غرفة: ${roomName} (${roomCode})`);
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء الغرفة:', error);
      socket.emit('create-error', 'حدث خطأ غير متوقع');
    }
  });

  // 🔗 الانضمام إلى غرفة
  socket.on('join-room', (data) => {
    console.log('🔗 طلب انضمام:', data);
    
    try {
      const { roomCode, playerName, isGameMaster } = data;
      
      if (!roomCode || !playerName) {
        socket.emit('join-error', '❌ رقم الغرفة واسم اللاعب مطلوبان');
        return;
      }

      // البحث عن الغرفة
      const room = rooms.get(roomCode);
      if (!room) {
        socket.emit('join-error', '❌ الغرفة غير موجودة');
        return;
      }

      // التحقق من عدد اللاعبين
      if (room.players.length >= room.maxPlayers) {
        socket.emit('join-error', '❌ الغرفة ممتلئة');
        return;
      }

      // التحقق من عدم تكرار الاسم
      const existingPlayer = room.players.find(p => p.name === playerName);
      if (existingPlayer) {
        socket.emit('join-error', '❌ اسم اللاعب موجود مسبقاً');
        return;
      }

      // إنشاء لاعب جديد
      const player = {
        id: socket.id,
        name: playerName,
        isGameMaster: isGameMaster || false,
        role: null,
        isAlive: true,
        socketId: socket.id,
        joinedAt: new Date()
      };

      // إضافة اللاعب للغرفة
      room.players.push(player);
      players.set(socket.id, { roomCode, player });

      // انضمام Socket للغرفة
      socket.join(roomCode);
      
      // إرسال تحديث للجميع
      io.to(roomCode).emit('room-updated', room);
      io.to(roomCode).emit('player-joined', { 
        playerName, 
        playersCount: room.players.length 
      });

      // إرسال نجاح الاتصال للاعب الجديد
      socket.emit('join-success', room);

      console.log(`✅ ${playerName} انضم إلى غرفة ${roomCode}`);

    } catch (error) {
      console.error('❌ خطأ في الانضمام:', error);
      socket.emit('join-error', 'حدث خطأ في الانضمام');
    }
  });

  // 🎭 توزيع الأدوار
  socket.on('assign-roles', (data) => {
    console.log('🎭 توزيع الأدوار:', data);
    
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode);
      
      if (!room) {
        socket.emit('roles-error', '❌ الغرفة غير موجودة');
        return;
      }

      // تعريف الأدوار
      const availableRoles = [
        { id: 'werewolf_alpha', name: 'الذئب ألفا', emoji: '🖤', color: '#000000' },
        { id: 'seer', name: 'العرافة', emoji: '🔮', color: '#FFFFFF' },
        { id: 'witch', name: 'الساحرة', emoji: '🧪', color: '#8A2BE2' },
        { id: 'guardian', name: 'الضامن', emoji: '💙', color: '#1E90FF' },
        { id: 'hunter', name: 'الصياد', emoji: '💚', color: '#32CD32' },
        { id: 'chef', name: 'القائد', emoji: '👑', color: '#FFD700' },
        { id: 'villager', name: 'قروي', emoji: '👨‍🌾', color: '#FFFFFF' }
      ];

      // توزيع عشوائي للأدوار
      const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
      const shuffledRoles = [...availableRoles].sort(() => Math.random() - 0.5);

      shuffledPlayers.forEach((player, index) => {
        if (index < shuffledRoles.length) {
          player.role = shuffledRoles[index];
        }
      });

      room.rolesAssigned = true;
      
      // إرسال التحديث للجميع
      io.to(roomCode).emit('roles-assigned', room);
      io.to(roomCode).emit('notification', {
        type: 'success',
        message: '🎭 تم توزيع الأدوار بنجاح!'
      });

      console.log(`✅ تم توزيع الأدوار في غرفة ${roomCode}`);

    } catch (error) {
      console.error('❌ خطأ في توزيع الأدوار:', error);
      socket.emit('roles-error', 'حدث خطأ في توزيع الأدوار');
    }
  });

  // 👑 تعيين القائد
  socket.on('assign-chef', (data) => {
    const { roomCode, playerId } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('chef-error', '❌ الغرفة غير موجودة');
      return;
    }

    try {
      // إلغاء القائد السابق
      room.players.forEach(player => {
        if (player.role && player.role.id === 'chef') {
          player.role = { id: 'villager', name: 'قروي', emoji: '👨‍🌾', color: '#FFFFFF' };
        }
      });

      // تعيين القائد الجديد
      const newChef = room.players.find(p => p.id === playerId);
      if (newChef) {
        newChef.role = { id: 'chef', name: 'القائد', emoji: '👑', color: '#FFD700' };
      }

      // إرسال التحديث للجميع
      io.to(roomCode).emit('chef-assigned', room);
      io.to(roomCode).emit('notification', {
        type: 'info',
        message: `👑 تم تعيين ${newChef.name} كقائد جديد`
      });

    } catch (error) {
      console.error('❌ خطأ في تعيين القائد:', error);
      socket.emit('chef-error', 'حدث خطأ في تعيين القائد');
    }
  });

  // 🎮 بدء اللعبة
  socket.on('start-game', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.gameState = 'playing';
    io.to(roomCode).emit('game-started', room);
    io.to(roomCode).emit('notification', {
      type: 'success',
      message: '🎮 بدأت اللعبة! استعدوا...'
    });
  });

  // 📢 إرسال رسالة
  socket.on('send-message', (data) => {
    const { roomCode, playerName, message } = data;
    io.to(roomCode).emit('new-message', {
      playerName,
      message,
      timestamp: new Date()
    });
  });

  // 🚪 مغادرة الغرفة
  socket.on('leave-room', (data) => {
    const { roomCode, playerName } = data;
    const room = rooms.get(roomCode);
    
    if (room) {
      room.players = room.players.filter(p => p.name !== playerName);
      players.delete(socket.id);
      
      io.to(roomCode).emit('player-left', { 
        playerName, 
        playersCount: room.players.length 
      });
      io.to(roomCode).emit('room-updated', room);
      
      // إذا لم يعد هناك لاعبين، احذف الغرفة
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`🗑️ تم حذف الغرفة ${roomCode} (لا يوجد لاعبين)`);
      }
    }

    socket.leave(roomCode);
    console.log(`👋 ${playerName} غادر الغرفة ${roomCode}`);
  });

  // ❌ فصل الاتصال
  socket.on('disconnect', () => {
    console.log('❌ لاعب مفصول:', socket.id);
    
    const playerData = players.get(socket.id);
    if (playerData) {
      const { roomCode, player } = playerData;
      const room = rooms.get(roomCode);
      
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        players.delete(socket.id);
        
        io.to(roomCode).emit('player-left', { 
          playerName: player.name, 
          playersCount: room.players.length 
        });
        io.to(roomCode).emit('room-updated', room);
        
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        }
      }
    }
  });
});

// 🚀 تشغيل الخادم
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ==================================');
  console.log('🎯 خادم القرية المظلمة شغال!');
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔗 https://kadi1929.github.io/dark-village`);
  console.log('📖 جاهز للاتصال من GitHub Pages');
  console.log('🚀 ==================================');
});
