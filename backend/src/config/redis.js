/**
 * Redis configuration and connection setup (Optional)
 */
const redis = require("redis");
const logger = require("./logger");

let redisClient = null;
let redisAvailable = false;

/**
 * Mock Redis client for when Redis is disabled
 */
const createMockRedisClient = () => {
  return {
    get: async () => null,
    set: async () => "OK",
    setEx: async () => "OK",
    del: async () => 1,
    ping: async () => "PONG",
    quit: async () => "OK",
    disconnect: async () => {},
    on: () => {},
    removeAllListeners: () => {},
  };
};

/**
 * Connect to Redis (Optional - won't fail if Redis is not available)
 * @returns {Promise<Object|null>}
 */
const connectRedis = async () => {
  // Check if Redis is disabled via environment variable
  if (process.env.REDIS_DISABLED === "true") {
    logger.info("Redis is disabled via REDIS_DISABLED environment variable");
    redisAvailable = false;
    redisClient = null;
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 2000,
        lazyConnect: true,
        reconnectStrategy: false, // Disable automatic reconnection
      },
    });

    // Set up error handler before connecting
    redisClient.on("error", (err) => {
      logger.warn("Redis client error (Redis is optional):", err.message);
      redisAvailable = false;
      // Don't try to reconnect on error
      if (redisClient) {
        redisClient.disconnect().catch(() => {});
        redisClient = null;
      }
    });

    redisClient.on("connect", () => {
      logger.info("Redis client connected");
      redisAvailable = true;
    });

    redisClient.on("ready", () => {
      logger.info("Redis client ready");
      redisAvailable = true;
    });

    redisClient.on("end", () => {
      logger.warn("Redis client connection ended");
      redisAvailable = false;
    });

    // Try to connect with short timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis connection timeout")), 2000)
      ),
    ]);

    redisAvailable = true;
    logger.info("Redis connected successfully");
    return redisClient;
  } catch (error) {
    logger.warn(
      "Redis connection failed (continuing without Redis):",
      error.message
    );

    // Clean up failed client
    if (redisClient) {
      try {
        redisClient.removeAllListeners();
        redisClient.disconnect().catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }
      redisClient = null;
    }

    redisAvailable = false;
    return null; // Don't throw error, just return null
  }
};

/**
 * Get Redis client instance
 * @returns {Object|null}
 */
const getRedisClient = () => {
  return redisAvailable ? redisClient : null;
};

/**
 * Check if Redis is available
 * @returns {boolean}
 */
const isRedisAvailable = () => {
  return redisAvailable;
};

/**
 * Disconnect from Redis
 * @returns {Promise<void>}
 */
const disconnectRedis = async () => {
  try {
    if (redisClient && redisAvailable) {
      await redisClient.quit();
      redisClient = null;
      redisAvailable = false;
      logger.info("Redis disconnected successfully");
    }
  } catch (error) {
    logger.error("Error disconnecting from Redis:", error);
  }
};

/**
 * Check Redis connection health
 * @returns {Promise<boolean>}
 */
const checkRedisHealth = async () => {
  try {
    if (!redisClient || !redisAvailable) return false;
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.warn("Redis health check failed:", error.message);
    redisAvailable = false;
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  disconnectRedis,
  checkRedisHealth,
};
