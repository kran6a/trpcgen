#!/usr/bin/env bun
import {trpcCli} from 'trpc-cli';
import {Context} from "./context.ts";
import router from './router.ts';

const cli = trpcCli({
    router,
    context: Context,
});
await cli.run();