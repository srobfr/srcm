import {applyMap, defaultsMap, findByGrammar, findFirstByGrammar, findFirstByPath, multiple, Node, optmul, optmulApply, tag} from "../../src";
import {anythingUntilSemicolon, ident, jsDocOneLineBlockComment, ow, w} from "../typescript/tsBasic";
import {srcmApplyMapDeclaration, srcmDefaultsMapDeclaration} from "./srcmBasicDefs";

export const srcmDefName = [ident];

/** A srcm grammar definition */
export const srcmDef = [
    jsDocOneLineBlockComment, w,
    "export const ", srcmDefName, ow, '=', ow, [/^[^ ]/, anythingUntilSemicolon], ';',
    srcmDefaultsMapDeclaration,
    srcmApplyMapDeclaration,
];
defaultsMap.set(srcmDef, `/** TODO */\nexport const todo = /^TODO/;`);
type SrcmDefDefType = {
    name?: string,
    desc?: string,
    def?: string,
    default?: string | null,
    applyCode?: string | null,
    delete?: boolean,
};
applyMap.set(srcmDef, ($: Node, def: SrcmDefDefType) => {
    if (def.name) $.children[3].text(def.name);
    if (def.desc) $.children[0].text(`/** ${def.desc} */`);
    if (def.def) $.children[7].text(def.def);
    if (def.default !== undefined || (def.name !== findFirstByPath($, [srcmDefaultsMapDeclaration, ident])?.text())) $.children[9].apply({name: $.children[3].text(), value: def.default || null});
    if (def.applyCode !== undefined || (def.name !== findFirstByPath($, [srcmApplyMapDeclaration, ident])?.text())) $.children[10].apply({name: $.children[3].text(), applyCode: def.applyCode || null});
});

export const srcmDefsSeparator = [w];
defaultsMap.set(srcmDefsSeparator, `\n\n`);

export const srcmDefs = optmul(srcmDef, srcmDefsSeparator);
applyMap.set(srcmDefs, ($: Node, def: Array<SrcmDefDefType>) => {
    // Typical case of a list of items identified by a name
    optmulApply(
        $, def,
        ($$, subDef) => findFirstByGrammar($$, srcmDefName).text().localeCompare(subDef.name) // Lexicographic order
    );
});

export const srcmDefsFile = [
    optmul(/^import .+?;[\n\s]*/),
    srcmDefs,
    ow
];
applyMap.set(srcmDefsFile, ($: Node, def: Array<SrcmDefDefType>) => {
    $.children[1].apply(def);
});
