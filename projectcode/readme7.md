# Real-time Chat Backend

Scalable chat application backend with WebSocket connections, message persistence, user presence tracking, and room-based messaging.

## 🎯 Project Overview

This project demonstrates a comprehensive real-time chat backend built with Node.js and Socket.io, featuring scalable WebSocket connections, persistent message storage, user presence management, and room-based communication. Designed for high-performance real-time applications.

## 🛠 Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Message Queue**: Redis
- **Session Store**: Redis
- **File Upload**: Multer + AWS S3

## ✨ Key Features

### Real-time Messaging
- **Instant Messaging**: WebSocket-based real-time communication
- **Message Types**: Text, images, files, emojis, and reactions
- **Message Status**: Sent, delivered, read receipts
- **Typing Indicators**: Real-time typing status updates

### Room Management
- **Public Rooms**: Open chat rooms for general discussion
- **Private Rooms**: Invitation-only secured rooms
- **Direct Messages**: One-on-one private conversations
- **Room Administration**: Moderator controls and permissions

### User Features
- **User Presence**: Online/offline status tracking
- **User Profiles**: Customizable user information
- **Friend System**: Add/remove friends functionality
- **Block/Unblock**: User blocking capabilities

### Message Persistence
- **Message History**: Complete conversation storage
- **Message Search**: Full-text search across conversations
- **File Sharing**: Image and document sharing
- **Message Encryption**: End-to-end encryption support

## 🏗 Architecture

### System Design
```
Client ↔ Socket.io ↔ Express Server ↔ MongoDB
                  ↕
                Redis (Sessions & Pub/Sub)
```

### Core Components
- **Socket Manager**: WebSocket connection handling
- **Message Service**: Message processing and storage
- **Room Service**: Room management and permissions
- **User Service**: User management and presence
- **Authentication Middleware**: JWT token validation

## 🚀 Implementation Highlights

### Socket.io Server Setup
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

// Redis adapter for scaling across multiple servers
const pubClient = redis.createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return next(new Error('Authentication error'));
        }
        
        socket.userId = user._id.toString();
        socket.username = user.username;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});
```

### Real-time Message Handling
```javascript
io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected`);
    
    // Update user presence
    updateUserPresence(socket.userId, 'online');
    
    // Join user to their rooms
    socket.on('join-rooms', async () => {
        const userRooms = await getUserRooms(socket.userId);
        userRooms.forEach(room => {
            socket.join(room._id.toString());
        });
    });
    
    // Handle new message
    socket.on('send-message', async (data) => {
        try {
            const { roomId, content, type = 'text' } = data;
            
            // Validate user can send to this room
            const canSend = await validateUserCanSendMessage(socket.userId, roomId);
            if (!canSend) {
                return socket.emit('error', { message: 'Permission denied' });
            }
            
            // Create message
            const message = new Message({
                sender: socket.userId,
                room: roomId,
                content,
                type,
                timestamp: new Date()
            });
            
            await message.save();
            await message.populate('sender', 'username avatar');
            
            // Broadcast to room
            io.to(roomId).emit('new-message', {
                _id: message._id,
                sender: message.sender,
                content: message.content,
                type: message.type,
                timestamp: message.timestamp
            });
            
            // Update room last activity
            await Room.findByIdAndUpdate(roomId, {
                lastActivity: new Date(),
                lastMessage: message._id
            });
            
        } catch (error) {
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
    
    // Handle typing indicators
    socket.on('typing-start', (data) => {
        socket.to(data.roomId).emit('user-typing', {
            userId: socket.userId,
            username: socket.username
        });
    });
    
    socket.on('typing-stop', (data) => {
        socket.to(data.roomId).emit('user-stopped-typing', {
            userId: socket.userId
        });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User ${socket.username} disconnected`);
        updateUserPresence(socket.userId, 'offline');
    });
});
```

### Message Service
```javascript
class MessageService {
    static async getMessages(roomId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        
        return await Message.find({ room: roomId })
            .populate('sender', 'username avatar')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    }
    
    static async searchMessages(roomId, query, userId) {
        // Verify user has access to room
        const hasAccess = await this.verifyRoomAccess(roomId, userId);
        if (!hasAccess) {
            throw new Error('Access denied');
        }
        
        return await Message.find({
            room: roomId,
            $text: { $search: query }
        })
        .populate('sender', 'username avatar')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean();
    }
    
