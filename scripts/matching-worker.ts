#!/usr/bin/env node

import { startMatchingSubscriber } from '../services/matching.service';
import connectMongoDB from '../config/mongodb';
import logger from '../utils/matching-worker-log';

async function startMatchingWorker() {
    try {
        // Connect to MongoDB
        await connectMongoDB();
        logger.info('Connected to MongoDB');

        // Start the matching subscriber
        startMatchingSubscriber();
        logger.info('Matching subscriber started');

    } catch (error) {
        logger.error('Error starting matching worker:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Start the worker
if (require.main === module) {
    startMatchingWorker();
}

export { startMatchingWorker };
