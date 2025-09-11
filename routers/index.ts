import express from 'express';

import callRoutes from './call.route';

const router = express.Router();

router.use('/call', callRoutes);

export default router;