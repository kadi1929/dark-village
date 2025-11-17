const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// تخزين البيانات في الذاكرة (في production استخدم قاعدة بيانات)
const rooms = new Map();
const players = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// مسار للتحقق من أن الخادم شغال
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'الخادم شغال 🚀' });
});

// الحصول على معلومات الغرفة
app.get('/room/:code', (req, res) => {
  const room = rooms.get(req.params.code);
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
  }
});

// أحداث Socket.io
io.on('connection', (socket) => {
  console.log('🔥 لاعب متصل:', socket.id);

  // انضمام لاعب إلى غرفة
  socket.on('join-room', async (data) => {
    const { roomCode, playerName, isGameMaster } = data;
    
    try {
      // البحث عن الغرفة أو إنشاؤها
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, {
          name: `غرفة ${roomCode}`,
          code: roomCode,
          players: [],
          maxPlayers: 10,
          gameState: 'waiting', // waiting, playing, finished
          rolesAssigned: false,
          createdAt: new Date()
        });
      }

      const room = rooms.get(roomCode);
      
      // التحقق من عدم تكرار الاسم
      const existingPlayer = room.players.find(p => p.name === playerName);
      if (existingPlayer) {
        socket.emit('join-error', 'اسم اللاعب موجود مسبقاً في هذه الغرفة');
        return;
      }

      // التحقق من عدد اللاعبين
      if (room.players.length >= room.maxPlayers) {
        socket.emit('join-error', 'الغرفة ممتلئة');
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
      
      // إرسال تحديث للجميع في الغرفة
      io.to(roomCode).emit('room-updated', room);
      io.to(roomCode).emit('player-joined', { 
        playerName, 
        playersCount: room.players.length 
      });

      // إرسال نجاح الاتصال للاعب الجديد
      socket.emit('join-success', room);

      console.log(`🎮 ${playerName} انضم إلى غرفة ${roomCode}`);

    } catch (error) {
      console.error('❌ خطأ في الانضمام للغرفة:', error);
      socket.emit('join-error', 'حدث خطأ في الانضمام للغرفة');
    }
  });

  // إنشاء غرفة جديدة
  socket.on('create-room', (data) => {
    const { roomCode, roomName, playerName } = data;
    
    try {
      if (rooms.has(roomCode)) {
        socket.emit('create-error', 'رقم الغرفة موجود مسبقاً');
        return;
      }

      // إنشاء غرفة جديدة
      const room = {
        name: roomName,
        code: roomCode,
        players: [],
        maxPlayers: 10,
        gameState: 'waiting',
        rolesAssigned: false,
        createdAt: new Date()
      };

      rooms.set(roomCode, room);
      socket.emit('room-created', { roomCode, roomName });

      console.log(`🏠 تم إنشاء غرفة ${roomCode}: ${roomName}`);

    } catch (error) {
      console.error('❌ خطأ في إنشاء الغرفة:', error);
      socket.emit('create-error', 'حدث خطأ في إنشاء الغرفة');
    }
  });

  // توزيع الأدوار
  socket.on('assign-roles', (data) => {
    const { roomCode, roles } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('roles-error', 'الغرفة غير موجودة');
      return;
    }

    try {
      // تطبيق توزيع الأدوار
      const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
      
      shuffledPlayers.forEach((player, index) => {
        if (index < roles.length) {
          player.role = roles[index];
        }
      });

      room.rolesAssigned = true;
      
      // إرسال التحديث للجميع
      io.to(roomCode).emit('roles-assigned', room);
      io.to(roomCode).emit('notification', {
        type: 'success',
        message: 'تم توزيع الأدوار بنجاح!'
      });

      console.log(`🎭 تم توزيع الأدوار في غرفة ${roomCode}`);

    } catch (error) {
      console.error('❌ خطأ في توزيع الأدوار:', error);
      socket.emit('roles-error', 'حدث خطأ في توزيع الأدوار');
    }
  });

  // تعيين القائد
  socket.on('assign-chef', (data) => {
    const { roomCode, playerId } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('chef-error', 'الغرفة غير موجودة');
      return;
    }

    try {
      // إلغاء القائد السابق
      room.players.forEach(player => {
        if (player.role && player.role.id === 'chef') {
          player.role = null;
        }
      });

      // تعيين القائد الجديد
      const newChef = room.players.find(p => p.id === playerId);
      if (newChef) {
        newChef.role = {
          id: 'chef',
          name: 'شاف القرية',
          team: 'VILLAGE',
          color: '#FFD700',
          emoji: '👑',
          description: 'قائد القرية'
        };
      }

      // إرسال التحديث للجميع
      io.to(roomCode).emit('chef-assigned', room);
      io.to(roomCode).emit('notification', {
        type: 'info',
        message: `تم تعيين ${newChef.name} كقائد جديد`
      });

    } catch (error) {
      console.error('❌ خطأ في تعيين القائد:', error);
      socket.emit('chef-error', 'حدث خطأ في تعيين القائد');
    }
  });

  // إرسال رسالة دردشة
  socket.on('send-message', (data) => {
    const { roomCode, playerName, message, type = 'chat' } = data;
    
    io.to(roomCode).emit('new-message', { 
      playerName, 
      message, 
      type,
      timestamp: new Date() 
    });
  });

  // بدء اللعبة
  socket.on('start-game', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.gameState = 'playing';
    io.to(roomCode).emit('game-started', room);
    io.to(roomCode).emit('notification', {
      type: 'success',
      message: 'بدأت اللعبة!'
    });
  });

  // مغادرة الغرفة
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

  // فصل اللاعب
  socket.on('disconnect', () => {
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
    
    console.log('❌ لاعب مفصول:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎯 الخادم شغال على المنفذ ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔗 رابط الواجهة: http://localhost:${PORT}/client`);
});
