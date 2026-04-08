require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => { req.prisma = prisma; next(); });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects', require('./routes/states'));
app.use('/api/projects', require('./routes/issues'));

const PORT = process.env.PORT || 3000;

async function main() {
  if (process.env.DEV_SEED === 'true') {
    try {
      const { seed } = require('./seed');
      await seed(prisma);
    } catch (e) {
      console.log('Seed skipped:', e.message);
    }
  }
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

main().catch(console.error);
