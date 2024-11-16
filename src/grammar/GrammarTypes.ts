import type { INode, Node } from "../dom/Node.ts";
import { stableInspect } from "../utils/inspect.ts";

export type GrammarBase = {
  /** Simplifies the grammar node identification, for example for debugging */
  id?: string;

  /**
   * Allows to manage precedence between grammars (higher value will be shifted/reduced first).
   * For exemple, multiplication should have a higher precedence than addition : (1 + (2 * 3))
   */
  precedence?: number;

  /**
   * Allows to manage precedence between two occurrences of this grammar.
   * Default is false (reduce first, then shift).
   * For exemple, a power operator (^) should be parsed right to left : (1 ^ (2 ^ 3))
   * while an addition operator should be parsed left to right : ((1 + 2) + 3)
   */
  rightToLeft?: boolean;

  /** Custom node class. Must extend Node. */
  nodeClass?: new (...args: Array<any>) => Node;

  /** Default text for this grammar */
  default?: () => string;

  /**
   * Defines an ordering value when inserting a new node using $.insert().
   * The default is by alphabetic order on the full node text : $ => $.text()
   */
  order?: ($: INode) => string;

  /**
   * Defines an ordering by comparing two nodes.
   * Used when inserting a new node using $.insert().
   * The default uses the order() function on each node and compares their results using localeCompare().
   */
  compare?: ($a: INode, $b: INode) => number;
};

// Terminal grammar types
export type StringGrammar = { type: "string", value: string } & GrammarBase;
export const isStringGrammar = (value: any): value is StringGrammar => value?.type === "string";
export type RegExpGrammar = { type: "regexp", value: RegExp } & GrammarBase;
export const isRegExpGrammar = (value: any): value is RegExpGrammar => value?.type === "regexp";

export type TerminalGrammar = (StringGrammar) | (RegExpGrammar);
export const isTerminalGrammar = (value: any): value is TerminalGrammar => isStringGrammar(value) || isRegExpGrammar(value);

// Non-terminal grammar types
export type SequenceGrammar = { type: "sequence", value: Grammar[] } & GrammarBase;
export const isSequenceGrammar = (value: any): value is SequenceGrammar => value?.type === "sequence";
export type ChoiceGrammar = { type: "choice", value: Grammar[] } & GrammarBase;
export const isChoiceGrammar = (value: any): value is ChoiceGrammar => value?.type === "choice";

export type RepeatGrammar = { type: "repeat", value: Grammar, sep?: Grammar } & GrammarBase;
export const isRepeatGrammar = (value: any): value is RepeatGrammar => value?.type === "repeat";
export type OptionalGrammar = { type: "optional", value: Grammar } & GrammarBase;
export const isOptionalGrammar = (value: any): value is OptionalGrammar => value?.type === "optional";

export type TerminalOrOptionalGrammar = TerminalGrammar | OptionalGrammar;
export const isTerminalOrOptionalGrammar = (value: any): value is TerminalOrOptionalGrammar => isTerminalGrammar(value) || isOptionalGrammar(value);

export type NonTerminalGrammar = SequenceGrammar | ChoiceGrammar | RepeatGrammar | OptionalGrammar;
export const isNonTerminalGrammar = (value: any): value is NonTerminalGrammar => isSequenceGrammar(value) || isChoiceGrammar(value) || isRepeatGrammar(value) || isOptionalGrammar(value);

export type Grammar = (TerminalGrammar | NonTerminalGrammar);
export const isGrammar = (value: any): value is Grammar => isTerminalGrammar(value) || isNonTerminalGrammar(value);

export function inspectGrammar(grammar: Grammar | null): string {
  return grammar === null ? "<EOF>"
    : grammar.id ? `<${grammar.id}>`
      : stableInspect(grammar.value);
}
