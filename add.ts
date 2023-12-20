import {readFileSync} from "fs";
import {writeFile} from "fs/promises";
import type {Args} from "./args.js";
import {default_import} from "./generators/native.js";
import {trpc} from "./generators/index.js";

export const add_endpoint = async (args: Args & {operation: 'query' | 'mutation' | 'subscription'})=>{
    await trpc.endpoint('.', args.config.name, args.operation);
    const current_index = readFileSync('./index.ts').toString('utf8');
    const result  = /\nexport default t\.router\((?<parameter>{[\S\s]*})\)/.exec(current_index) as unknown as {groups: {parameter: string}};
    const new_parameter = result.groups.parameter.replace('\r\n}', `,\r\n    ${args.config.name}\r\n}`);
    const replacement =
`${default_import(args.config.name, `./${args.config.name}.js`)}

export default t.router(${new_parameter})`;
    await writeFile('./index.ts', current_index.replace(/\nexport default t\.router\((?<parameter>{[\S\s]*})\)/m, replacement));
}