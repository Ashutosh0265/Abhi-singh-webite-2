import fs from 'node:fs';
import path from 'node:path';
import { getOrderById } from './_lib/orders.js';
import { verifyDownloadToken } from './_lib/tokens.js';
import { getProductById } from './_lib/products.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, token } = req.query || {};

    if (!orderId || !token) {
      return res.status(400).json({ error: 'Missing order reference or authorization token.' });
    }

    // 1. Verify token signature and expiration
    const tokenCheck = verifyDownloadToken(orderId, token);
    if (!tokenCheck.valid) {
      return res.status(403).json({
        error: `Access Denied: ${tokenCheck.error || 'Invalid or expired download token.'}`,
      });
    }

    // 2. Verify order existence and payment verification status
    const order = getOrderById(orderId);
    const paymentStatus = order ? order.payment_status : tokenCheck.status;
    const productId = order ? order.product_id : tokenCheck.productId;

    if (!order && !productId) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (paymentStatus !== 'PAID' && paymentStatus !== 'FREE') {
      return res.status(403).json({
        error: `Access Denied: Payment status is ${paymentStatus || 'UNVERIFIED'}. Downloads are only authorized for confirmed PAID or FREE orders.`,
        paymentStatus,
      });
    }

    // 3. Locate actual physical PDF deliverable
    const product = productId ? getProductById(productId) : null;
    let targetPdf = order?.pdf_url || product?.file_url || product?.downloadUrl || '';
    if (!targetPdf) {
      return res.status(404).json({ error: 'No PDF deliverable is associated with this product.' });
    }

    const fileName = order?.file_name || product?.file_name || (targetPdf ? path.basename(targetPdf) : 'deliverable.pdf');

    // If local public asset, stream file with strict security headers
    if (targetPdf.startsWith('/')) {
      const candidates = [
        path.resolve(process.cwd(), 'public', targetPdf.replace(/^\//, '')),
        path.resolve(process.cwd(), targetPdf.replace(/^\//, '')),
      ];

      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', stats.size);
          res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
          res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');

          const readStream = fs.createReadStream(filePath);
          return readStream.pipe(res);
        }
      }

      // If running in a serverless environment where static assets are served from edge CDN
      const host = req.headers.host || 'abhisingh-website.vercel.app';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      return res.redirect(302, `${protocol}://${host}${targetPdf}`);
    }

    // External URL redirect if stored in remote bucket
    if (targetPdf.startsWith('http://') || targetPdf.startsWith('https://')) {
      return res.redirect(302, targetPdf);
    }

    return res.status(404).json({ error: 'PDF deliverable file could not be located.' });
  } catch (err) {
    console.error('[download-pdf] Exception:', err);
    return res.status(500).json({ error: 'Server error processing file download.' });
  }
}
