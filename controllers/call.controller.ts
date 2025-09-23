import { publishMatchingRequest, MatchingRequest } from '../services/matching.service';
import { BAD_REQUEST_ERROR } from '../utils/error';
import { UserInfo } from '../models/user';
import logger from '../utils/wiston-log';

const matching = async (req: any, res: any) => {
    try {
        const { userId } = req.body || {};

        if (!userId) {
            throw new BAD_REQUEST_ERROR('userId is required');
        }

        // Fetch user profile from database
        const userProfile = await UserInfo.findOne({ account: userId }).populate('account');

        if (!userProfile) {
            throw new BAD_REQUEST_ERROR('User profile not found');
        }

        // Prepare matching request
        const matchingRequest: MatchingRequest = {
            userId: userId,
            userInfo: userProfile,
            timestamp: Date.now()
        };

        // Publish matching request to Redis
        await publishMatchingRequest(matchingRequest);

        logger.info(`Matching request published for user ${userId}`);

        res.json({
            message: 'Matching request submitted successfully',
            userId: userId,
            timestamp: matchingRequest.timestamp
        });

    } catch (error) {
        logger.error('Error in matching controller:', error);
        throw error;
    }
}

export {
    matching
}