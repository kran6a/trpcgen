import {ts, printNode} from "ts-morph";
const factory = ts.factory;

export default (name: string)=>{
    const stylized_name = name[0]!.toUpperCase() + name.slice(1)+"Service";
    return [
        factory.createImportDeclaration(
            undefined,
            factory.createImportClause(
                true,
                factory.createIdentifier(`${name}ServiceInterface`),
                undefined
            ),
            factory.createStringLiteral(`./${name}.interface.ts`),
            undefined
        ),
        factory.createClassDeclaration(
            undefined,
            factory.createIdentifier(stylized_name),
            undefined,
            [factory.createHeritageClause(
                ts.SyntaxKind.ImplementsKeyword,
                [factory.createExpressionWithTypeArguments(
                    factory.createIdentifier(`${stylized_name}Interface`),
                    undefined
                )]
            )],
            []
        ),
        factory.createExportAssignment(
            undefined,
            undefined,
            factory.createNewExpression(
                factory.createIdentifier(stylized_name),
                undefined,
                []
            )
        )
    ].map(x=>printNode(x)).join('\n');
}
