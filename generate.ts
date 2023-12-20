#!/usr/bin/env bun
import {cp, writeFile} from 'fs/promises';
import {match, P} from "ts-pattern";
import {add_endpoint} from "./add.js";
import args from "./args.js";
import {generate_router} from "./generate_router.js";
import {trpc} from './generators/index.js';

if (args.operation === 'query' || args.operation === 'mutation' || args.operation === 'subscription'){
    await add_endpoint(args);
}
else if (args.operation === 'service') {
    await cp('./data/project_skeleton', args.config.name, {recursive: true});
    await Promise.all([
        await generate_router(args.config?.endpoints || {}, `./${args.config.name}/api`, args.config.meta),
        await writeFile(`./${args.config.name}/trpc.ts`, trpc.trpc({context: args.config.context, meta: args.config.meta, isDev: args.config.isDev})),
        await writeFile(`./${args.config.name}/package.json`, trpc.package_json(args.config.name)),
        args.config.meta && await writeFile(`./${args.config.name}/meta.ts`, trpc.meta(args.config.meta)),
        args.config.context && await writeFile(`./${args.config.name}/context.ts`, trpc.context()),
        match(args.config)
            .with({adapter: 'http', name: P.string}, async (config) => {
                await writeFile(`./${config.name}/server.ts`, trpc.http_server(config.name));
            }).exhaustive()
    ]);
}