    static async markAsRead(roomId, userId) {
        await Message.updateMany(
            { 
                room: roomId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            { 
                $addToSet: { readBy: userId },
                $set: { readAt: new Date() }
            }
        );
    }
    
    static async deleteMessage(messageId, userId) {
        const message = await Message.findById(messageId);
        
        if (!message) {
            throw new Error('Message not found');
        }
        
        // Check if user owns the message or is room admin
        const canDelete = message.sender.toString() === userId ||
                         await this.isRoomAdmin(message.room, userId);
        
        if (!canDelete) {
            throw new Error('Permission denied');
        }
        
        await Message.findByIdAndUpdate(messageId, {
            content: '[Message deleted]',
            type: 'deleted',
            deletedAt: new Date(),
            deletedBy: userId
        });
        
        return message;
    }
}
```

## 📊 Database Models

### Message Model
```javascript
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'system', 'deleted'],
        default: 'text'
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    readBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
        createdAt: { type: Date, default: Date.now }
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    editedAt: Date,
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Text search index
messageSchema.index({ content: 'text' });
messageSchema.index({ room: 1, createdAt: -1 });
```

### Room Model
```javascript
const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    type: {
        type: String,
        enum: ['public', 'private', 'direct'],
        default: 'public'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { 
            type: String, 
            enum: ['member', 'moderator', 'admin'], 
            default: 'member' 
        },
        joinedAt: { type: Date, default: Date.now }
    }],
    settings: {
        maxMembers: { type: Number, default: 100 },
        allowFileSharing: { type: Boolean, default: true },
        moderationEnabled: { type: Boolean, default: false }
    },
    lastActivity: Date,
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true
});
```

## 📈 Advanced Features

### File Upload Handling
```javascript
const multer = require('multer');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { roomId } = req.body;
        
        // Verify user can upload to this room
        const canUpload = await validateUserCanSendMessage(req.userId, roomId);
        if (!canUpload) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        const fileKey = `chat-files/${Date.now()}-${req.file.originalname}`;
        
        const uploadParams = {
            Bucket: process.env.S3_BUCKET,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };
        
        const result = await s3.upload(uploadParams).promise();
        
        // Create message with file
        const message = new Message({
            sender: req.userId,
            room: roomId,
            content: req.file.originalname,
            type: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
            fileUrl: result.Location,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
        
        await message.save();
        await message.populate('sender', 'username avatar');
        
        // Broadcast to room
        io.to(roomId).emit('new-message', message);
        
        res.json({ message, fileUrl: result.Location });
        
    } catch (error) {
        res.status(500).json({ error: 'File upload failed' });
    }
});
```

### User Presence Management
```javascript
class PresenceService {
    static async updateUserPresence(userId, status) {
        await User.findByIdAndUpdate(userId, {
            status,
            lastSeen: new Date()
        });
        
        // Broadcast presence update to user's rooms
        const userRooms = await getUserRooms(userId);
        userRooms.forEach(room => {
            io.to(room._id.toString()).emit('user-presence-update', {
                userId,
                status,
                lastSeen: new Date()
            });
        });
    }
    
    static async getUsersInRoom(roomId) {
        const room = await Room.findById(roomId)
            .populate('members.user', 'username avatar status lastSeen');
        
        return room.members.map(member => ({
            ...member.user.toObject(),
            role: member.role,
            joinedAt: member.joinedAt
        }));
    }
}
```

## 🔒 Security Features

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const messageRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: 'Too many messages sent',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/messages', messageRateLimit);
```

### Input Validation & Sanitization
```javascript
const validator = require('validator');
const xss = require('xss');

function sanitizeMessage(content) {
    // Remove XSS attempts
    const cleaned = xss(content, {
        whiteList: {}, // No HTML allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    });
    
    // Validate length
    if (!validator.isLength(cleaned, { min: 1, max: 2000 })) {
        throw new Error('Message length invalid');
    }
    
    return cleaned.trim();
}
```

## 📚 Learning Outcomes

This project demonstrates:
- **Real-time Applications**: WebSocket implementation with Socket.io
- **Scalable Architecture**: Redis adapter for horizontal scaling
- **Message Persistence**: MongoDB for chat history storage
- **File Handling**: AWS S3 integration for media sharing
- **User Management**: Presence tracking and room permissions
- **Security**: Authentication, rate limiting, input validation
- **Performance**: Efficient message querying and caching
- **Event-Driven Architecture**: Socket-based communication patterns

## 🔗 Repository

**GitHub**: [Real-time Chat Backend](https://github.com/marxwistrom/chat-backend)

---

*Part of Marx Wiström's Backend Development Portfolio*
