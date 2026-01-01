const cluster = require('cluster');
const os = require('os');
const logger = require('./src/utils/logger');

const numCPUs = process.env.CLUSTER_WORKERS === 'auto' ? os.cpus().length : parseInt(process.env.CLUSTER_WORKERS) || 4;

if (cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`);
  logger.info(`Starting ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    logger.info('Starting a new worker');
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Master received SIGTERM, shutting down gracefully');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

} else {
  require('./src/server');
  logger.info(`Worker ${process.pid} started`);
}