/**
 * Health check routes
 */
const express = require('express');
const { checkDatabaseHealth } = require('../config/database');
const { checkRedisHealth, isRedisAvailable } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connectivity (required)
    const dbHealthy = await checkDatabaseHealth();
    
    // Check Redis connectivity (optional)
    const redisHealthy = await checkRedisHealth();
    const redisConfigured = isRedisAvailable();
    
    const responseTime = Date.now() - startTime;
    
    // System is healthy if database is working (Redis is optional)
    const isHealthy = dbHealthy;
    
    const healthStatus = {
      status: isHealthy ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          status: dbHealthy ? 'OK' : 'ERROR',
          type: 'MongoDB',
          required: true
        },
        cache: {
          status: redisConfigured ? (redisHealthy ? 'OK' : 'ERROR') : 'DISABLED',
          type: 'Redis',
          required: false,
          message: redisConfigured ? undefined : 'Redis not configured (optional)'
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    if (isHealthy) {
      res.status(200).json(healthStatus);
    } else {
      logger.error('Health check failed', healthStatus);
      res.status(503).json(healthStatus);
    }
    
  } catch (error) {
    logger.error('Health check error:', error);
    
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        database: { status: 'UNKNOWN', required: true },
        cache: { status: 'UNKNOWN', required: false }
      }
    });
  }
});

module.exports = router;