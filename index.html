require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// HTML страница прямо в коде
const HTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chat</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial;background:#1a1a2e;color:#fff;height:100vh}
#auth{max-width:400px;margin:100px auto;padding:30px;background:#16213e;border-radius:10px}
#auth input{width:100%;padding:12px;margin:8px 0;background:#0f3460;border:none;color:#fff;border-radius:5px}
#auth button{width:100%;padding:12px;background:#e94560;color:#fff;border:none;border-radius:5px;cursor:pointer;margin-top:10px;font-size:16px}
#auth .switch{text-align:center;margin-top:15px;color:#e94560;cursor:pointer}
#app{display:none;height:100vh}
#sidebar{width:300px;background:#16213e;height:100vh;float:left;display:flex;flex-direction:column}
#chat-area{margin-left:300px;height:100vh;display:flex;flex-direction:column}
#search-box{padding:15px;border-bottom:1px solid #0f3460}
#search-box input{width:100%;padding:10px;background:#0f3460;border:none;color:#fff;border-radius:5px}
#search-results{padding:10px}
.search-user{padding:10px;cursor:pointer;border-radius:5px;margin:3px 0;display:flex;align-items:center}
.search-user:hover{background:#0f3460}
.online-dot{width:8px;height:8px;background:#4ecc5c;border-radius:50%;margin-left:auto}
.offline-dot{width:8px;height:8px;background:#666;border-radius:50%;margin-left:auto}
#chat-list{flex:1;overflow-y:auto;padding:10px}
.chat-item{padding:12px;cursor:pointer;border-radius:8px;margin:3px 0;display:flex;align-items:center}
.chat-item:hover,.chat-item.active{background:#0f3460}
.chat-item .info{flex:1}
.chat-item .name{font-weight:bold}
.chat-item .last-msg{font-size:12px;color:#888;margin-top:3px}
#chat-header{padding:15px 20px;background:#16213e;border-bottom:1px solid #0f3460;display:flex;align-items:center}
#messages{flex:1;overflow-y:auto;padding:20px}
.message{margin-bottom:15px;display:flex;align-items:flex-start}
.message.mine{flex-direction:row-reverse}
.message .bubble{max-width:60%;padding:10px 15px;border-radius:15px;background:#0f3460}
.message.mine .bubble{background:#e94560}
.message .sender{font-size:12px;color:#888;margin-bottom:3px}
.message .time{font-size:10px;color:#888;margin-top:5px}
.message .reply{font-size:11px;color:#888;border-left:2px solid #e94560;padding-left:8px;margin-bottom:5px}
.message .reactions{margin-top:5px;display:flex;gap:5px}
.message .reaction{background:#1a1a2e;padding:2px 6px;border-radius:10px;font-size:14px}
.typing{padding:5px 20px;color:#888;font-style:italic;font-size:13px}
#input-area{padding:15px 20px;background:#16213e;display:flex;gap:10px}
#input-area input{flex:1;padding:12px;background:#0f3460;border:none;color:#fff;border-radius:25px}
#input-area button{padding:12px 20px;background:#e94560;color:#fff;border:none;border-radius:25px;cursor:pointer}
#reply-bar{padding:5px 20px;background:#0f3460;display:flex;align-items:center;gap:10px;font-size:13px}
#reply-bar button{background:none;border:none;color:#e94560;cursor:pointer}
#user-info{padding:15px;border-top:1px solid #0f3460;display:flex;align-items:center}
.emoji-picker{display:flex;gap:5px;padding:5px}
.emoji-picker span{cursor:pointer;font-size:18px}
.context-menu{position:absolute;background:#16213e;border-radius:8px;padding:5px;z-index:1000}
.context-menu div{padding:8px 15px;cursor:pointer;border-radius:5px}
.context-menu div:hover{background:#0f3460}
</style>
</head>
<body>
<div id="auth">
<h2 id="auth-title">Вход</h2>
<input type="text" id="username" placeholder="Имя" style="display:none">
<input type="email" id="email" placeholder="Email">
<input type="password" id="password" placeholder="Пароль">
<button onclick="handleAuth()">Войти</button>
<div class="switch" onclick="toggleAuth()">Регистрация</div>
</div>
<div id="app">
<div id="sidebar">
<div id="search-box"><input type="text" placeholder="Поиск..." oninput="searchUsers(this.value)"></div>
<div id="search-results"></div>
<div id="chat-list"></div>
<div id="user-info"><span id="my-username"></span><button onclick="logout()" style="margin-left:auto;background:#e94560;color:#fff;border:none;padding:8px 15px;border-radius:5px;cursor:pointer">Выйти</button></div>
</div>
<div id="chat-area">
<div id="chat-header" style="display:none"><div id="chat-name"></div></div>
<div id="messages"></div>
<div class="typing" id="typing-indicator"></div>
<div id="reply-bar" style="display:none"><span id="reply-text"></span><button onclick="cancelReply()">✕</button></div>
<div id="input-area"><input type="text" id="message-input" placeholder="Сообщение..." onkeypress="if(event.key==='Enter')sendMessage()" oninput="handleTyping()"><button onclick="sendMessage()">➤</button></div>
</div>
</div>
<div class="context-menu" id="context-menu" style="display:none"></div>
<script>
let token=localStorage.getItem('token');
let user=JSON.parse(localStorage.getItem('user')||'null');
let ws=null,activeChat=null,chats=[],messages=[],replyTo=null,isLogin=true;

function toggleAuth(){isLogin=!isLogin;document.getElementById('auth-title').textContent=isLogin?'Вход':'Регистрация';document.getElementById('username').style.display=isLogin?'none':'block';document.querySelector('.switch').textContent=isLogin?'Регистрация':'Вход'}

async function handleAuth(){
const email=document.getElementById('email').value;
const password=document.getElementById('password').value;
const username=document.getElementById('username').value;
const url=isLogin?'/api/login':'/api/register';
const body=isLogin?{email,password}:{username,email,password};
const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const data=await res.json();
if(res.ok){token=data.token;user=data.user;localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify(user));document.getElementById('auth').style.display='none';document.getElementById('app').style.display='block';document.getElementById('my-username').textContent=user.username;initApp()}else{alert(data.error)}}

function logout(){localStorage.clear();location.reload()}

function connectWS(){
const p=location.protocol==='https:'?'wss:':'ws:';
ws=new WebSocket(p+'//'+location.host+'/ws/'+token);
ws.onmessage=(e)=>{const d=JSON.parse(e.data);
if(d.type==='new_message'){if(activeChat&&d.message.chat_type===activeChat.chat_type&&d.message.chat_id===activeChat.id){messages.push(d.message);renderMessages()}updateChatLastMessage(d.message)}
if(d.type==='user_status')updateUserStatus(d.userId,d.is_online);
if(d.type==='typing'&&activeChat&&d.chatType===activeChat.chat_type&&d.chatId===activeChat.id){document.getElementById('typing-indicator').textContent='Печатает...';setTimeout(()=>document.getElementById('typing-indicator').textContent='',3000)}
if(d.type==='message_deleted'){messages=messages.filter(m=>m.id!==d.messageId);renderMessages()}
if(d.type==='reaction_update'){const m=messages.find(m=>m.id===d.messageId);if(m){m.reactions=d.reactions;renderMessages()}}};
ws.onclose=()=>setTimeout(connectWS,3000)}

async function loadChats(){
const res=await fetch('/api/chats',{headers:{'Authorization':'Bearer '+token}});
const data=await res.json();
chats=[...data.directChats,...data.servers];
renderChatList()}

function renderChatList(){
document.getElementById('chat-list').innerHTML=chats.map(c=>'<div class="chat-item'+(activeChat&&activeChat.id===c.id?' active':'')+'" onclick="openChat(\''+c.id+'\',\''+c.chat_type+'\')"><div class="info"><div class="name">'+c.chat_name+'</div><div class="last-msg">'+(c.last_message||'')+'</div></div>'+(c.is_online?'<div class="online-dot"></div>':'<div class="offline-dot"></div>')+'</div>').join('')}

async function openChat(id,type){
activeChat=chats.find(c=>c.id===id&&c.chat_type===type);
document.getElementById('chat-header').style.display='flex';
document.getElementById('chat-name').textContent=activeChat.chat_name;
const res=await fetch('/api/messages/'+type+'/'+id,{headers:{'Authorization':'Bearer '+token}});
messages=await res.json();
renderChatList();renderMessages()}

function renderMessages(){
document.getElementById('messages').innerHTML=messages.map(m=>'<div class="message'+(m.sender_id===user.id?' mine':'')+'" oncontextmenu="showMenu(event,\''+m.id+'\','+(m.sender_id===user.id)+')"><div><div class="sender">'+m.sender_name+'</div>'+(m.reply_to_id?'<div class="reply">'+(messages.find(x=>x.id===m.reply_to_id)?.content||'...')+'</div>':'')+'<div class="bubble">'+m.content+'</div><div class="time">'+new Date(m.created_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})+'</div>'+(m.reactions?.length?'<div class="reactions">'+m.reactions.map(r=>'<span class="reaction">'+r.emoji+'</span>').join('')+'</div>':'')+'</div></div>').join('');
document.getElementById('messages').scrollTop=document.getElementById('messages').scrollHeight}

function sendMessage(){
const input=document.getElementById('message-input');
const c=input.value.trim();
if(!c||!activeChat||!ws)return;
ws.send(JSON.stringify({type:'message',chatType:activeChat.chat_type,chatId:activeChat.id,content:c,replyToId:replyTo?.id||null}));
input.value='';cancelReply()}

function handleTyping(){if(activeChat&&ws)ws.send(JSON.stringify({type:'typing',chatType:activeChat.chat_type,chatId:activeChat.id}))}

function cancelReply(){replyTo=null;document.getElementById('reply-bar').style.display='none'}

function showMenu(e,id,isMine){
e.preventDefault();
const menu=document.getElementById('context-menu');
menu.innerHTML='<div onclick="replyToMsg(\''+id+'\')">Ответить</div>'+(isMine?'<div onclick="deleteMsg(\''+id+'\')">Удалить</div>':'')+'<div class="emoji-picker"><span onclick="react(\''+id+'\',\'👍\')">👍</span><span onclick="react(\''+id+'\',\'❤️\')">❤️</span><span onclick="react(\''+id+'\',\'😄\')">😄</span></div>';
menu.style.display='block';menu.style.left=e.pageX+'px';menu.style.top=e.pageY+'px';
setTimeout(()=>menu.style.display='none',3000)}

function replyToMsg(id){replyTo=messages.find(m=>m.id===id);document.getElementById('reply-bar').style.display='flex';document.getElementById('reply-text').textContent=replyTo.content.substring(0,50);document.getElementById('context-menu').style.display='none'}

async function deleteMsg(id){if(!confirm('Удалить?'))return;await fetch('/api/messages/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+token}});document.getElementById('context-menu').style.display='none'}

function react(id,emoji){ws.send(JSON.stringify({type:'reaction',messageId:id,emoji,chatType:activeChat.chat_type,chatId:activeChat.id}));document.getElementById('context-menu').style.display='none'}

async function searchUsers(q){
if(q.length<2){document.getElementById('search-results').innerHTML='';return}
const res=await fetch('/api/users/search?q='+q,{headers:{'Authorization':'Bearer '+token}});
const users=await res.json();
document.getElementById('search-results').innerHTML=users.map(u=>'<div class="search-user" onclick="startChat(\''+u.id+'\')"><span>'+u.username+'</span>'+(u.is_online?'<div class="online-dot"></div>':'<div class="offline-dot"></div>')+'</div>').join('')}

async function startChat(userId){
const res=await fetch('/api/chats/direct',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({userId})});
const data=await res.json();
document.getElementById('search-results').innerHTML='';
document.querySelector('#search-box input').value='';
await loadChats();openChat(data.chatId,'direct')}

function updateChatLastMessage(msg){const c=chats.find(x=>x.id===msg.chat_id&&x.chat_type===msg.chat_type);if(c){c.last_message=msg.content;renderChatList()}}

function updateUserStatus(id,on){const c=chats.find(x=>x.other_user_id===id);if(c){c.is_online=on;renderChatList()}}

async function initApp(){connectWS();await loadChats()}

if(token&&user){document.getElementById('auth').style.display='none';document.getElementById('app').style.display='block';document.getElementById('my-username').textContent=user.username;initApp()}
document.addEventListener('click',()=>document.getElementById('context-menu').style.display='none');
</script>
</body>
</html>`;

// Database
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
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS message_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, emoji)
      );
    `);
    console.log('DB ready');
  } finally { client.release(); }
}

const auth = (req, res, next) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'No token' });
  try { req.userId = jwt.verify(t, process.env.SECRET_KEY || 'secret').userId; next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

const connections = new Map();

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, 'http://x');
  const t = url.searchParams.get('token');
  if (!t) return ws.close();
  try {
    const { userId } = jwt.verify(t, process.env.SECRET_KEY || 'secret');
    ws.userId = userId;
    if (!connections.has(userId)) connections.set(userId, new Set());
    connections.get(userId).add(ws);
    await pool.query('UPDATE users SET is_online = true WHERE id = $1', [userId]);
    broadcast({ type: 'user_status', userId, is_online: true });
    
    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'message') {
          const r = await pool.query(
            'INSERT INTO messages (chat_type, chat_id, sender_id, content, reply_to_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at',
            [msg.chatType, msg.chatId, userId, msg.content, msg.replyToId || null]
          );
          const u = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
          sendToChat(msg.chatType, msg.chatId, {
            type: 'new_message',
            message: { id: r.rows[0].id, chat_type: msg.chatType, chat_id: msg.chatId, sender_id: userId, sender_name: u.rows[0].username, content: msg.content, reply_to_id: msg.replyToId, created_at: r.rows[0].created_at, reactions: [] }
          });
        }
        if (msg.type === 'typing') sendToChat(msg.chatType, msg.chatId, { type: 'typing', userId }, ws);
        if (msg.type === 'reaction') {
          const ex = await pool.query('SELECT id FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND emoji=$3', [msg.messageId, userId, msg.emoji]);
          if (ex.rows.length) await pool.query('DELETE FROM message_reactions WHERE id=$1', [ex.rows[0].id]);
          else await pool.query('INSERT INTO message_reactions (message_id,user_id,emoji) VALUES ($1,$2,$3)', [msg.messageId, userId, msg.emoji]);
          const rx = await pool.query('SELECT mr.emoji, mr.user_id, u.username FROM message_reactions mr JOIN users u ON mr.user_id=u.id WHERE mr.message_id=$1', [msg.messageId]);
          sendToChat(msg.chatType, msg.chatId, { type: 'reaction_update', messageId: msg.messageId, reactions: rx.rows });
        }
      } catch(e) {}
    });
    
    ws.on('close', async () => {
      connections.get(userId)?.delete(ws);
      if (!connections.get(userId)?.size) {
        connections.delete(userId);
        await pool.query('UPDATE users SET is_online=false, last_seen=NOW() WHERE id=$1', [userId]);
        broadcast({ type: 'user_status', userId, is_online: false });
      }
    });
  } catch { ws.close(); }
});

async function sendToChat(type, id, msg, excludeWs = null) {
  let members = [];
  if (type === 'direct') {
    const r = await pool.query('SELECT user1_id, user2_id FROM direct_chats WHERE id=$1', [id]);
    if (r.rows.length) members = [r.rows[0].user1_id, r.rows[0].user2_id];
  }
  const data = JSON.stringify(msg);
  members.forEach(uid => connections.get(uid)?.forEach(c => {
    if (c !== excludeWs && c.readyState === WebSocket.OPEN) c.send(data);
  }));
}

function broadcast(msg) {
  const data = JSON.stringify(msg);
  connections.forEach(clients => clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(data);
  }));
}

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const ex = await pool.query('SELECT id FROM users WHERE email=$1 OR username=$2', [email, username]);
    if (ex.rows.length) return res.status(400).json({ error: 'Exists' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query('INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING id,username,email', [username, email, hash]);
    const user = r.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY || 'secret', { expiresIn: '7d' });
    res.json({ token, user });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid' });
    const user = r.rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/search', auth, async (req, res) => {
  const r = await pool.query('SELECT id,username,is_online FROM users WHERE username ILIKE $1 AND id!=$2 LIMIT 20', [`%${req.query.q}%`, req.userId]);
  res.json(r.rows);
});

