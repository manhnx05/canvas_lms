import { Router } from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/conversation.controller';

const router = Router();

router.get('/', getConversations);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

export default router;
