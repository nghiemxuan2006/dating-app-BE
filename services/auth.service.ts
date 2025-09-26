import * as jwt from 'jsonwebtoken';
import { Account, IAccount } from '../models/user';
import settings from '../config/env';
import { UNAUTHORIZED_ERROR, NOT_FOUND_ERROR, BAD_REQUEST_ERROR } from '../utils/error';

export interface TokenPayload {
    id: string;
    username: string;
    email: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

class AuthService {
    // Generate JWT access token
    generateAccessToken(payload: TokenPayload): string {
        const secret = settings.JWT_SECRET_KEY || 'fallback-secret';
        return jwt.sign(payload as any, secret, {
            expiresIn: '15m'
        });
    }

    // Generate JWT refresh token
    generateRefreshToken(payload: TokenPayload): string {
        const secret = settings.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
        return jwt.sign(payload as any, secret, {
            expiresIn: '7d'
        });
    }

    // Generate both tokens
    generateTokens(user: IAccount): AuthTokens {
        const payload: TokenPayload = {
            id: user._id.toString(),
            username: user.username,
            email: user.email
        };

        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);

        return { accessToken, refreshToken };
    }

    // Verify access token
    verifyAccessToken(token: string): TokenPayload {
        try {
            const secret = settings.JWT_SECRET_KEY || 'fallback-secret';
            return jwt.verify(token, secret) as TokenPayload;
        } catch (error) {
            throw new UNAUTHORIZED_ERROR('Invalid or expired access token');
        }
    }

    // Verify refresh token
    verifyRefreshToken(token: string): TokenPayload {
        try {
            const secret = settings.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
            return jwt.verify(token, secret) as TokenPayload;
        } catch (error) {
            throw new UNAUTHORIZED_ERROR('Invalid or expired refresh token');
        }
    }

    // Login user
    async login(username: string, password: string): Promise<AuthTokens> {
        // Find user by username
        const user = await Account.findOne({ username }).select('+password');

        if (!user) {
            throw new NOT_FOUND_ERROR('User not found');
        }

        // Simple password comparison (no hashing as requested)
        if (user.password !== password) {
            throw new UNAUTHORIZED_ERROR('Invalid credentials');
        }

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Remove password from response
        user.password = undefined;

        return tokens;
    }

    // Register new user
    async register(username: string, email: string, password: string) {
        // Check if user already exists
        const existingUser = await Account.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            throw new BAD_REQUEST_ERROR('Username or email already exists');
        }

        // Create new user (password stored as plain text as requested)
        const user = new Account({
            username,
            email,
            password
        });

        await user.save();

        return
    }

    // Refresh access token
    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        // Verify refresh token
        const payload = this.verifyRefreshToken(refreshToken);

        // Find user and check if refresh token matches
        const user = await Account.findById(payload.id);

        if (!user) {
            throw new UNAUTHORIZED_ERROR('Invalid refresh token');
        }

        // Generate new tokens

        const accessToken = this.generateAccessToken({ id: payload.id, username: payload.username, email: payload.email });

        return { accessToken };
    }

    // Logout user
    async logout(userId: string): Promise<void> {
        await Account.findByIdAndUpdate(userId, { refreshToken: null });
    }

    // Get user by ID
    async getUserById(userId: string): Promise<IAccount> {
        const user = await Account.findById(userId).select('-password');

        if (!user) {
            throw new NOT_FOUND_ERROR('User not found');
        }

        return user;
    }
}

export default new AuthService();
