/**
 * Deploy Webhook Server — porta 9000
 * Riceve POST /deploy con Authorization Bearer e fa:
 *   git pull + npm install + pm2 restart
 *
 * Avvio: pm2 start packages/vps/src/deploy-webhook.js --name deploy-webhook
 * Env:   DEPLOY_TOKEN=<segreto> (stessa stringa in CLAUDE.md / env locale)
 */
import { createServer } from 'http';
import { execSync } from 'child_process';

const PORT = process.env.DEPLOY_WEBHOOK_PORT || 9000;
const TOKEN = process.env.DEPLOY_TOKEN || '';
const REPO_DIR = process.env.DEPLOY_REPO_DIR || '/opt/content-network';

if (!TOKEN) {
  console.error('[deploy-webhook] ATTENZIONE: DEPLOY_TOKEN non impostato — webhook aperto a tutti!');
}

const server = createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404); res.end('Not found'); return;
  }

  const auth = req.headers['authorization'] || '';
  if (TOKEN && auth !== `Bearer ${TOKEN}`) {
    res.writeHead(401); res.end('Unauthorized'); return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Deploy avviato...\n');

  try {
    const out1 = execSync(`cd ${REPO_DIR} && git pull origin main 2>&1`).toString();
    res.write(out1 + '\n');

    const out2 = execSync(`cd ${REPO_DIR}/content-network && npm install --silent 2>&1`).toString();
    res.write(out2 + '\n');

    const out3 = execSync(`pm2 restart content-scheduler email-api 2>&1`).toString();
    res.write(out3 + '\n');

    res.write('DEPLOY OK\n');
    console.log('[deploy-webhook]', new Date().toISOString(), 'deploy completato');
  } catch (err) {
    res.write('DEPLOY ERROR: ' + err.message + '\n');
    console.error('[deploy-webhook] errore:', err.message);
  }

  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[deploy-webhook] in ascolto su 127.0.0.1:${PORT}`);
});
