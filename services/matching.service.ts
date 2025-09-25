import { addWaitingUser, getWaitingUsers, WaitingUser } from './waiting-user.service';
import { IUserInfo } from '../models/user';
import logger from '../utils/wiston-log';
import { COORDINATE_INDEX } from '../utils/constants';
import { publisher, redis, subscriber } from '../config/redis';

const MATCHING_CHANNEL = 'user_matching';
const MATCH_FOUND_CHANNEL = 'match_found';

export interface MatchingRequest {
    userId: string;
    userInfo: IUserInfo;
    timestamp: number;
}

export interface MatchResult {
    user1: string;
    user2: string;
    compatibility_score: number;
    matched_at: number;
}

// Calculate compatibility score between two users
function calculateCompatibility(user1: MatchingRequest, user2: WaitingUser): number {
    let score = 0;
    const maxScore = 100;

    // Gender preference compatibility (30 points)
    if (user1.userInfo.gender === user2.profile.gender_preference &&
        user1.userInfo.gender_preference === user2.profile.gender) {
        score += 30;
    }

    // Age compatibility (25 points)
    const user1Age = calculateAge(new Date(user1.userInfo.birthdate));
    const user2Age = calculateAge(new Date(user2.profile.birthdate));

    if (user1.userInfo.age_range &&
        user2Age >= user1.userInfo.age_range.min &&
        user2Age <= user1.userInfo.age_range.max &&
        user2.profile.age_range &&
        user1Age >= user2.profile.age_range.min &&
        user1Age <= user2.profile.age_range.max) {
        score += 25;
    }

    // Interest compatibility (25 points)
    if (user1.userInfo.interests && user2.profile.interests) {
        const commonInterests = user1.userInfo.interests.filter(interest =>
            user2.profile.interests.includes(interest)
        );
        const interestScore = Math.min(25, (commonInterests.length / Math.max(user1.userInfo.interests.length, user2.profile.interests.length)) * 25);
        score += interestScore;
    }

    // Location proximity (20 points)
    if (user1.userInfo.location && user2.profile.location) {
        const distance = calculateDistance(
            user1.userInfo.location.coordinates[COORDINATE_INDEX.LATITUDE],
            user1.userInfo.location.coordinates[COORDINATE_INDEX.LONGITUDE],
            user2.profile.location.coordinates[COORDINATE_INDEX.LATITUDE],
            user2.profile.location.coordinates[COORDINATE_INDEX.LONGITUDE]
        );

        // Give higher score for closer distances (within 50km gets full points)
        if (distance <= 50) {
            score += 20;
        } else if (distance <= 100) {
            score += 15;
        } else if (distance <= 200) {
            score += 10;
        } else if (distance <= 500) {
            score += 5;
        }
    }

    return Math.min(score, maxScore);
}// Calculate age from birthdate
function calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }

    return age;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

// Publish matching request
export async function publishMatchingRequest(matchingRequest: MatchingRequest): Promise<void> {
    try {
        await publisher.publish(MATCHING_CHANNEL, JSON.stringify(matchingRequest));
        logger.info(`Published matching request for user ${matchingRequest.userId}`);
    } catch (error) {
        logger.error('Error publishing matching request:', error);
        throw error;
    }
}

