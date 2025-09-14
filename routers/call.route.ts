import express from 'express';
import { matching } from '../controllers/call.controller';
const router = express.Router();

router.post('/matching', matching);

export default router;