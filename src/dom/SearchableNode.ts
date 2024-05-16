// deno-lint-ignore-file
import { Grammar } from "../grammar/GrammarTypes.ts";
import stableInspect from "../utils/inspect.ts";
import BaseNode from "./BaseNode.ts";
import { INode } from "./Node.ts";

/** Provides searching features to the node */
export default class SearchableNode extends BaseNode {

  findFirstByGrammar(grammar: Grammar): INode | null {
    const $$: Array<INode> = [this];
    while ($$.length > 0) {
      const $ = $$.shift();
      if (!$) break;
      if ($.grammar === grammar) return $;
      else $$.push(...$.children);
    }
    return null;
  }

  findByGrammar(grammar: Grammar): Array<INode> {
    const $$: Array<INode> = [this];
    const $results = [];
    while ($$.length > 0) {
      const $ = $$.shift();
      if (!$) break;
      if ($.grammar === grammar) $results.push($);
      else $$.push(...$.children);
    }
    return $results;
  }

  findFirstByPath(path: Array<Grammar>): INode | null {
    let $$: INode | null = this;
    for (const g of path) {
      $$ = $$.findFirstByGrammar(g);
      if (!$$) return null;
    }
    return $$
  }

  findByPath(path: Array<Grammar>): Array<INode> {
    let $$: Array<INode> = [this];
    for (const g of path) {
      const next$$ = [];
      for (const $ of $$) next$$.push(...$.findByGrammar(g));
      $$ = next$$;
    }
    return $$;
  }
}
