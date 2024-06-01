import {publicProcedure} from "#trpc";
import service from "../templates/service.ts";
import service_interface from "../templates/service_interface.ts";
import schema from "./service.schema.ts";
import {Project, ts} from "ts-morph";
import {access} from 'node:fs/promises';
import { TRPCError } from "@trpc/server";

export default publicProcedure
    .input(schema.input)
    .output(schema.output)
    .mutation(async ({input: [service_name], ctx}) => {
        const promises: (()=>Promise<any>)[] = [];
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
            await Promise.all([access(`${ctx.project.root_dir}/services/${service_name}.ts`), access(`${ctx.project.root_dir}/services/${service_name}.interface.ts`)]);
            return ctx.abort(new TRPCError({code: 'PRECONDITION_FAILED', message: `Service ${service_name} or its interface already exist`}));
        } catch (e){
            const service_file = project.createSourceFile(`${ctx.project.root_dir}/services/${service_name}.ts`, service(service_name), {overwrite: false});
            const service_interface_file = project.createSourceFile(`${ctx.project.root_dir}/services/${service_name}.interface.ts`, service_interface(service_name), {overwrite: false});
            const ctx_file = project.getSourceFile(`${ctx.project.root_dir}/context.ts`);
            service_file.formatText({ensureNewLineAtEndOfFile: false});
            service_interface_file.formatText({ensureNewLineAtEndOfFile: false});
            promises.push(()=>service_file.save(), ()=>service_interface_file.save());
            /**
             * Add to ctx type
             */
            {
                if (!ctx_file)
                    return ctx.abort(new TRPCError({code: 'NOT_FOUND', message: `File "${ctx.project.root_dir}/context.ts" not found`}));
                const import_declarations = ctx_file.getImportDeclarations();
                ctx_file.insertImportDeclaration(import_declarations.length, {
                    defaultImport: service_name,
                    moduleSpecifier: `./services/${service_name}.ts`
                });

                ctx_file.transform(traversal => {
                    const node = traversal.visitChildren(); // return type is `ts.Node`
                    if (ts.isTypeAliasDeclaration(node) && node.name.getText() === 'services') {
                        if (!ts.isTypeLiteralNode(node.type)){
                            return ctx.abort(new TRPCError({code: 'NOT_FOUND', message: `Expected services to be a type declaration`}));
                        }
                        const existing_members = node.type.members;
                        const new_member = ts.factory.createPropertySignature(undefined, service_name, undefined, ts.factory.createTypeQueryNode(ts.factory.createIdentifier(service_name)));
                        return ts.factory.createTypeAliasDeclaration(undefined, "services", undefined, ts.factory.createTypeLiteralNode([
                            ...existing_members,
                            new_member
                        ]));
                    }
                    return node;
                });
                ctx_file.formatText({indentMultiLineObjectLiteralBeginningOnBlankLine: true});
                promises.push(()=>ctx_file.save());
            }
            /**
             * Add to ctx object
             */
            {
                ctx_file.transform(traversal => {
                    const node = traversal.visitChildren(); // return type is `ts.Node`
                    if (ts.isVariableDeclaration(node) && node.name.getText() === 'services') {
                        if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)){
                            return ctx.abort(new TRPCError({code: 'NOT_FOUND', message: `Expected services to be a type declaration`}));
                        }
                        return ts.factory.updateVariableDeclaration(node, node.name, undefined, node.type, ts.factory.updateObjectLiteralExpression(node.initializer, [
                            ...node.initializer.properties,
                            ts.factory.createShorthandPropertyAssignment(service_name)
                        ]));
                    }
                    return node;
                });
                ctx_file.formatText({indentMultiLineObjectLiteralBeginningOnBlankLine: true});
                promises.push(()=>ctx_file.save());
            }
            await Promise.all(promises.map(x=>x()));
        }
    });