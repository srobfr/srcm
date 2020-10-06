import {
    GrammarDefinition, isStringGrammarDefinition,
    MultipleGrammarDefinition,
    OptionalGrammarDefinition, OptMulGrammarDefinition,
    OrGrammarDefinition, SequenceGrammarDefinition, TaggableGrammarDefinition
} from "./GrammarDefinitions";

export const or = (...defs: Array<GrammarDefinition>): OrGrammarDefinition => ({or: defs});
export const optional = (def: GrammarDefinition): OptionalGrammarDefinition => ({optional: def});
export const multiple = (def: GrammarDefinition): MultipleGrammarDefinition => ({multiple: def});
export const optmul = (def: GrammarDefinition): OptMulGrammarDefinition => ({optmul: def});

export const tag = (tagName: string, def: GrammarDefinition) => (
    isStringGrammarDefinition(def) ? tag(tagName, ([def] as SequenceGrammarDefinition)) : ((def as TaggableGrammarDefinition).tag = tagName, def)
);

