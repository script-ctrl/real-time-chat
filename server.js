require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// ============ DATABASE ============
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/chat_app'
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        is_online BOOLEAN DEFAULT false,
        last_seen TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        owner_id UUID REFERENCES users(id),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS server_members (
        server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (server_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS direct_chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user1_id UUID REFERENCES users(id),
        user2_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user1_id, user2_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_type VARCHAR(10) NOT NULL,
        chat_id UUID NOT NULL,
        sender_id UUID REFERENCES users(id),
        reply_to_id UUID REFERENCES messages(id),
        content TEXT NOT NULL,
        edited BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, emoji)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_type, chat_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}

// ============ APP ============
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Статика
if (fs.existsSync('public')) {
  app.use(express.static('public'));
}

// ============ AUTH MIDDLEWARE ============
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.userId = jwt.verify(token, process.env.SECRET_KEY).userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ WEBSOCKET ============
const connections = new Map();

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  if (!token) return ws.close();
  
  try {
    const { userId } = jwt.verify(token, process.env.SECRET_KEY);
    ws.userId = userId;
    
    if (!connections.has(userId)) connections.set(userId, new Set());
    connections.get(userId).add(ws);
    
    await pool.query('UPDATE users SET is_online = true WHERE id = $1', [userId]);
    broadcast({ type: 'user_status', userId, is_online: true });
    
    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        
        if (msg.type === 'message') {
          const result = await pool.query(
            `INSERT INTO messages (chat_type, chat_id, sender_id, content, reply_to_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
            [msg.chatType, msg.chatId, userId, msg.content, msg.replyToId || null]
          );
          
          const user = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [userId]);
          
          sendToChat(msg.chatType, msg.chatId, {
            type: 'new_message',
            message: {
              id: result.rows[0].id,
              chat_type: msg.chatType,
              chat_id: msg.chatId,
              sender_id: userId,
              sender_name: user.rows[0].username,
              sender_avatar: user.rows[0].avatar_url,
              content: msg.content,
              reply_to_id: msg.replyToId || null,
              created_at: result.rows[0].created_at,
              edited: false,
              reactions: []
            }
          });
        }
        
        if (msg.type === 'typing') {
          sendToChat(msg.chatType, msg.chatId, {
            type: 'typing', userId, chatType: msg.chatType, chatId: msg.chatId
          }, ws);
        }
        
        if (msg.type === 'reaction') {
          const exist = await pool.query(
            'SELECT id FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
            [msg.messageId, userId, msg.emoji]
          );
          
          if (exist.rows.length) {
            await pool.query('DELETE FROM message_reactions WHERE id = $1', [exist.rows[0].id]);
          } else {
            await pool.query('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1,$2,$3)',
              [msg.messageId, userId, msg.emoji]);
          }
          
          const reactions = await pool.query(`
            SELECT mr.emoji, mr.user_id, u.username
            FROM message_reactions mr JOIN users u ON mr.user_id = u.id
            WHERE mr.message_id = $1
          `, [msg.messageId]);
          
          sendToChat(msg.chatType, msg.chatId, {
            type: 'reaction_update',
            messageId: msg.messageId,
            reactions: reactions.rows
          });
        }
      } catch (e) { console.error('WS error:', e); }
    });
    
    ws.on('close', async () => {
      connections.get(userId)?.delete(ws);
      if (!connections.get(userId)?.size) {
        connections.delete(userId);
        await pool.query('UPDATE users SET is_online = false, last_seen = NOW() WHERE id = $1', [userId]);
        broadcast({ type: 'user_status', userId, is_online: false });
      }
    });
  } catch { ws.close(); }
});

async function sendToChat(type, id, message, excludeWs = null) {
  let members = [];
  if (type === 'direct') {
    const r = await pool.query('SELECT user1_id, user2_id FROM direct_chats WHERE id = $1', [id]);
    if (r.rows.length) members = [r.rows[0].user1_id, r.rows[0].user2_id];
  } else {
    const r = await pool.query('SELECT user_id FROM server_members WHERE server_id = $1', [id]);
    members = r.rows.map(m => m.user_id);
  }
  
  const data = JSON.stringify(message);
  members.forEach(uid => {
    connections.get(uid)?.forEach(c => {
      if (c !== excludeWs && c.readyState === WebSocket.OPEN) c.send(data);
    });
  });
}

function broadcast(message) {
  const data = JSON.stringify(message);
  connections.forEach(clients => clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(data);
  }));
}

// ============ API ============

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exist = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exist.rows.length) return res.status(400).json({ error: 'User exists' });
    
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email, avatar_url',
      [username, email, hash]
    );
    
    const user = r.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = r.rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/search', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, username, avatar_url, is_online FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 20',
      [`%${req.query.q}%`, req.userId]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/chats', auth, async (req, res) => {
  try {
    const direct = await pool.query(`
      SELECT dc.id,
        CASE WHEN dc.user1_id = $1 THEN u2.username ELSE u1.username END as chat_name,
        CASE WHEN dc.user1_id = $1 THEN u2.avatar_url ELSE u1.avatar_url END as chat_avatar,
        CASE WHEN dc.user1_id = $1 THEN u2.is_online ELSE u1.is_online END as is_online,
        CASE WHEN dc.user1_id = $1 THEN u2.id ELSE u1.id END as other_user_id,
        'direct' as chat_type,
        (SELECT content FROM messages WHERE chat_type='direct' AND chat_id=dc.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_type='direct' AND chat_id=dc.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM direct_chats dc
      JOIN users u1 ON dc.user1_id = u1.id
      JOIN users u2 ON dc.user2_id = u2.id
      WHERE dc.user1_id = $1 OR dc.user2_id = $1
    `, [req.userId]);
    
    const servers = await pool.query(`
      SELECT s.id, s.name as chat_name, s.avatar_url as chat_avatar,
        'server' as chat_type,
        (SELECT content FROM messages WHERE chat_type='server' AND chat_id=s.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_type='server' AND chat_id=s.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM servers s
      JOIN server_members sm ON s.id = sm.server_id
      WHERE sm.user_id = $1
    `, [req.userId]);
    
    res.json({ directChats: direct.rows, servers: servers.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chats/direct', auth, async (req, res) => {
  try {
    const exist = await pool.query(
      'SELECT id FROM direct_chats WHERE (user1_id=$1 AND user2_id=$2) OR (user1_id=$2 AND user2_id=$1)',
      [req.userId, req.body.userId]
    );
    if (exist.rows.length) return res.json({ chatId: exist.rows[0].id });
    
    const r = await pool.query('INSERT INTO direct_chats (user1_id, user2_id) VALUES ($1,$2) RETURNING id',
      [req.userId, req.body.userId]);
    res.json({ chatId: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/messages/:chatType/:chatId', auth, async (req, res) => {
  try {
    const { chatType, chatId } = req.params;
    const limit = req.query.limit || 50;
    
    const r = await pool.query(`
      SELECT m.id, m.content, m.edited, m.created_at, m.reply_to_id,
        u.id as sender_id, u.username as sender_name, u.avatar_url as sender_avatar
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE m.chat_type = $1 AND m.chat_id = $2
      ORDER BY m.created_at DESC LIMIT $3
    `, [chatType, chatId, limit]);
    
    const messages = await Promise.all(r.rows.reverse().map(async (msg) => {
      const react = await pool.query(`
        SELECT mr.emoji, mr.user_id, u.username
        FROM message_reactions mr JOIN users u ON mr.user_id = u.id
        WHERE mr.message_id = $1
      `, [msg.id]);
      return { ...msg, reactions: react.rows };
    }));
    
    res.json(messages);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/messages/:id', auth, async (req, res) => {
  try {
    const msg = await pool.query('SELECT * FROM messages WHERE id = $1 AND sender_id = $2', [req.params.id, req.userId]);
    if (!msg.rows.length) return res.status(403).json({ error: 'Not authorized' });
    
    await pool.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
    
    sendToChat(msg.rows[0].chat_type, msg.rows[0].chat_id, {
      type: 'message_deleted', messageId: req.params.id
    });
    
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ START ============
const PORT = process.env.PORT || 8000;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
});