app.get('/api/chats', auth, async (req, res) => {
  const direct = await pool.query(`
    SELECT dc.id, CASE WHEN dc.user1_id=$1 THEN u2.username ELSE u1.username END as chat_name, 'direct' as chat_type,
    CASE WHEN dc.user1_id=$1 THEN u2.id ELSE u1.id END as other_user_id,
    (SELECT content FROM messages WHERE chat_type='direct' AND chat_id=dc.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM direct_chats dc JOIN users u1 ON dc.user1_id=u1.id JOIN users u2 ON dc.user2_id=u2.id
    WHERE dc.user1_id=$1 OR dc.user2_id=$1
  `, [req.userId]);
  res.json({ directChats: direct.rows, servers: [] });
});

app.post('/api/chats/direct', auth, async (req, res) => {
  const ex = await pool.query('SELECT id FROM direct_chats WHERE (user1_id=$1 AND user2_id=$2) OR (user1_id=$2 AND user2_id=$1)', [req.userId, req.body.userId]);
  if (ex.rows.length) return res.json({ chatId: ex.rows[0].id });
  const r = await pool.query('INSERT INTO direct_chats (user1_id,user2_id) VALUES ($1,$2) RETURNING id', [req.userId, req.body.userId]);
  res.json({ chatId: r.rows[0].id });
});

