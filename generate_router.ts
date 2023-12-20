import {writeFile, mkdir} from "fs/promises";
import {native, trpc} from "./generators/index.js";

export const generate_router = async (graph: Router, path: string, defaultMeta: object)=>{
    const entries = Object.entries(graph);
    if (!entries.length)
        return;
    await mkdir(path);
    await Promise.all(entries.map(async ([key, value])=>{
        if (typeof value === 'string'){
            await trpc.endpoint(`${path}`, key, value, defaultMeta);
        }
        else {
            await generate_router(value as Router, `${path}/${key}`, defaultMeta);
        }
    }))
    await generate_index(graph, path);
}

const generate_index = (graph: Router, path: string)=>{
    const imports = [native.named_import(['t'], '#trpc')]
        .concat(Object.entries(graph).map(([key, value])=>typeof value === 'string' ? native.default_import(key, `./${key}.js`) : native.default_import(key, `./${key}/index.js`))
        ).join('\n');
    const router_parameter = native.object(Object.fromEntries(Object.keys(graph).map(x=>[x, x])) as Record<string, string>, 1, {shorthand: true});
    return writeFile(`${path}/index.ts`,
`${imports}

export default t.router(${router_parameter});`);
}