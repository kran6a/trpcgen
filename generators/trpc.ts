import {writeFile} from "fs/promises";
import {default_import, named_import, object_to_type, object} from "./native.js";

export const endpoint = async (path: string, name: string, type: 'query' | 'mutation' | 'subscription', meta?: object): Promise<undefined> => {
    const route_skeleton =
`${named_import(['t'], '#trpc')}${meta ? '\n'+named_import(['defaultMeta'], '#meta') : ''}${meta ? '\n'+default_import('deep_merge', 'ts-deepmerge') : ''}
${default_import('schema', `./${name}.schema.js`)}
export default t.procedure
    .input(schema.input)
    .output(schema.output)${meta ? `
    .meta(deep_merge(defaultMeta, {}))`: ''}
    .${type}(async ({ctx, input})=>{
        
    });`;
    const schema_skeleton =
`${named_import(['z'], 'zod')}
export default {
    input: z.object({}),
    output: z.object({})
} as const;`;
    await Promise.all([
        writeFile(`${path}/${name}.ts`, route_skeleton),
        writeFile(`${path}/${name}.schema.ts`, schema_skeleton)
    ]);
    return undefined;
}
export const http_server = (service_name: string)=>{
return (
`import {createHTTPServer} from '@trpc/server/adapters/standalone';
import router from "./api/index.js";
import args from "#args";

const {listen} = createHTTPServer({router, batching: {enabled: true}});
const {port} = listen(args.port, args.hostname);
console.info(\`[${service_name}] Server listening on \${args.hostname}:\${port}\`);`);
}
export const trpc = ({context, meta, isDev}: {context: boolean, meta: boolean, isDev: boolean})=>
`import {initTRPC} from '@trpc/server';
${context ? "import {HTTPContext} from './context.js';" : ''}
${meta ? "import {type Meta, defaultMeta} from './meta.js';" : ''}

export const t = initTRPC${context?'.context<HTTPContext>':''}${meta ? '.meta<Meta>()':''}.create({${meta ? 'defaultMeta, ' : '' }isDev: ${isDev.toString()}});`;

export const package_json = (project_name: string)=>{
    return (
`{
  "name": "${project_name}",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "build": "npx github:kran6a/xtrpc",
    "compile": "bun build ./server.ts --compile --minify --outfile ./bin --target=bun",
    "server:start": "bun server.ts",
    "server:dev": "bun server.ts",
    "typecheck": "npx tsc -p tsconfig.typecheck.json"
  },
  "types": "index.d.ts",
  "author": "",
  "license": "ISC",
  "dependencies": {
    "ts-deepmerge": "latest"
  }
}`
    );
}

export const meta = (obj: object)=>{
    return (
`export ${object_to_type('Meta', obj)};
export const defaultMeta = ${object(obj)} as const satisfies Meta;`);
}

export const context = ()=>{
    return (
`import type {CreateHTTPContextOptions} from "@trpc/server/dist/adapters/standalone";

export type Context = {
    services: services,
};

type services = {

}

const services: services = {

} as const;

export const HTTPContext = async (ctx: CreateHTTPContextOptions)=>{
    return {
        services
    } satisfies Context;
};`);
}