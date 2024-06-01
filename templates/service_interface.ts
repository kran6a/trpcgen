import {ts, printNode} from "ts-morph";
const factory = ts.factory;

export default (name: string)=>[
    factory.createInterfaceDeclaration(
        [
            factory.createToken(ts.SyntaxKind.ExportKeyword),
            factory.createToken(ts.SyntaxKind.DefaultKeyword)
        ],
        factory.createIdentifier(name[0]!.toUpperCase() + name.slice(1)+"ServiceInterface"),
        undefined,
        undefined,
        []
    )
].map(x=>printNode(x)).join('\n');
