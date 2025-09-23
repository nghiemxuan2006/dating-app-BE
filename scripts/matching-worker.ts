#!/usr/bin/env node

import { startMatchingSubscriber, startMatchResultSubscriber, MatchResult } from '../services/matching.service';
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

        // Start the match result subscriber for logging and notifications
        startMatchResultSubscriber((matchResult: MatchResult) => {
            logger.info(`🎉 MATCH FOUND! User ${matchResult.user1} matched with User ${matchResult.user2}`);
            logger.info(`💕 Compatibility Score: ${matchResult.compatibility_score}%`);
            logger.info(`⏰ Matched at: ${new Date(matchResult.matched_at).toISOString()}`);

            // Here you can add additional logic like:
            // - Send notifications to matched users
            // - Create match records in database
            // - Trigger other services
            // - Send webhooks
        });

        logger.info('Match result subscriber started');
        logger.info('🚀 Matching worker is ready and listening for matching requests...');

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
