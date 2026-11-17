import { Router } from 'express';
import {
  daftarTransaksi,
  hapusTransaksi,
  tambahTransaksi,
  ubahTransaksi,
} from '../controllers/transaksiController.js';

const router = Router();

router.get('/', daftarTransaksi);
router.post('/', tambahTransaksi);
router.put('/:id', ubahTransaksi);
router.delete('/:id', hapusTransaksi);

export default router;
