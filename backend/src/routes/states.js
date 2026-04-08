const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.get('/:projectId/states', requireAuth, async (req, res) => {
  try {
    const states = await req.prisma.state.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { order: 'asc' }
    });
    res.json(states);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:projectId/states', requireAuth, async (req, res) => {
  const { name, color, order } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const state = await req.prisma.state.create({
      data: { name, color: color || '#6366f1', order: order || 0, projectId: req.params.projectId }
    });
    res.status(201).json(state);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:projectId/states/reorder', requireAuth, async (req, res) => {
  const updates = req.body;
  try {
    await req.prisma.$transaction(updates.map(u => req.prisma.state.update({ where: { id: u.id }, data: { order: u.order } })));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:projectId/states/:id', requireAuth, async (req, res) => {
  const { name, color, order } = req.body;
  try {
    const data = {};
    if (name !== undefined) data.name = name;
    if (color !== undefined) data.color = color;
    if (order !== undefined) data.order = order;
    const state = await req.prisma.state.update({
      where: { id: req.params.id },
      data
    });
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:projectId/states/:id', requireAuth, async (req, res) => {
  try {
    const state = await req.prisma.state.findUnique({ where: { id: req.params.id } });
    if (!state) return res.status(404).json({ error: 'Not found' });
    if (state.isSystem) return res.status(400).json({ error: 'Cannot delete system state' });
    await req.prisma.state.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
