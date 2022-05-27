import {defaultsMap, findFirstByGrammar} from "../../src";
import {codemod, parseFile} from "../../src/codemod/codemod";
import {srcmDefs} from "../srcmGrammar/srcmDefDef";

/**
 * Example codemod using srcm example grammar.
 * 
 * To run this, use :
 * ./node_modules/.bin/ts-node examples/codemod/codemod.ts
 */
codemod(async () => {
    const g = [srcmDefs];
    defaultsMap.set(g, '');

    const sampleFile = await parseFile(g, `${__dirname}/foo.ts`);

    findFirstByGrammar(sampleFile.$, srcmDefs).apply([
        {
            name: "srcmDefsFile",
            desc: `A typescript file containing list of srcm definitions`,
            def: `multiple(srcmDef, w)`,
            applyCode: `// TODO`,
            // default: `"foooooo"`,
        },
    ]);

    return [sampleFile];
});