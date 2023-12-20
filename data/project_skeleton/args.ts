import {readFileSync} from "fs";
import minimist from 'minimist';
import {join} from "path";
import {z} from 'zod';
import {cwd, argv} from 'process';

const ArgsSchema = z.object({
    port: z.number().int().min(0),
    hostname: z.string().optional().default('127.0.0.1')
});

const raw_args = minimist(argv.slice(2));
export default ArgsSchema.parse(raw_args.config ? JSON.parse(readFileSync(join(cwd(), raw_args.config), 'utf-8')) : raw_args);