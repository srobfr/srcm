import {
    GrammarDefinition,
    MultipleGrammarDefinition,
    ObjectGrammarDefinition,
    OptionalGrammarDefinition,
    OptMulGrammarDefinition,
    OrGrammarDefinition,
    SequenceGrammarDefinition
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

