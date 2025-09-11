import express from 'express';
import { matching } from '../controllers/call.controller';
const router = express.Router();

router.get('/matching', matching);

export default router;