import * as jwt from 'jsonwebtoken';
import { Account, IAccount, IUserInfo, UserInfo } from '../models/user';
import settings from '../config/env';
import { UNAUTHORIZED_ERROR, NOT_FOUND_ERROR, BAD_REQUEST_ERROR } from '../utils/error';
import { IMatch, Match } from '../models/match';

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
            expiresIn: '7d'
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
    };

    async getUserProfileById(userId: string) {
        const user = await UserInfo.findOne({ account: userId });

        if (!user) {
            throw new NOT_FOUND_ERROR('User profile not found');
        }

        // Ensure the profile belongs to the requested account (account may be an ObjectId)
        if ((user as any).account && (user as any).account.toString() !== userId) {
            throw new UNAUTHORIZED_ERROR('Account does not match profile');
        }

        return user;
    };

    async getMatch(userid1: string, userid2: string): Promise<IMatch | null> {
        const match = await Match.findOne({
            $or: [
                { userid1, userid2 },
                { userid1: userid2, userid2: userid1 }
            ]
        });
        return match;
    }

    // Calculate age from birthdate
    private calculateAge(birthdate: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const monthDiff = today.getMonth() - birthdate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
            age--;
        }

        return age;
    }

    // Get potential profiles based on multiple criteria
    async getPotentialProfiles(
        user: IUserInfo,
    ) {
        if (!user) {
            throw new NOT_FOUND_ERROR('User profile not found');
        }

        if (!user.location) {
            throw new BAD_REQUEST_ERROR('User location is required to find potential profiles');
        }

        const currentUserAge = this.calculateAge(new Date(user.birthdate));

        // Build base query
        const query: any = {
            account: { $ne: user._id }, // Exclude current user
            gender: user.gender_preference, // Match gender preference
        };

        // Filter by age range if preferences are set
        if (user.age_range) {
            query.birthdate = {
                $gte: new Date(new Date().getFullYear() - user.age_range.max, new Date().getMonth(), new Date().getDate()),
                $lte: new Date(new Date().getFullYear() - user.age_range.min, new Date().getMonth(), new Date().getDate())
            };
        }

        // Filter by distance using geospatial query
        const maxDistance = 5; // in kilometers
        const distanceInMeters = maxDistance * 1000; // Convert km to meters
        query.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: user.location.coordinates
                },
                $maxDistance: distanceInMeters
            }
        };

        // Execute base query
        let profiles = await UserInfo.find(query).select('-password');

        // Filter by interests (preferences must fit >= 2 options)
        if (user.interests && user.interests.length > 0) {
            profiles = profiles.filter(profile => {
                if (!profile.interests) return false;
                const commonInterests = profile.interests.filter(interest =>
                    user.interests!.includes(interest)
                );
                return commonInterests.length >= 2;
            });
        }

        // Filter by description using semantic text matching
        if (user.description) {
            const keywords = user.description.toLowerCase().split(/\s+/);
            profiles = profiles.filter(profile => {
                if (!profile.name && !profile.location_string) return false;

                const searchableText = `${profile.name || ''} ${profile.location_string || ''}`.toLowerCase();
                return keywords.some(keyword => searchableText.includes(keyword));
            });
        }

        // Filter by mutual gender preference
        profiles = profiles.filter(profile => {
            return profile.gender_preference === user.gender;
        });

        // Filter by mutual age range (if set)
        if (profiles.length > 0) {
            profiles = profiles.filter(profile => {
                if (!profile.age_range) return true;
                return currentUserAge >= profile.age_range.min && currentUserAge <= profile.age_range.max;
            });
        }

        // Exclude users with existing matches
        const existingMatches = await Match.find({
            $or: [
                { userid1: user._id },
                { userid2: user._id }
            ]
        }).select('userid1 userid2');

        const matchedUserIds = new Set(
            existingMatches.flatMap(match => [
                match.userid1.toString(),
                match.userid2.toString()
            ])
        );

        profiles = profiles.filter(profile =>
            !matchedUserIds.has(profile.account.toString())
        );

        return profiles;
    }
}

export default new AuthService();
