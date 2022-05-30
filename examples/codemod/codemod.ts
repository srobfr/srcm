import {defaultsMap, findFirstByGrammar} from "../../src";
import {codemod, parseFile} from "../../src/codemod/codemod";
import {srcmDefsFile} from "../srcmGrammar/srcmDefDef";

/**
 * Example codemod using srcm example grammar.
 *
 * To run this, use :
 * ./node_modules/.bin/ts-node examples/codemod/codemod.ts
 */
codemod(async () => {
    const sampleFile = await parseFile(srcmDefsFile, `${__dirname}/foo.ts`);

    sampleFile.$.apply([
        {
            name: "srcmDefs",
            desc: `A typescript file containing list of srcm test`,
            def: `multiple(srcmDef, w)`,
            applyCode: `// TODO`,
            // default: `"foooooo"`,
            delete: true,
        },
        {
            name: "test", desc: `A test definition. This desc has been generated on ${new Date().toLocaleString()}`
        },
        {name: "test2", desc: `A new test definition. This desc has been generated on ${new Date().toLocaleString()}`}
    ]);

    return [sampleFile];
});
