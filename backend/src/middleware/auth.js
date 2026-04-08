const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.session.isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = { requireAuth, requireSuperAdmin };
