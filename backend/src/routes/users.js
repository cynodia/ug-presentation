const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({ select: { id: true, username: true, isSuperAdmin: true, createdAt: true } });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  const { username, password, isSuperAdmin } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: { username, password: hashed, isSuperAdmin: !!isSuperAdmin },
      select: { id: true, username: true, isSuperAdmin: true, createdAt: true }
    });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, isSuperAdmin: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  if (!req.session.isSuperAdmin && req.session.userId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { username, password, isSuperAdmin } = req.body;
  try {
    const data = {};
    if (username) data.username = username;
    if (password) data.password = await bcrypt.hash(password, 10);
    if (req.session.isSuperAdmin && isSuperAdmin !== undefined) data.isSuperAdmin = !!isSuperAdmin;
    const user = await req.prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, username: true, isSuperAdmin: true, createdAt: true }
    });
    res.json(user);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await req.prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
