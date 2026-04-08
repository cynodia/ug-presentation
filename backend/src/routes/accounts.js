const router = require('express').Router();
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.session.isSuperAdmin) {
      const accounts = await req.prisma.account.findMany({ include: { _count: { select: { projects: true, users: true } } } });
      return res.json(accounts);
    }
    const accountUsers = await req.prisma.accountUser.findMany({
      where: { userId: req.session.userId },
      include: { account: { include: { _count: { select: { projects: true, users: true } } } } }
    });
    res.json(accountUsers.map(au => au.account));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, projectLimit } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const account = await req.prisma.account.create({ data: { name, projectLimit: projectLimit ? parseInt(projectLimit) : null } });
    res.status(201).json(account);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const account = await req.prisma.account.findUnique({
      where: { id: req.params.id },
      include: { users: { include: { user: true } }, projects: true }
    });
    if (!account) return res.status(404).json({ error: 'Not found' });
    res.json(account);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, projectLimit } = req.body;
  try {
    const account = await req.prisma.account.update({
      where: { id: req.params.id },
      data: { name, projectLimit: projectLimit !== undefined ? (projectLimit ? parseInt(projectLimit) : null) : undefined }
    });
    res.json(account);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await req.prisma.account.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add user to account
router.post('/:id/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const { userId } = req.body;
  try {
    await req.prisma.accountUser.create({ data: { accountId: req.params.id, userId } });
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remove user from account
router.delete('/:id/users/:userId', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await req.prisma.accountUser.delete({ where: { accountId_userId: { accountId: req.params.id, userId: req.params.userId } } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
