export type GrammarBase = {
  /** Simplifies the grammar node identification, for example for debugging */
  id?: string;
  /** Allows to manage precedence between grammars (higher value will be shifted/reduced first) */
  precedence?: number;
  /** Allows to manage precedence between two occurrences of this grammar. Default is false (reduce first, then shift) */
  rightToLeft?: boolean;
};

// Terminal grammar types
export type StringGrammar = { type: "string", value: string };
export const isStringGrammar = (value: any): value is StringGrammar => value?.type === "string";
export type RegExpGrammar = { type: "regexp", value: RegExp };
export const isRegExpGrammar = (value: any): value is RegExpGrammar => value?.type === "regexp";
export type TerminalGrammar = StringGrammar | RegExpGrammar;
export const isTerminalGrammar = (value: any): value is TerminalGrammar => isStringGrammar(value) || isRegExpGrammar(value);

// Non-terminal grammar types
export type SequenceGrammar = { type: "sequence", value: Grammar[] };
export const isSequenceGrammar = (value: any): value is SequenceGrammar => value?.type === "sequence";
export type ChoiceGrammar = { type: "choice", value: Grammar[] };
export const isChoiceGrammar = (value: any): value is ChoiceGrammar => value?.type === "choice";
export type RepeatGrammar = { type: "repeat", value: Grammar, sep?: Grammar };
export const isRepeatGrammar = (value: any): value is RepeatGrammar => value?.type === "repeat";
export type OptionalGrammar = { type: "optional", value: Grammar };
export const isOptionalGrammar = (value: any): value is OptionalGrammar => value?.type === "optional";
export type NonTerminalGrammar = SequenceGrammar | ChoiceGrammar | RepeatGrammar | OptionalGrammar;
export const isNonTerminalGrammar = (value: any): value is NonTerminalGrammar => isSequenceGrammar(value) || isChoiceGrammar(value) || isRepeatGrammar(value) || isOptionalGrammar(value);

export type Grammar = (TerminalGrammar | NonTerminalGrammar) & GrammarBase;
export const isGrammar = (value: any): value is Grammar => isTerminalGrammar(value) || isNonTerminalGrammar(value);