import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
import { GatewayServer } from './server/GatewayServer';
import { Logger } from './utils/Logger';

// Load environment variables
dotenv.config();

const logger = Logger.getInstance();
const PORT = process.env.PORT || 3000;
const CLUSTER_MODE = process.env.CLUSTER_MODE === 'true';

async function startGateway(): Promise<void> {
  try {
    const server = new GatewayServer();
    await server.initialize();
    await server.start(Number(PORT));
    
    logger.info(`API Gateway started on port ${PORT} (PID: ${process.pid})`);
  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

// Clustering for high availability
if (CLUSTER_MODE && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Starting ${numCPUs} worker processes for high availability`);
  
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
    logger.info('SIGTERM received, shutting down gracefully');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
  });
  
} else {
  // Worker process or single process mode
  startGateway();
  
  // Graceful shutdown for workers
  process.on('SIGTERM', () => {
    logger.info('Worker received SIGTERM, shutting down gracefully');
    process.exit(0);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at promise', { promise: promise.toString(), reason });
  process.exit(1);
});