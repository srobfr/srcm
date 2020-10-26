export type StringGrammarDefinition = string;

export function isStringGrammarDefinition(g: GrammarDefinition): g is StringGrammarDefinition {
    return typeof (g as StringGrammarDefinition) === 'string';
}

export interface TaggableGrammarDefinition {
    tag?: string,
}

export interface RegExpGrammarDefinition extends RegExp, TaggableGrammarDefinition {
}

export function isRegExpGrammarDefinition(g: GrammarDefinition): g is RegExpGrammarDefinition {
    return (g as RegExpGrammarDefinition) instanceof RegExp;
}

export type TerminalGrammarDefinition = StringGrammarDefinition | RegExpGrammarDefinition;

export function isTerminalGrammarDefinition(g: GrammarDefinition): g is TerminalGrammarDefinition {
    return (isStringGrammarDefinition(g) || isRegExpGrammarDefinition(g));
}

export interface SequenceGrammarDefinition extends Array<GrammarDefinition>, TaggableGrammarDefinition {
}

export function isSequenceGrammarDefinition(g: GrammarDefinition): g is SequenceGrammarDefinition {
    return Array.isArray(g as SequenceGrammarDefinition);
}

export interface OrGrammarDefinition extends TaggableGrammarDefinition {
    or: Array<GrammarDefinition>,
}

export function isOrGrammarDefinition(g: GrammarDefinition): g is OrGrammarDefinition {
    return !!(g as OrGrammarDefinition).or;
}

export interface OptionalGrammarDefinition extends TaggableGrammarDefinition {
    optional: GrammarDefinition,
}

export function isOptionalGrammarDefinition(g: GrammarDefinition): g is OptionalGrammarDefinition {
    return !!(g as OptionalGrammarDefinition).optional;
}

export interface MultipleGrammarDefinition extends TaggableGrammarDefinition {
    multiple: GrammarDefinition,
    sep?: GrammarDefinition,
}

export function isMultipleGrammarDefinition(g: GrammarDefinition): g is MultipleGrammarDefinition {
    return !!(g as MultipleGrammarDefinition).multiple;
}

export interface OptMulGrammarDefinition extends TaggableGrammarDefinition {
    optmul: GrammarDefinition,
    sep?: GrammarDefinition,
}

export function isOptMulGrammarDefinition(g: GrammarDefinition): g is OptMulGrammarDefinition {
    return !!(g as OptMulGrammarDefinition).optmul;
}

export type ObjectGrammarDefinition =
    RegExpGrammarDefinition
    | SequenceGrammarDefinition
    | OrGrammarDefinition
    | OptionalGrammarDefinition
    | MultipleGrammarDefinition
    | OptMulGrammarDefinition;

export type GrammarDefinition =
    StringGrammarDefinition
    | ObjectGrammarDefinition;
