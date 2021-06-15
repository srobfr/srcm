import {applyMap, defaultsMap, Node, optional} from "../../src";
import {ident, jsDocOneLineBlockComment, ow, string, w} from "../typescript/tsBasic";
import {tsRegex} from "../typescript/tsRegex";
import {srcmApplyMapDeclaration, srcmDefaultsMapDeclaration} from "./srcmBasicDefs";

/** a regex grammar definition */
export const srcmRegexDef = [
    jsDocOneLineBlockComment, w,
    "export const ", ident, ow, '=', ow, tsRegex, ';',
    srcmDefaultsMapDeclaration,
    srcmApplyMapDeclaration,
];
defaultsMap.set(srcmRegexDef, `/** TODO */\nexport const todo = /^TODO/;`);
applyMap.set(srcmRegexDef, ($: Node, def: {
    name?: string,
    desc?: string,
    regex?: string,
    default?: string | null,
    applyCode?: string | null,
}) => {
    if (def.name) $.children[3].text(def.name);
    if (def.desc) $.children[0].text(`/** ${def.desc} */`);
    if (def.regex) $.children[7].text(def.regex);
    if (def.name || def.default !== undefined) $.children[9].apply({name: $.children[3].text(), value: def.default});
    if (def.name || def.applyCode !== undefined) $.children[10].apply({name: $.children[3].text(), applyCode: def.applyCode});
});

/** a litteral grammar definition */
export const srcmStringDef = [
    jsDocOneLineBlockComment, w,
    "export const ", ident, ow, '=', ow, string, ';',
    srcmDefaultsMapDeclaration,
    srcmApplyMapDeclaration,
];
defaultsMap.set(srcmStringDef, `/** TODO */\nexport const todo = \`TODO\`;`);
