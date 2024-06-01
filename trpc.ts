import {initTRPC} from '@trpc/server';
import {Context} from "./context.ts";
const trpc = initTRPC.context<Context>().create({isDev: true});
export const router = trpc.router;
export const publicProcedure = trpc.procedure;