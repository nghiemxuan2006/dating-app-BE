import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import httpStatus from 'http-status';
import { BAD_REQUEST_ERROR } from '../utils/error';
import { extractToken } from '../utils/token';

export interface AuthRequest extends Request {
    user: {
        id: string;
        username: string;
        email: string;
    };
    query: { id?: string; }
}

class AuthController {
    // Register new user
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, email, password } = req.body;

            // Validate input
            if (!username || !email || !password) {
                throw new BAD_REQUEST_ERROR('Username, email, and password are required');
            }

            // Register user
            await authService.register(username, email, password);

            res.status(httpStatus.CREATED).json({
                success: true,
                message: 'User registered successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    // Login user
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, password } = req.body;

            // Validate input
            if (!username || !password) {
                throw new BAD_REQUEST_ERROR('Username and password are required');
            }

            // Login user
            const result = await authService.login(username, password);

            res.status(httpStatus.OK).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Refresh access token
    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = extractToken(req.header('Authorization') as string);

            // Validate input
            if (!refreshToken) {
                throw new BAD_REQUEST_ERROR('Refresh token is required');
            }

            // Refresh tokens

            const tokens = await authService.refreshAccessToken(refreshToken);

            res.status(httpStatus.OK).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: tokens.accessToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Logout user
    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new BAD_REQUEST_ERROR('User ID is required');
            }

            // Logout user
            await authService.logout(userId);

            res.status(httpStatus.OK).json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            next(error);
        }
    }

    // Get current user profile
    async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.user?.id;
            const userId = req.query?.id;
            let user = null;

            if (!currentUserId) {
                throw new BAD_REQUEST_ERROR('User ID is required');
            }
            if (!userId) {
                // Get user profile
                user = await authService.getUserProfileById(currentUserId);
            } else {
                if (userId === currentUserId) {
                    throw new BAD_REQUEST_ERROR('Cannot get profile of the current logged in user');
                }

                const match = await authService.getMatch(currentUserId, userId);
                if (!match || match.status !== 'APPROVED') {
                    throw new BAD_REQUEST_ERROR('User is not approved for this action');
                } else {
                    // Get user profile
                    user = await authService.getUserProfileById(userId);
                }
            }

            res.status(httpStatus.OK).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
    async getPotentialProfiles(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.user.id;
            const user = await authService.getUserProfileById(currentUserId);
            const potentialProfiles = await authService.getPotentialProfiles(user);

            res.status(httpStatus.OK).json({
                success: true,
                message: 'Potential profiles retrieved successfully',
                data: potentialProfiles
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
