import {publicProcedure} from "#trpc";
import { TRPCError } from "@trpc/server";
import Path from "node:path";
import schema from "./endpoint.schema.ts";
import {Project, ts, VariableDeclarationKind} from "ts-morph";

export default publicProcedure
    .input(schema.input)
    .output(schema.output)
    .mutation(async ({input: [router_name, procedure_type, procedure_name], ctx}) => {
        const router_relative_path_fragments = router_name.split('.');
        let promises: (()=>Promise<any>)[] = [];
        const router_relative_path = router_relative_path_fragments.join(Path.sep);
        const project = new Project({
            tsConfigFilePath: `${ctx.project.root_dir}/tsconfig.json`,
            skipFileDependencyResolution: true,
            skipLoadingLibFiles: true,
            manipulationSettings: {
                insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
                useTrailingCommas: false
            }
        });
        /**
         * Router
         */
        {
            const router_file = project.getSourceFile(`${ctx.project.root_dir}/api/${router_relative_path}.ts`);
            if (!router_file)
                return ctx.abort(new TRPCError({code: 'NOT_FOUND', message: `File "${ctx.project.root_dir}/api/${router_relative_path}.ts" not found`}));
            const schema_import = router_file.getImportDeclaration(`./${router_relative_path_fragments.at(-1) as string}.schema.ts`);
            if (!schema_import){
                return ctx.abort(new TRPCError({code: 'NOT_FOUND', message: `Import of "./${router_relative_path_fragments.at(-1) as string}.schema.ts" is not present in the router file`}));
            }
            schema_import.insertNamedImport(Math.max(schema_import.getNamedImports().length - 1, 0), procedure_name);
            router_file.transform(traversal => {
                const node = traversal.visitChildren(); // return type is `ts.Node`
                if (node.parent && ts.isCallExpression(node.parent) && node.parent?.expression?.getText() === 'router' && ts.isObjectLiteralExpression(node)) {
                    return ts.factory.updateObjectLiteralExpression(node, [
                        ...node.properties,
                        ts.factory.createPropertyAssignment(
                            ts.factory.createIdentifier(procedure_name),
                                ts.factory.createCallExpression(
                                    ts.factory.createPropertyAccessExpression(
                                        ts.factory.createCallExpression(
                                            ts.factory.createPropertyAccessExpression(
                                                ts.factory.createCallExpression(
                                                    ts.factory.createPropertyAccessExpression(
                                                        ts.factory.createIdentifier("publicProcedure"),
                                                        ts.factory.createIdentifier("input")
                                                    ),
                                                    undefined,
                                                   [ts.factory.createPropertyAccessExpression(
                                                        ts.factory.createIdentifier(procedure_name),
                                                        ts.factory.createIdentifier("input")
                                                    )]
                                                ),
                                                ts.factory.createIdentifier("output")
                                            ),
                                            undefined,
                                           [ts.factory.createPropertyAccessExpression(
                                                ts.factory.createIdentifier(procedure_name),
                                                ts.factory.createIdentifier("output")
                                            )]
                                        ),
                                        ts.factory.createIdentifier(procedure_type)
                                    ),
                                    undefined,
                                   [ts.factory.createArrowFunction(
                                       [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
                                        undefined,
                                       [ts.factory.createParameterDeclaration(
                                            undefined,
                                            undefined,
                                            ts.factory.createObjectBindingPattern([
                                                ts.factory.createBindingElement(
                                                    undefined,
                                                    undefined,
                                                    ts.factory.createIdentifier("input"),
                                                    undefined
                                                ),
                                                ts.factory.createBindingElement(
                                                    undefined,
                                                    undefined,
                                                    ts.factory.createIdentifier("ctx"),
                                                    undefined
                                                )
                                            ]),
                                            undefined,
                                            undefined,
                                            undefined
                                        )],
                                        undefined,
                                        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                                        ts.factory.createBlock(
                                            [],
                                            true
                                        )
                                    )]
                                )
                            

                            //
                        )
                    ])
                }
                return node;
            });
            router_file.formatText({indentMultiLineObjectLiteralBeginningOnBlankLine: true});
            promises.push(()=>router_file.save());
        }
        /**
         * Schema
         */
        {
            const schema_file = project.getSourceFile(`${ctx.project.root_dir}/api/${router_relative_path}.schema.ts`);
            if (!schema_file)
                return ctx.abort(new TRPCError({code: 'NOT_FOUND', message: `File "${ctx.project.root_dir}/api/${router_relative_path}.schema.ts" not found`}));
            schema_file.addVariableStatement({
                isExported: true,
                declarationKind: VariableDeclarationKind.Const,
                leadingTrivia: '\n',
                declarations: [{
                    name: procedure_name,
                    initializer: w=>w
                        .writeLine("{")
                        .writeLine("input: z.object({}),")
                        .writeLine("output: z.void(),")
                        .write("} satisfies EndpointSchema")
                }]
            }).formatText({indentMultiLineObjectLiteralBeginningOnBlankLine: true, ensureNewLineAtEndOfFile: false});
            promises.push(()=>schema_file?.save());
        }
        await Promise.all(promises.map(x=>x()));
    });