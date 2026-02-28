import { FastifyInstance } from 'fastify';
import { readFileSync } from 'fs';

const DASHBOARD_PATH = '/home/bobo_kovacevic/.openclaw/workspace/zagreb-apartments/index.html';
const ACCESS_KEY = 'BobosApartments2026!';

export async function privateRoutes(app: FastifyInstance) {
  // Robots.txt with /d/ disallowed
  app.get('/robots.txt', async (_req, reply) => {
    reply.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /d/\n`
    );
  });

  app.get('/d/4k7x9m2z', async (req, reply) => {
    const key = (req.query as Record<string, string>).key;
    if (key !== ACCESS_KEY) {
      reply.code(403).send('Not found');
      return;
    }

    let html: string;
    try {
      html = readFileSync(DASHBOARD_PATH, 'utf-8');
    } catch {
      reply.code(500).send('Dashboard unavailable');
      return;
    }

    // Inject noindex meta tag after <head>
    html = html.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex, nofollow">');

    reply
      .header('X-Robots-Tag', 'noindex, nofollow')
      .type('text/html')
      .send(html);
  });
}
