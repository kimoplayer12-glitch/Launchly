import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export default async (req: any, res: any) => {
  const { siteId } = req.query as { siteId?: string };
  if (!siteId) return res.status(400).json({ success: false, error: 'missing siteId' });

  const previewDir = path.join(process.cwd(), 'public', 'preview', siteId);
  if (!fs.existsSync(previewDir)) return res.status(404).json({ success: false, error: 'site not found' });

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return res.status(200).json({ success: false, error: 'VERCEL_TOKEN not set on server. You can deploy locally with `vercel --prod public/preview/${siteId}`' });
  }

  try {
    // Use the vercel CLI to deploy the static folder. This requires vercel CLI to be available.
    const cmd = 'vercel';
    const args = ['deploy', previewDir, '--prod', '--confirm', '--token', token];

    const proc = spawn(cmd, args, { shell: true });
    let output = '';
    proc.stdout?.on('data', (d) => { output += d.toString(); });
    proc.stderr?.on('data', (d) => { output += d.toString(); });

    proc.on('close', (code) => {
      // Try to parse a deployment URL from the output
      const match = output.match(/https?:\/\/[^\s]+/g);
      const url = match ? match[match.length - 1] : null;
      if (code === 0 && url) {
        return res.status(200).json({ success: true, url });
      }
      return res.status(500).json({ success: false, error: 'deploy failed', output });
    });
  } catch (err: any) {
    console.error('publish error', err);
    return res.status(500).json({ success: false, error: err?.message || 'failed' });
  }
};
