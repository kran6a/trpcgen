import {printNode, ts} from "ts-morph";
const factory = ts.factory;

export default (name: string)=>[
    factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
            false,
            undefined,
            factory.createNamedImports([
                factory.createImportSpecifier(
                    false,
                    undefined,
                    factory.createIdentifier("router")
                ),
                factory.createImportSpecifier(
                    false,
                    undefined,
                    factory.createIdentifier("publicProcedure")
                )
            ])
        ),
        factory.createStringLiteral("#trpc"),
        undefined
    ),
    factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
            false,
            undefined,
            factory.createNamedImports([])
        ),
        factory.createStringLiteral(`./${name}.schema.ts`),
        undefined
    ),
    factory.createExportAssignment(
        undefined,
        undefined,
        factory.createCallExpression(
            factory.createIdentifier("router"),
            undefined,
            [factory.createObjectLiteralExpression(
                [],
                true,
            )],
        ),
    )
].map(x=>printNode(x)).join('\n');