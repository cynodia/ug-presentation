const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.get('/:projectId/issues', requireAuth, async (req, res) => {
  try {
    const issues = await req.prisma.issue.findMany({
      where: { projectId: req.params.projectId },
      include: { state: true },
      orderBy: { order: 'asc' }
    });
    res.json(issues);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:projectId/issues', requireAuth, async (req, res) => {
  const { name, type, storyPoints, stateId, order } = req.body;
  if (!name || !stateId) return res.status(400).json({ error: 'Name and stateId required' });
  try {
    const issue = await req.prisma.issue.create({
      data: { name, type: type || 'task', storyPoints: storyPoints ? parseInt(storyPoints) : null, order: order !== undefined ? order : 0, stateId, projectId: req.params.projectId },
      include: { state: true }
    });
    res.status(201).json(issue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:projectId/issues/reorder', requireAuth, async (req, res) => {
  const updates = req.body;
  try {
    await req.prisma.$transaction(updates.map(u => req.prisma.issue.update({ where: { id: u.id }, data: { order: u.order, stateId: u.stateId } })));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:projectId/issues/:id', requireAuth, async (req, res) => {
  const { name, type, storyPoints, stateId, order } = req.body;
  try {
    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (storyPoints !== undefined) data.storyPoints = storyPoints ? parseInt(storyPoints) : null;
    if (stateId !== undefined) data.stateId = stateId;
    if (order !== undefined) data.order = order;
    const issue = await req.prisma.issue.update({ where: { id: req.params.id }, data, include: { state: true } });
    res.json(issue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:projectId/issues/:id', requireAuth, async (req, res) => {
  try {
    await req.prisma.issue.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
