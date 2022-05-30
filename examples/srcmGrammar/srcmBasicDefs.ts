import {applyMap, findFirstByGrammar, Node, optional, tag} from "../../src";
import {anything, ident, string, w} from "../typescript/tsBasic";

/** defaultsMap declaration */
export const srcmDefaultsMapDeclaration = optional([
    w,
    `defaultsMap.set(`, ident, `, `, string, `);`,
]);
applyMap.set(srcmDefaultsMapDeclaration, ($: Node, def: {
    name?: string,
    value?: string,
}) => {
    if (def.value === null) $.text('');
    else {
        if ($.text() === '') $.text(`\ndefaultsMap.set(${def.name}, ${def.value});`);
        else {
            if (def.name) findFirstByGrammar($, ident).text(def.name);
            if (def.value) findFirstByGrammar($, string).text(def.value);
        }
    }
});


/** applyMap declaration */
const applyMapFuncBody = tag('applyMapFuncBody', optional(anything));
export const srcmApplyMapDeclaration = optional([
    w,
    `applyMap.set(`, ident, `, ($: Node, def: any) => {`,
    applyMapFuncBody,
    `});`,
]);
applyMap.set(srcmApplyMapDeclaration, ($: Node, def: {
    name?: string,
    applyCode?: string,
}) => {
    if (def.applyCode === null) $.text('');
    else {
        if ($.text() === '') $.text(`\napplyMap.set(${def.name}, ($: Node, def: any) => {});`);
        if (def.name) findFirstByGrammar($, ident).text(def.name);
        if (def.applyCode) findFirstByGrammar($, applyMapFuncBody).text((`\n${def.applyCode.trim()}`).replace(/\n(?!\s*\n)/g, '\n    ') + "\n");
    }
});

