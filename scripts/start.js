const { spawn } = require('node:child_process');
const path = require('node:path');

const rawPort = process.env.PORT || '3000';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid PORT value: ${rawPort}`);
  process.exit(1);
}

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', String(port)], {
  stdio: 'inherit',
  env: process.env,
});
child.on('error', (error) => {
  console.error('Failed to start Next.js:', error.message);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
