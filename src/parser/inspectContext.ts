import { isTerminalGrammar } from "../grammar/GrammarTypes.ts";
import { Context } from "./types.ts";

/** Utility for context inspection */
export default function inspectContext(context: Context, code: string) {
  function getText(context: Context): string {
    const content = isTerminalGrammar(context.grammar)
      ? code.substring(context.offset, context.offset + context.matchedCharsCount)
      : (context.children ?? []).map(context => getText(context)).join("");
    const wrappedContent = context.grammar?.id ? `<${context.grammar?.id}>${content}</${context.grammar?.id}>` : content;
    return wrappedContent;
  }

  const parts: Array<string> = [];
  let c: Context | null = context;
  while (c?.grammar) {
    parts.unshift(getText(c));
    c = c.previous;
  }

  parts.push("|" + code.substring(context.offset + context.matchedCharsCount));

  return parts.join("");
}
