import { Router } from 'express';
import { login, registerInit, registerConfirm, forgotPasswordInit, forgotPasswordConfirm } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', registerInit);
router.post('/register/confirm', registerConfirm);
router.post('/forgot-password', forgotPasswordInit);
router.post('/forgot-password/confirm', forgotPasswordConfirm);

export default router;
