import express from 'express';
import { getConversationList } from '../controllers/chat.controller';
const router = express.Router();

router.get('/conversation-list', getConversationList);

export default router;