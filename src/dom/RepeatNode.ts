// deno-lint-ignore-file
import { isRepeatGrammar } from "../deno-mod.ts";
import { RepeatGrammar } from "../grammar/GrammarTypes.ts";
import { INode } from "./Node.ts";
import { SearchableNode } from "./SearchableNode.ts";

/** Provides remove & insertion features to repeat nodes */
export class RepeatNode extends SearchableNode {
  /** Converts a node to an arbitrary string, used for ordering items. */
  order($: INode): string {
    if (this.grammar.order) return this.grammar.order($);
    return $.text();
  }

  /** The comparison function, allowing to order items */
  compare($a: INode, $b: INode): number {
    return this.order($a).localeCompare(this.order($b));
  }

  /**
   * Builds a separator node, used when using insert() when the inserted node
   * is going to be inserted between two existing nodes in a list.
   */
  buildSeparatorNode($prev: INode, $next: INode): INode | null {
    const sep = (this.grammar as RepeatGrammar).sep ?? (($prev ?? $next).parent?.grammar as RepeatGrammar).sep;
    if (sep === undefined) {
      // No separator grammar found
      return null;
    }

    const separatorDefault = sep?.default?.() ?? "";
    try {
      return this.parse(separatorDefault, sep);
    } catch (err) {
      if (err.name === "SyntaxError") {
        throw new Error(`Separator grammar ${sep} does not match its default "${separatorDefault}"`, {
          cause: err,
        });
      }

      throw err;
    }
  }

  insert($item: INode) {
    // Find the others items with the same grammar
    const $items = this.findByGrammar($item.grammar);
    if ($items.length === 0) {
      // The list is empty
      this.text($item.text());
      this.findFirst($ => $.grammar === $item.grammar && $.text() === $item.text())?.replaceWith($item);
    }

    else {
      // Find the item before which to insert this one
      const $nextItem = $items.find($ => this.compare($item, $) < 0);
      if ($nextItem) {
        $nextItem.before($item);
        const $separator = this.buildSeparatorNode($item, $nextItem);
        if ($separator) $nextItem.before($separator);
      }
      else {
        // Last of the list
        const $lastItem = $items[$items.length - 1];
        const $separator = this.buildSeparatorNode($lastItem, $item);
        $lastItem.after($item);
        if ($separator) $lastItem.after($separator);
      }
    }
  }

  removeWithSep() {
    if (isRepeatGrammar(this.parent?.grammar)) {
      if (this.prev?.grammar && this.prev.grammar === this.parent.grammar.sep) this.prev.remove();
      else if (this.next?.grammar && this.next.grammar === this.parent.grammar.sep) this.next.remove();
    }

    this.remove();
  }
}
