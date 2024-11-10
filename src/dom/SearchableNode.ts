// deno-lint-ignore-file
import { Grammar } from "../grammar/GrammarTypes.ts";
import stableInspect from "../utils/inspect.ts";
import BaseNode from "./BaseNode.ts";
import { INode } from "./Node.ts";

/** Provides searching features to the node */
export default class SearchableNode extends BaseNode {

  findFirst(func: ($: INode) => boolean): INode | null {
    const $$: Array<INode> = [this];
    while ($$.length > 0) {
      const $ = $$.shift();
      if (!$) break;
      if (func($)) return $;
      else $$.push(...$.children);
    }
    return null;
  }

  findFirstByGrammar(grammar: Grammar): INode | null {
    return this.findFirst($ => $.grammar === grammar);
  }

  find(func: ($: INode) => boolean): Array<INode> {
    const $$: Array<INode> = [this];
    const $results = [];
    while ($$.length > 0) {
      const $ = $$.shift();
      if (!$) break;
      if (func($)) $results.push($);
      else $$.push(...$.children);
    }
    return $results;
  }

  findByGrammar(grammar: Grammar): Array<INode> {
    return this.find($ => $.grammar === grammar);
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
