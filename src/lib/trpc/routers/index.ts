import { router } from '../init';
import { agentsRouter } from './agents';
import { meetingsRouter } from './meetings';

export const appRouter = router({
  agents: agentsRouter,
  meetings: meetingsRouter,
});

export type AppRouter = typeof appRouter;
