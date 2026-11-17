import { Router } from 'express';
import { ringkasan } from '../controllers/ringkasanController.js';
import { eksporExcel } from '../controllers/exportController.js';

const router = Router();

router.get('/ringkasan', ringkasan);
router.get('/export', eksporExcel);

export default router;
