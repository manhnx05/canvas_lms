import { Router } from 'express';
import { getConversations, getMessages, sendMessage, createConversation } from '../controllers/conversation.controller';

const router = Router();

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

export default router;
