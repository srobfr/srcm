import { Context } from "../parser/types.ts";
import { Parser } from "../parser/Parser.ts";
import { Node } from "./Node.ts";
import { BaseNode } from "./BaseNode.ts";

export class DomBuilder {

  /** Builds a pseudo-DOM tree from the given parsing context */
  public build(context: Context, parse: Parser["parse"], code: string): Node {
    const walk = (context: Context): Node => {
      const textContent = context.children ? null : code.substring(context.offset, context.offset + context.matchedCharsCount);

      const nodeClass = context.grammar?.nodeClass ?? Node;
      if (nodeClass !== Node && !(nodeClass.prototype instanceof BaseNode)) throw new Error(`nodeClass ${nodeClass} should extend BaseNode`);

      const $ = new nodeClass(context.grammar!, null, null, null, [], textContent, parse);

      for (const $$ of (context.children ?? []).map(walk)) $.append($$);

      return $;
    };

    return walk(context);
  }
}
