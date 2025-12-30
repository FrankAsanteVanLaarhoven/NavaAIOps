import { router } from './_app';
import { searchRouter } from './routers/search';
import { workflowsRouter } from './routers/workflows';
import { auditRouter } from './routers/audit';
import { verifierRouter } from './routers/verifier';
import { retrainingRouter } from './routers/retraining';

export const appRouter = router({
  search: searchRouter,
  workflows: workflowsRouter,
  audit: auditRouter,
  verifier: verifierRouter,
  retraining: retrainingRouter,
});

export type AppRouter = typeof appRouter;
