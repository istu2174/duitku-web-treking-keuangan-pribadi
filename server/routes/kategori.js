import { Router } from 'express';
import {
  daftarKategori,
  hapusKategori,
  tambahKategori,
  ubahKategori,
} from '../controllers/kategoriController.js';

const router = Router();

router.get('/', daftarKategori);
router.post('/', tambahKategori);
router.put('/:id', ubahKategori);
router.delete('/:id', hapusKategori);

export default router;
