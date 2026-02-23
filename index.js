const express = require('express');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ARGO_PORT = process.env.ARGO_PORT || 8001;

// 固定 UUID
const UUID = '1560dea6-7783-4f93-8f91-11b0b981e98a';

const ARGO_DOMAIN = process.env.ARGO_DOMAIN || '';
const ARGO_AUTH = process.env.ARGO_AUTH || '';
const CF_IP = process.env.CF_IP || 'icook.hk';
const CF_PORT = process.env.CF_PORT || '443';

const TMP = path.join(__dirname, 'tmp');

async function ensureCloudflared() {
  const bin = path.join(TMP, 'cloudflared');
  try {
    await fs.access(bin);
    return bin;
  } catch {
    console.log('Downloading cloudflared…');
    const url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed: ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(TMP, { recursive: true });
    await fs.writeFile(bin, buf);
    await fs.chmod(bin, 0o755);
    return bin;
  }
}

function startTunnel(bin) {
  let cmd = `${bin} tunnel --url http://localhost:${ARGO_PORT} --edge-ip-version auto --protocol http2 --loglevel info`;
  if (ARGO_DOMAIN && ARGO_AUTH) {
    cmd = `${bin} tunnel run --token ${ARGO_AUTH}`;
  }
  console.log('Running:', cmd);
  const p = exec(cmd);
  p.stdout.on('data', d => process.stdout.write(`[argo] ${d}`));
  p.stderr.on('data', d => process.stderr.write(`[argo err] ${d}`));
  p.on('exit', code => console.log(`Argo exited with code ${code}`));
}

function generateSubscription() {
  const base = `${UUID}@${CF_IP}:${CF_PORT}?encryption=none&security=tls&type=ws&path=/&host=${CF_IP}`;
  return [
    `vless://${base}#argo-vless`,
    `vmess://${Buffer.from(JSON.stringify({ 
      v: 2, 
      ps: 'argo-vmess', 
      add: CF_IP, 
      port: CF_PORT, 
      id: UUID, 
      aid: 0, 
      net: 'ws', 
      type: 'none', 
      host: CF_IP, 
      path: '/', 
      tls: 'tls' 
    })).toString('base64')}`,
    `trojan://${base}#argo-trojan`
  ].join('\n');
}

const app = express();

app.get('/sub', (req, res) => {
  res.type('text/plain; charset=utf-8').send(generateSubscription());
});

app.get('/uuid', (req, res) => res.send(UUID));

app.get('/health', (req, res) => res.send('ok'));

async function main() {
  try {
    const cfBin = await ensureCloudflared();
    startTunnel(cfBin);
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`订阅地址: http://127.0.0.1:${PORT}/sub`);
      if (ARGO_DOMAIN) console.log(`固定域名: ${ARGO_DOMAIN}`);
      console.log(`Argo Proxy 端口: ${ARGO_PORT}`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

main();
