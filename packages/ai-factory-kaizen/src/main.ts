import {
  AdspId,
  createErrorHandler,
  initializeService,
} from '@abgov/adsp-service-sdk';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';

import { environment } from './environment';
import { exampleEventDefinition } from './events';
import { exampleRouter } from './routes/example';

async function initializeApp() {
  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const capabilities = await initializeService(
    {
      displayName: 'ai-factory-kaizen',
      description: 'Put your service description here.',
      serviceId,
      realm: environment.TENANT_REALM,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      directoryUrl: new URL(environment.DIRECTORY_URL),
      events: [exampleEventDefinition],
    },
    { logLevel: environment.LOG_LEVEL },
  );

  const {
    logger,
    tenantStrategy,
    traceHandler,
    configurationHandler,
    healthCheck,
    eventService,
  } = capabilities;

  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json());
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  app.use(traceHandler);

  passport.use('anonymous', new AnonymousStrategy());
  passport.use('tenant', tenantStrategy);
  app.use(passport.initialize());

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform });
  });

  app.get('/', (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/ai-factory-kaizen/v1', rootUrl).href },
      },
    });
  });

  // v1 API: authenticate (tenant or anonymous) and resolve tenant configuration
  // for the whole subtree, then mount the resource routers. Add one router per
  // resource under routes/ and mount it here — keep handlers out of main.ts.
  app.use(
    '/ai-factory-kaizen/v1',
    passport.authenticate(['tenant', 'anonymous'], { session: false }),
    configurationHandler,
    exampleRouter(eventService),
  );

  // Mount error handler last — after all routes and middleware.
  app.use(createErrorHandler(logger));

  return { app, logger, eventService };
}

initializeApp()
  .then(({ app, logger }) => {
    const port = environment.PORT;
    const server = app.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}/ai-factory-kaizen/v1`);
    });
    server.on('error', (err) =>
      logger.error(`Error encountered in server: ${err}`),
    );
  })
  .catch((err) => {
    // Startup failed. The most common cause is the service's Keycloak service-account
    // missing required ADSP platform roles, so initializeService() 401/403s (see the
    // "Service won't start (401/403)" section in AGENTS.md). Exit deliberately with a
    // clear message instead of surfacing a raw unhandled-rejection stack trace.
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[ai-factory-kaizen] Failed to start: ADSP service registration did not complete. ` +
        `The Keycloak service-account may be missing required platform roles ` +
        `(platform-service / event-sender / configured-service). See AGENTS.md. Cause: ${message}`,
    );
    process.exit(1);
  });
