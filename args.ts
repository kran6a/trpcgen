import {readFileSync} from "fs";
import minimist from 'minimist';
import {z} from 'zod';
import {argv} from 'process';


const EndpointSchema: z.ZodType<Router> = z.record(z.union([z.enum(['query', 'mutation', 'subscription']), z.lazy(()=>EndpointSchema)]));

const ConfigFileSchema = z.object({
    endpoints: EndpointSchema.default({}),
    adapter: z.enum(['http']).default('http'),
    context: z.any().default(undefined),
    meta: z.any().default(undefined),
    name: z.string().default('service'),
    isDev: z.boolean().default(false)
});

const ArgsSchema = z.object({
    _: z.union([
        z.tuple([z.enum(['query', 'mutation', 'subscription']), z.string()]),
        z.tuple([z.literal('service'), z.string()])
    ])
}).transform((x)=>{
    if (x._[0] === 'query' || x._[0] === 'mutation' || x._[0] === 'subscription'){
        return {operation: x._[0], config: {name: x._[1]}};
    }
    return {operation: x._[0], config: x._[1] ? JSON.parse(readFileSync(x._[1]).toString()) : {}}
}).pipe(z.discriminatedUnion('operation', [
    z.object({
        operation: z.enum(['query', 'mutation', 'subscription']),
        config: z.object({
            name: z.string()
        })
    }),
    z.object({
        operation: z.literal('service'),
        config: ConfigFileSchema
    })
]));

const raw_args = minimist(argv.slice(2));
export default ArgsSchema.parse(raw_args);
export type Args = z.infer<typeof ArgsSchema>;