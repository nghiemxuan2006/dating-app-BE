import express from 'express';

import callRoutes from './call.route';
import authRoutes from './auth.route';
import verifyToken from '../middleware/verify-token';

const router = express.Router();

router.use('/auth', authRoutes);
// router.use('/call', verifyToken, callRoutes);
router.use('/call', callRoutes);

export default router;