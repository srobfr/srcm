import {defaultsMap, findFirstByGrammar} from "../../src";
import {codemod, parseFile} from "../../src/codemod/codemod";
import {srcmRegexDef} from "../srcmGrammar/srcmTerminalsDef";

codemod(async () => {
    const g = [srcmRegexDef, '\n'];
    defaultsMap.set(g, defaultsMap.get(srcmRegexDef) + '\n');

    const sampleFile = await parseFile(g, `${__dirname}/foo.ts`);

    findFirstByGrammar(sampleFile.$, srcmRegexDef).apply({
        name: "weapon",
        desc: `Hello world`,
        regex: `/^no/`,
        applyCode: `// Warning : weapon energy low`,
        default: `"no"`,
    });

    return [sampleFile];
});