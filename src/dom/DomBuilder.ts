import type { Parser } from "../parser/Parser.ts";
import type { Context } from "../parser/types.ts";
import { Node } from "./Node.ts";

export class DomBuilder {

  /** Builds a pseudo-DOM tree from the given parsing context */
  public build(context: Context, parse: Parser["parse"], code: string): Node {
    const walk = (context: Context): Node => {
      const textContent = context.children ? null : code.substring(context.offset, context.offset + context.matchedCharsCount);

      const nodeClass = (context.grammar?.originalGrammar ?? context.grammar)?.nodeClass ?? Node;
      if (nodeClass !== Node && !(nodeClass.prototype instanceof Node)) throw new Error(`nodeClass ${nodeClass} should extend Node`);

      const $ = new nodeClass((context.grammar?.originalGrammar ?? context.grammar)!, null, null, null, [], textContent, parse);

      for (const $$ of (context.children ?? []).map(walk)) $.append($$);

      return $;
    };

    return walk(context);
  }
}
