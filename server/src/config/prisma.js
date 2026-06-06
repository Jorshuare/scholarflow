import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ['error'],
});

// Wrap every query with one automatic retry to handle Neon cold-start wakeup.
// On first request after idle the TCP handshake can time out; retrying once
// (after a short wait) succeeds as the server finishes booting.
const handler = {
  get(target, prop) {
    const value = target[prop];
    if (typeof value !== 'function' || prop.startsWith('$') || prop.startsWith('_')) {
      return typeof value === 'function' ? value.bind(target) : value;
    }
    return function(...args) {
      const call = () => target[prop](...args);
      return call().catch(err => {
        const msg = err?.message ?? '';
        if (msg.includes("Can't reach database") || msg.includes('Connection timed out')) {
          return new Promise((_, reject) =>
            setTimeout(() => call().catch(reject), 3000)
          );
        }
        throw err;
      });
    };
  },
};

export default new Proxy(prisma, handler);
