import { router } from './_app';
import { searchRouter } from './routers/search';
import { workflowsRouter } from './routers/workflows';
import { auditRouter } from './routers/audit';
import { verifierRouter } from './routers/verifier';

export const appRouter = router({
  search: searchRouter,
  workflows: workflowsRouter,
  audit: auditRouter,
  verifier: verifierRouter,
});

export type AppRouter = typeof appRouter;
