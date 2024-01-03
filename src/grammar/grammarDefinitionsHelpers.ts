import { defaultsMap } from "../codemod/maps";
import {
    GrammarDefinition,
    MultipleGrammarDefinition,
    ObjectGrammarDefinition,
    OptionalGrammarDefinition,
    OptMulGrammarDefinition,
    OrGrammarDefinition,
} from "./GrammarDefinitions";

export const or = (...defs: Array<GrammarDefinition>): OrGrammarDefinition => ({or: defs});
export const optional = (def: GrammarDefinition): OptionalGrammarDefinition => ({optional: def});
export const multiple = (def: GrammarDefinition, sep?: GrammarDefinition): MultipleGrammarDefinition => ({multiple: def, ...sep && {sep}});
export const optmul = (def: GrammarDefinition, sep?: GrammarDefinition): OptMulGrammarDefinition => ({optmul: def, ...sep && {sep}});

export const tag = (tagName: string, def: GrammarDefinition): ObjectGrammarDefinition => {
    const r = [def] as ObjectGrammarDefinition;
    r.tag = tagName;
    return r;
};

export const withDefault = (def: ObjectGrammarDefinition, defaultCode: string): ObjectGrammarDefinition => {
    defaultsMap.set(def, defaultCode);
    return def;
};

/** Handles a template litteral as a sequence : seq`foo${a}` => ["foo", a] */
export const seq = (strings, ...args) => strings.map((s, i) => [s, args[i] ?? null]).flat().filter(s => s !== null && s !== "")
