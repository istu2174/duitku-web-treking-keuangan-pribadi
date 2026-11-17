import { FILE_PATH, pastikanSiap } from '../services/excelService.js';

/** GET /api/export — unduh file Excel terbaru apa adanya. */
export async function eksporExcel(req, res, next) {
  try {
    await pastikanSiap();
    res.download(FILE_PATH, 'keuangan.xlsx', (err) => {
      if (!err) return;
      if (res.headersSent) return;
      if (['EBUSY', 'EPERM', 'EACCES'].includes(err.code)) {
        return res.status(409).json({
          message: 'Tutup file Excel dulu ya — file-nya sedang terbuka di aplikasi lain.',
        });
      }
      next(err);
    });
  } catch (err) {
    next(err);
  }
}
