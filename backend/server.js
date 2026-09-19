require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const whatIfRoutes = require('./routes/whatIfRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration: Support localhost dev, Vercel deployments, and custom domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman, or same-origin rewrites)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Root API greeting
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'EnerPredict AI Backend API',
    version: '1.0.0',
  });
});

// Health check endpoint (Req 11)
// Actively checks whether the FastAPI "/health" endpoint is reachable
app.get('/api/health', async (req, res) => {
  let mlStatus = 'unavailable';
  let mlHealthData = null;
  const currentMlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

  try {
    const mlHealthRes = await axios.get(`${currentMlUrl}/health`, { timeout: 3000 });
    if (mlHealthRes.status === 200) {
      mlStatus = 'available';
      mlHealthData = mlHealthRes.data;
    }
  } catch (error) {
    mlStatus = 'unavailable';
  }

  res.status(200).json({
    status: 'ok',
    backend: 'running',
    database: 'connected',
    mlService: mlStatus,
    mlServiceUrl: currentMlUrl,
    mlHealthDetails: mlHealthData,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/whatif', whatIfRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Server Error] ${err.stack || err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// Only listen if not imported by test runner
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Express Backend] Running on http://localhost:${PORT}`);
    console.log(`[Express Backend] ML Service configured at: ${ML_SERVICE_URL}`);
  });
}

module.exports = app;
