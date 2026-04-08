const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

const DEFAULT_STATES = [
  { name: 'Backlog', color: '#94a3b8', order: -2, isSystem: true },
  { name: 'Closed', color: '#64748b', order: -1, isSystem: true },
  { name: 'To-Do', color: '#3b82f6', order: 1, isSystem: false },
  { name: 'In Progress', color: '#f59e0b', order: 2, isSystem: false },
  { name: 'Done', color: '#10b981', order: 3, isSystem: false },
];

router.get('/', requireAuth, async (req, res) => {
  try {
    let projects;
    if (req.session.isSuperAdmin) {
      projects = await req.prisma.project.findMany({ include: { account: true } });
    } else {
      const projectUsers = await req.prisma.projectUser.findMany({
        where: { userId: req.session.userId },
        include: { project: { include: { account: true } } }
      });
      projects = projectUsers.map(pu => pu.project);
    }
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { name, accountId } = req.body;
  if (!name || !accountId) return res.status(400).json({ error: 'Name and accountId required' });
  try {
    const account = await req.prisma.account.findUnique({ where: { id: accountId }, include: { _count: { select: { projects: true } } } });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.projectLimit && account._count.projects >= account.projectLimit) {
      return res.status(400).json({ error: `Project limit (${account.projectLimit}) reached for this account` });
    }
    const project = await req.prisma.project.create({
      data: {
        name,
        accountId,
        states: { create: DEFAULT_STATES },
        users: req.session.userId !== 'superadmin' ? { create: { userId: req.session.userId } } : undefined
      },
      include: { states: true }
    });
    res.status(201).json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await req.prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        states: { orderBy: { order: 'asc' } },
        users: { include: { user: { select: { id: true, username: true } } } },
        account: true
      }
    });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name } = req.body;
  try {
    const project = await req.prisma.project.update({ where: { id: req.params.id }, data: { name } });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await req.prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/users', requireAuth, async (req, res) => {
  const { userId } = req.body;
  try {
    await req.prisma.projectUser.create({ data: { projectId: req.params.id, userId } });
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/users/:userId', requireAuth, async (req, res) => {
  try {
    await req.prisma.projectUser.delete({ where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
