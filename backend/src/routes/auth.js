const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  // Check super admin env credentials
  const superAdminUser = process.env.SUPER_ADMIN_USERNAME;
  const superAdminPass = process.env.SUPER_ADMIN_PASSWORD;
  if (superAdminUser && username === superAdminUser && password === superAdminPass) {
    req.session.userId = 'superadmin';
    req.session.isSuperAdmin = true;
    return res.json({ id: 'superadmin', username: superAdminUser, isSuperAdmin: true });
  }

  try {
    const user = await req.prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.userId = user.id;
    req.session.isSuperAdmin = user.isSuperAdmin;
    res.json({ id: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', requireAuth, async (req, res) => {
  if (req.session.userId === 'superadmin') {
    return res.json({ id: 'superadmin', username: process.env.SUPER_ADMIN_USERNAME, isSuperAdmin: true });
  }
  try {
    const user = await req.prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
