import { $ } from "bun";
import {publicProcedure} from "#trpc";
import {readFileSync, rmSync, writeFileSync} from "fs";
import Path from "node:path";
import schema from "./endpoint.schema.ts";

const header = `import type {CrudSubscriptionEvent} from "#domain/services/subscriptions.ts";
import type {BuiltRouter, DecorateCreateRouterOptions, QueryProcedure, MutationProcedure, DefaultErrorShape, SubscriptionProcedure} from "@trpc/server/unstable-core-do-not-import";

type BuiltRouterOptions = {
    ctx: any;
    meta: {
        permissions: number[];
        billing: {
            price: number;
            credits: number;
        };
        cache?: {
            type: "tenant" | "guest" | "device";
            max_age: number;
            immutable: boolean;
            vary: string[];
        } | undefined;
    };
    errorShape: DefaultErrorShape;
    transformer: false;
};`;
const built_router_fragment_1 = /BuiltRouter<{[^,]+/gm;
export default publicProcedure
    .output(schema.output)
    .mutation(async ({ctx}) => {
        await $`bunx tsc -p ${Path.join(ctx.project.root_dir, 'tsconfig.declaration.json')}`;
        const file = readFileSync(Path.join(ctx.project.root_dir,'./dist/bar/router.d.ts')).toString();
        rmSync(Path.join(ctx.project.root_dir, 'dist'), {recursive: true});
        const new_file = `${header}\n\nexport type API = ${file
            .replaceAll(built_router_fragment_1, 'BuiltRouter<BuiltRouterOptions')
            .replaceAll('import("@trpc/server/unstable-core-do-not-import").', '')
            .replaceAll('import("lib/domain/subscriptions.ts").', '')
            .replace('export declare const appRouter: ', '')
            .replace('export type AppRouter = typeof appRouter;', '')
            .replaceAll('Date', 'string')
        }`;
        writeFileSync(Path.join(ctx.project.root_dir, "_API.d.ts"), new_file);
    });