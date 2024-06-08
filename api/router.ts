import {publicProcedure} from "#trpc";
import Path from "node:path";
import schema from "./router.schema.ts";
import {Project, ts} from "ts-morph";
import router_index from "../templates/router_index.ts";
import {access} from 'node:fs/promises';
import { TRPCError } from "@trpc/server";

export default publicProcedure
    .input(schema.input)
    .output(schema.output)
    .mutation(async ({input: [router_name], ctx}) => {
        const tasks: (Promise<any>)[] = [];
        const router_relative_path_fragments = router_name.split('.');
        const project = new Project({
            tsConfigFilePath: `${ctx.project.root_dir}/tsconfig.json`,
            skipFileDependencyResolution: true,
            skipLoadingLibFiles: true,
            manipulationSettings: {
                insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
                useTrailingCommas: false,
            }
        });
        try {
            await access(`${ctx.project.root_dir}/api/${router_relative_path_fragments.join(Path.sep)}.ts`);
            return ctx.abort(new TRPCError({code: 'PRECONDITION_FAILED', message: `File "${ctx.project.root_dir}/api/${router_relative_path_fragments.join(Path.sep)}.ts" already exists`}));
        } catch (e){
            const router_file = project.createSourceFile(`${ctx.project.root_dir}/api/${router_relative_path_fragments.join(Path.sep)}.ts`, router_index(router_relative_path_fragments.at(-1) as string), {overwrite: false});
            const schema_file = project.createSourceFile(`${ctx.project.root_dir}/api/${router_relative_path_fragments.join(Path.sep)}.schema.ts`, 'import {z} from "zod";\nimport type {EndpointSchema} from "#types";', {overwrite: false});
            schema_file.formatText({ensureNewLineAtEndOfFile: false});
            tasks.push(ctx.task("Saving router file", ()=>router_file.save()), ctx.task("Saving router schema file", ()=>schema_file.save()));
            /**
             * Add to parent router
             */
            {
                const file_path = router_relative_path_fragments.length === 1 ? `${ctx.project.root_dir}/router.ts` : `${ctx.project.root_dir}/api/${router_relative_path_fragments.slice(0, -1).join(Path.sep)}/index.ts`;
                const router_name = router_relative_path_fragments.at(-1) as string;
                const parent_router_file = project.getSourceFile(file_path);
                if (!parent_router_file)
                    return ctx.abort(new TRPCError({code: 'NOT_FOUND', message: `File "${file_path}" not found. Please create the parent router first`}));
                const import_declarations = parent_router_file.getImportDeclarations();
                parent_router_file.insertImportDeclaration(import_declarations.length, {
                    defaultImport: router_name,
                    moduleSpecifier: router_relative_path_fragments.length === 1 ? `./api/${router_relative_path_fragments.join(Path.sep)}.ts` : `./${router_relative_path_fragments.at(-1)}.ts`
                });

                parent_router_file.transform(traversal => {
                    const node = traversal.visitChildren(); // return type is `ts.Node`
                    if (node.parent && ts.isCallExpression(node.parent) && node.parent?.expression?.getText() === 'router' && ts.isObjectLiteralExpression(node)) {
                        return ts.factory.updateObjectLiteralExpression(node, [
                            ...node.properties,
                            ts.factory.createShorthandPropertyAssignment(router_name)
                        ]);
                    }
                    return node;
                });
                parent_router_file.formatText({indentMultiLineObjectLiteralBeginningOnBlankLine: true});
                tasks.push(ctx.task("Updating parent router file", ()=>parent_router_file.save()));
            }

            await Promise.all(tasks);
        }
    });