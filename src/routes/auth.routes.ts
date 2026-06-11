import {Router} from 'express';
import { login } from '../controllers/auth.controller.js';

// Router
const router = Router();

// create login
router.post("/login", login)

export default router;