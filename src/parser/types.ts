import {Grammar} from "../grammar/GrammarTypes.ts";

export const enum ActionType { SHIFT = "shift", REDUCE = "reduce", ACCEPT = "accept" }

export type Action = { type: ActionType, grammar: Grammar | null, precedence?: number, rightToLeft?: boolean };

export type Context = {
  grammar: Grammar | null;
  offset: number;
  matchedCharsCount: number;
  previous: Context | null;
  children?: Array<Context>;
};

export type ParseError = {
  context: Context,
  action: Action,
};
