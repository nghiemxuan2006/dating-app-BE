import { Request, Response, NextFunction } from 'express';
import { extractToken } from '../utils/token';
import authService from '../services/auth.service';
import { UNAUTHORIZED_ERROR } from '../utils/error';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const accessToken = extractToken(req.header('Authorization')) || extractToken(req.header('Token'));

        if (!accessToken) {
            throw new UNAUTHORIZED_ERROR('No token provided');
        }

        // Verify token using auth service
        const decoded = authService.verifyAccessToken(accessToken);
        req.user = decoded;

        next();
    } catch (error) {
        next(error);
    }
};

export default verifyToken;