app.get('/api/messages/:type/:id', auth, async (req, res) => {
  const r = await pool.query('SELECT m.id,m.content,m.created_at,m.reply_to_id,u.id as sender_id,u.username as sender_name FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.chat_type=$1 AND m.chat_id=$2 ORDER BY m.created_at DESC LIMIT 50', [req.params.type, req.params.id]);
  const msgs = await Promise.all(r.rows.reverse().map(async m => {
    const rx = await pool.query('SELECT mr.emoji,mr.user_id,u.username FROM message_reactions mr JOIN users u ON mr.user_id=u.id WHERE mr.message_id=$1', [m.id]);
    return { ...m, reactions: rx.rows };
  }));
  res.json(msgs);
});

app.delete('/api/messages/:id', auth, async (req, res) => {
  const m = await pool.query('SELECT * FROM messages WHERE id=$1 AND sender_id=$2', [req.params.id, req.userId]);
  if (!m.rows.length) return res.status(403).json({ error: 'No' });
  await pool.query('DELETE FROM messages WHERE id=$1', [req.params.id]);
  sendToChat(m.rows[0].chat_type, m.rows[0].chat_id, { type: 'message_deleted', messageId: req.params.id });
  res.json({ ok: true });
});

app.get('/', (req, res) => res.send(HTML));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 8000;
initDB().then(() => server.listen(PORT, () => console.log('http://localhost:' + PORT)));
