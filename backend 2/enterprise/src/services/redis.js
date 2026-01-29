const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
  }

  async connect() {
    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };

    this.client = new Redis(config);
    this.subscriber = new Redis(config);
    this.publisher = new Redis(config);

    this.client.on('connect', () => logger.info('Redis client connected'));
    this.client.on('error', (err) => logger.error('Redis client error:', err));

    await this.client.connect();
    await this.subscriber.connect();
    await this.publisher.connect();
  }

  // Document session management
  async joinDocument(documentId, userId, socketId) {
    const key = `doc:${documentId}:users`;
    await this.client.hset(key, userId, JSON.stringify({ socketId, joinedAt: Date.now() }));
    await this.client.expire(key, 3600); // 1 hour TTL
  }

  async leaveDocument(documentId, userId) {
    await this.client.hdel(`doc:${documentId}:users`, userId);
  }

  async getDocumentUsers(documentId) {
    const users = await this.client.hgetall(`doc:${documentId}:users`);
    return Object.entries(users).map(([userId, data]) => ({
      userId,
      ...JSON.parse(data)
    }));
  }

  // Operation queue for conflict resolution
  async addOperation(documentId, operation) {
    const key = `doc:${documentId}:ops`;
    await this.client.lpush(key, JSON.stringify({
      ...operation,
      timestamp: Date.now(),
      id: require('uuid').v4()
    }));
    await this.client.expire(key, 3600);
  }

  async getOperations(documentId, limit = 100) {
    const ops = await this.client.lrange(`doc:${documentId}:ops`, 0, limit - 1);
    return ops.map(op => JSON.parse(op));
  }

  // Pub/Sub for real-time updates
  async publishOperation(documentId, operation) {
    await this.publisher.publish(`doc:${documentId}`, JSON.stringify({
      type: 'operation',
      data: operation
    }));
  }

  async publishCursor(documentId, cursor) {
    await this.publisher.publish(`doc:${documentId}`, JSON.stringify({
      type: 'cursor',
      data: cursor
    }));
  }

  async subscribeToDocument(documentId, callback) {
    await this.subscriber.subscribe(`doc:${documentId}`);
    this.subscriber.on('message', (channel, message) => {
      if (channel === `doc:${documentId}`) {
        callback(JSON.parse(message));
      }
    });
  }

  async disconnect() {
    if (this.client) await this.client.disconnect();
    if (this.subscriber) await this.subscriber.disconnect();
    if (this.publisher) await this.publisher.disconnect();
  }
}

module.exports = new RedisService();