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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// تخزين البيانات
const rooms = new Map();
const players = new Map();

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// اختبار الخادم
app.get('/test', (req, res) => {
  res.json({ 
    status: '✅ الخادم شغال',
    rooms: rooms.size,
    players: players.size
  });
});

// أحداث Socket.io
io.on('connection', (socket) => {
  console.log('🔗 لاعب متصل:', socket.id);

  // إنشاء غرفة
  socket.on('create-room', (data) => {
    console.log('🎮 طلب إنشاء غرفة:', data);
    
    const { roomCode, roomName, playerName } = data;
    
    if (!roomCode || !roomName || !playerName) {
      socket.emit('create-error', 'جميع الحقول مطلوبة');
      return;
    }

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
      createdAt: new Date()
    };

    rooms.set(roomCode, room);
    
    // إنشاء لاعب مشرف
    const gameMaster = {
      id: socket.id,
      name: playerName,
      isGameMaster: true,
      role: null,
      isAlive: true,
      socketId: socket.id
    };

    room.players.push(gameMaster);
    players.set(socket.id, { roomCode, player: gameMaster });

    // الانضمام للغرفة
    socket.join(roomCode);
    
    // إرسال الاستجابات
    socket.emit('room-created', {
      roomCode: roomCode,
      roomName: roomName,
      message: 'تم إنشاء الغرفة بنجاح!'
    });

    socket.emit('join-success', room);
    
    console.log(`✅ ${playerName} أنشأ غرفة ${roomCode}`);
  });

  // الانضمام إلى غرفة
  socket.on('join-room', (data) => {
    console.log('🔗 طلب انضمام:', data);
    
    const { roomCode, playerName, isGameMaster } = data;
    
    if (!roomCode || !playerName) {
      socket.emit('join-error', 'رقم الغرفة واسم اللاعب مطلوبان');
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('join-error', 'الغرفة غير موجودة');
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('join-error', 'الغرفة ممتلئة');
      return;
    }

    const existingPlayer = room.players.find(p => p.name === playerName);
    if (existingPlayer) {
      socket.emit('join-error', 'اسم اللاعب موجود مسبقاً');
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

    room.players.push(player);
    players.set(socket.id, { roomCode, player });

    socket.join(roomCode);
    
    // إرسال التحديثات
    io.to(roomCode).emit('room-updated', room);
    io.to(roomCode).emit('player-joined', { 
      playerName, 
      playersCount: room.players.length 
    });

    socket.emit('join-success', room);

    console.log(`✅ ${playerName} انضم إلى غرفة ${roomCode}`);
  });

  // توزيع الأدوار
  socket.on('assign-roles', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('roles-error', 'الغرفة غير موجودة');
      return;
    }

    // أدوار مبسطة للتجربة
    const availableRoles = [
      { id: 'werewolf_alpha', name: 'الذئب ألفا', emoji: '🖤' },
      { id: 'seer', name: 'العرافة', emoji: '🔮' },
      { id: 'witch', name: 'الساحرة', emoji: '🧪' },
      { id: 'guardian', name: 'الضامن', emoji: '💙' },
      { id: 'hunter', name: 'الصياد', emoji: '💚' },
      { id: 'villager', name: 'قروي', emoji: '👨‍🌾' },
      { id: 'villager', name: 'قروي', emoji: '👨‍🌾' }
    ];

    // توزيع عشوائي
    const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
    const shuffledRoles = [...availableRoles].sort(() => Math.random() - 0.5);

    shuffledPlayers.forEach((player, index) => {
      if (index < shuffledRoles.length) {
        player.role = shuffledRoles[index];
      }
    });

    room.rolesAssigned = true;
    
    io.to(roomCode).emit('roles-assigned', room);
    io.to(roomCode).emit('notification', {
      type: 'success',
      message: 'تم توزيع الأدوار بنجاح!'
    });

    console.log(`✅ تم توزيع الأدوار في غرفة ${roomCode}`);
  });

  // بدء اللعبة
  socket.on('start-game', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.gameState = 'playing';
      io.to(roomCode).emit('notification', {
        type: 'success',
        message: 'بدأت اللعبة!'
      });
      console.log(`🎮 بدأت اللعبة في غرفة ${roomCode}`);
    }
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
      
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`🗑️ تم حذف الغرفة ${roomCode}`);
      }
    }

    socket.leave(roomCode);
    console.log(`👋 ${playerName} غادر الغرفة ${roomCode}`);
  });

  // فصل الاتصال
  socket.on('disconnect', () => {
    console.log('❌ لاعب مفصول:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 خادم القرية المظلمة شغال على http://localhost:' + PORT);
});
server.listen(PORT, () => {
  console.log(`🎯 الخادم شغال على المنفذ ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔗 رابط الواجهة: http://localhost:${PORT}/client`);
});
