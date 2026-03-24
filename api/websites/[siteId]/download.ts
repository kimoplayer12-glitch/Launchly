import path from 'path';
import fs from 'fs';
import archiver from 'archiver';

export default async (req: any, res: any) => {
  const { siteId } = req.query as { siteId?: string };
  if (!siteId) return res.status(400).json({ success: false, error: 'missing siteId' });

  const previewDir = path.join(process.cwd(), 'public', 'preview', siteId);
  if (!fs.existsSync(previewDir)) return res.status(404).json({ success: false, error: 'site not found' });

  try {
    // Use archiver to stream a zip
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${siteId}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('archive err', err);
      res.status(500).end();
    });
    archive.pipe(res);
    archive.directory(previewDir, false);
    await archive.finalize();
  } catch (err: any) {
    console.error('download error', err);
    return res.status(500).json({ success: false, error: err?.message || 'failed' });
  }
};