// Process matching request
async function processMatchingRequest(matchingRequest: MatchingRequest): Promise<void> {
    try {
        logger.info(`Processing matching request for user ${matchingRequest.userId}`);

        // Get all waiting users
        const waitingUsers = await getWaitingUsers();
        logger.info(`Found ${waitingUsers.length} waiting users`);

        let bestMatch: WaitingUser | null = null;
        let bestScore = 0;
        const minimumScore = 40; // Minimum compatibility score to consider a match

        // Find the best match
        for (const waitingUser of waitingUsers) {
            // Don't match with yourself
            if (waitingUser.userId === matchingRequest.userId) {
                continue;
            }

            const score = calculateCompatibility(matchingRequest, waitingUser);
            logger.info(`Compatibility score between ${matchingRequest.userId} and ${waitingUser.userId}: ${score}`);

            if (score > bestScore && score >= minimumScore) {
                bestScore = score;
                bestMatch = waitingUser;
            }
        }

        if (bestMatch) {
            // Match found!
            logger.info(`Match found! ${matchingRequest.userId} matched with ${bestMatch.userId} (score: ${bestScore})`);

            // Remove the matched user from waiting list
            await removeUserFromWaitingList(bestMatch.userId);

            // Store match result in Redis for quick access
            const matchResult: MatchResult = {
                user1: matchingRequest.userId,
                user2: bestMatch.userId,
                compatibility_score: bestScore,
                matched_at: Date.now()
            };

            // Store recent matches for both users (expire in 24 hours)
            // await redis.setex(`recent_matches:${matchingRequest.userId}`, 86400, JSON.stringify(matchResult));
            // await redis.setex(`recent_matches:${bestMatch.userId}`, 86400, JSON.stringify(matchResult));

            // Publish match result
            await publisher.publish(MATCH_FOUND_CHANNEL, JSON.stringify(matchResult));

        } else {
            // No match found, add to waiting list
            logger.info(`No match found for user ${matchingRequest.userId}, adding to waiting list`);

            const waitingUser: WaitingUser = {
                userId: matchingRequest.userId,
                profile: matchingRequest.userInfo
            };

            await addWaitingUser(waitingUser);
        }

    } catch (error) {
        logger.error('Error processing matching request:', error);
    }
}

// Remove user from waiting list
async function removeUserFromWaitingList(userId: string): Promise<void> {
    try {
        const waitingUsers = await getWaitingUsers();
        const filteredUsers = waitingUsers.filter(user => user.userId !== userId);

        // Clear the list and add back all users except the removed one
        await redis.del('waiting_users');
        for (const user of filteredUsers) {
            await addWaitingUser(user);
        }

        logger.info(`Removed user ${userId} from waiting list`);
    } catch (error) {
        logger.error(`Error removing user ${userId} from waiting list:`, error);
    }
}

// Subscribe to matching requests
export function startMatchingSubscriber(): void {
    subscriber.subscribe(MATCHING_CHANNEL, (err, count) => {
        if (err) {
            logger.error('Error subscribing to matching channel:', err);
            return;
        }
        logger.info(`Subscribed to ${count} channel(s). Listening for matching requests...`);
    });

    subscriber.on('message', async (channel, message) => {
        if (channel === MATCHING_CHANNEL) {
            try {
                const matchingRequest: MatchingRequest = JSON.parse(message);
                console.log('Received matching request:', matchingRequest);
                await processMatchingRequest(matchingRequest);
            } catch (error) {
                logger.error('Error processing matching message:', error);
            }
        }
    });

    subscriber.on('error', (error) => {
        logger.error('Redis subscriber error:', error);
    });
}

// Subscribe to match results (for notifications, logging, etc.)
export function startMatchResultSubscriber(callback: (matchResult: MatchResult) => void): void {
    subscriber.subscribe(MATCH_FOUND_CHANNEL, (err, count) => {
        if (err) {
            logger.error('Error subscribing to match result channel:', err);
            return;
        }
        logger.info(`Subscribed to match result channel. Listening for match notifications...`);
    });

    subscriber.on('message', async (channel, message) => {
        if (channel === MATCH_FOUND_CHANNEL) {
            try {
                const matchResult: MatchResult = JSON.parse(message);
                logger.info(`Match notification received:`, matchResult);
                callback(matchResult);
            } catch (error) {
                logger.error('Error processing match result message:', error);
            }
        }
    });
}

export {
    publisher,
    subscriber,
    MATCHING_CHANNEL,
    MATCH_FOUND_CHANNEL
};
