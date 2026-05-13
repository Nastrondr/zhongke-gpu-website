const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'zhongke-gpu-website-secret-key-2024';
const DATA_FILE = path.join(__dirname, 'database.json');

if (!process.env.JWT_SECRET) {
  console.warn('[安全警告] JWT_SECRET 未通过环境变量设置，使用默认密钥。建议生产环境设置 JWT_SECRET 环境变量');
}

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

// 简单的 JSON 文件存储
let users = [];

function loadUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      users = JSON.parse(data);
    }
  } catch (err) {
    console.error('加载数据失败:', err);
    users = [];
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('保存数据失败:', err);
  }
}

loadUsers();
console.log('用户数据已加载，共', users.length, '个用户');

// JWT 验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '登录已过期，请重新登录' });
    }
    req.user = user;
    next();
  });
}

// ============ API 路由 ============

// POST /api/auth/register - 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 基础验证
    if (!username || !email || !password) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    // 检查用户是否已存在
    const existingUser = users.find(u => u.username === username || u.email === email);
    
    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已被注册' });
    }

    // 加密密码
    const password_hash = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = {
      id: Date.now(),
      username,
      email,
      password_hash,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers();

    // 生成 token
    const token = jwt.sign({ id: newUser.id, username, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: newUser.id, username, email }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/auth/login - 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 基础验证
    if (!email || !password) {
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }

    // 查找用户
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成 token
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/auth/me - 获取当前用户信息
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json({ 
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      created_at: user.created_at 
    } 
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
========================================
  中科融合算力网认证服务器已启动
  本地访问: http://localhost:${PORT}
========================================
  `);
});
