const bcrypt = require('bcryptjs');

async function seed(prisma) {
  // Check if already seeded
  const existingUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (existingUser) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Create users
  const adminPass = await bcrypt.hash('admin123', 10);
  const alicePass = await bcrypt.hash('alice123', 10);
  const bobPass = await bcrypt.hash('bob123', 10);

  const admin = await prisma.user.create({ data: { username: 'admin', password: adminPass } });
  const alice = await prisma.user.create({ data: { username: 'alice', password: alicePass } });
  const bob = await prisma.user.create({ data: { username: 'bob', password: bobPass } });

  // Create account
  const account = await prisma.account.create({
    data: {
      name: 'Demo Org',
      users: { create: [{ userId: admin.id }, { userId: alice.id }] }
    }
  });

  const DEFAULT_STATES = [
    { name: 'Backlog', color: '#94a3b8', order: -2, isSystem: true },
    { name: 'Closed', color: '#64748b', order: -1, isSystem: true },
    { name: 'To-Do', color: '#3b82f6', order: 1, isSystem: false },
    { name: 'In Progress', color: '#f59e0b', order: 2, isSystem: false },
    { name: 'Done', color: '#10b981', order: 3, isSystem: false },
  ];

  // Create Alpha Project
  const alpha = await prisma.project.create({
    data: {
      name: 'Alpha Project',
      accountId: account.id,
      states: { create: DEFAULT_STATES },
      users: { create: [{ userId: admin.id }, { userId: alice.id }] }
    },
    include: { states: true }
  });

  const alphaBacklog = alpha.states.find(s => s.name === 'Backlog');
  const alphaTodo = alpha.states.find(s => s.name === 'To-Do');
  const alphaInProgress = alpha.states.find(s => s.name === 'In Progress');
  const alphaDone = alpha.states.find(s => s.name === 'Done');

  await prisma.issue.createMany({
    data: [
      { name: 'Set up project structure', type: 'task', storyPoints: 3, order: 1, stateId: alphaDone.id, projectId: alpha.id },
      { name: 'Design database schema', type: 'task', storyPoints: 5, order: 2, stateId: alphaDone.id, projectId: alpha.id },
      { name: 'Implement authentication', type: 'feature', storyPoints: 8, order: 1, stateId: alphaInProgress.id, projectId: alpha.id },
      { name: 'Build REST API', type: 'feature', storyPoints: 13, order: 2, stateId: alphaInProgress.id, projectId: alpha.id },
      { name: 'Create frontend components', type: 'feature', storyPoints: 8, order: 1, stateId: alphaTodo.id, projectId: alpha.id },
      { name: 'Write unit tests', type: 'task', storyPoints: 5, order: 2, stateId: alphaTodo.id, projectId: alpha.id },
      { name: 'Fix login bug', type: 'bug', storyPoints: 2, order: 1, stateId: alphaBacklog.id, projectId: alpha.id },
      { name: 'Add dark mode', type: 'feature', storyPoints: 3, order: 2, stateId: alphaBacklog.id, projectId: alpha.id },
      { name: 'Performance optimization', type: 'task', storyPoints: 5, order: 3, stateId: alphaBacklog.id, projectId: alpha.id },
    ]
  });

  // Create Beta Project
  const beta = await prisma.project.create({
    data: {
      name: 'Beta Project',
      accountId: account.id,
      states: { create: DEFAULT_STATES },
      users: { create: [{ userId: admin.id }, { userId: bob.id }] }
    },
    include: { states: true }
  });

  const betaBacklog = beta.states.find(s => s.name === 'Backlog');
  const betaTodo = beta.states.find(s => s.name === 'To-Do');
  const betaInProgress = beta.states.find(s => s.name === 'In Progress');

  await prisma.issue.createMany({
    data: [
      { name: 'Market research', type: 'task', storyPoints: 3, order: 1, stateId: betaInProgress.id, projectId: beta.id },
      { name: 'Competitor analysis', type: 'task', storyPoints: 5, order: 1, stateId: betaTodo.id, projectId: beta.id },
      { name: 'User interviews', type: 'task', storyPoints: 8, order: 2, stateId: betaTodo.id, projectId: beta.id },
      { name: 'Define MVP scope', type: 'feature', storyPoints: 3, order: 1, stateId: betaBacklog.id, projectId: beta.id },
      { name: 'Create wireframes', type: 'task', storyPoints: 5, order: 2, stateId: betaBacklog.id, projectId: beta.id },
    ]
  });

  console.log('Seeding complete!');
}

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { seed };
