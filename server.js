require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { getDb } = require('./database/init'); // Initialize database

const app = express();
const requiredEnvVars = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SESSION_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];

function validateConfiguration() {
  const missing = requiredEnvVars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      formAction: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  referrerPolicy: {
    policy: 'same-origin'
  }
}));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Body parsing with limits
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Session setup (Serverless compatible)
const cookieSession = require('cookie-session');
app.set('trust proxy', 1); // Trust Vercel's proxy so secure cookies work
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax'
}));

// Global variables for templates
app.use((req, res, next) => {
  res.locals.lang = req.cookies.lang || req.query.lang || 'en';
  res.locals.theme = req.cookies.theme || req.query.theme || 'dark';
  next();
});

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).render('public/error', { message: 'Page non trouvée / Page not found' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function start() {
  validateConfiguration();
  await getDb();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
start().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exit(1);
});
