// deno-lint-ignore-file
import { Grammar } from "../grammar/GrammarTypes.ts";
import { INode } from "./Node.ts";
import { SearchableNode } from "./SearchableNode.ts";

/** Provides remove & insertion features to a list node */
export class RepeatNode extends SearchableNode {

  separator?: Grammar = undefined;

  /** Converts a node to an arbitrary string, used for ordering items. */
  orderFn($: INode): string {
    return $.text();
  }

  /** The comparison function, allowing to order items */
  compare($a: INode, $b: INode): number {
    return this.orderFn($a).localeCompare(this.orderFn($b));
  }

  insert($item: INode) {
    const buildSeparatorNode = ($prev: INode, $next: INode) => {
      if (!this.separator) return null;
      return this.parse(this.separator.default?.() ?? "", this.separator);
    };

    // First, find the others items with the same grammar
    const $items = this.findByGrammar($item.grammar);
    if ($items.length === 0) {
      // The list is empty : just append the item
      this.append($item);
    } else {
      // Find the item before which to insert this one
      const $nextItem = $items.find($ => this.compare($item, $) < 0);
      if ($nextItem) {
        $nextItem.before($item);
        const $separator = buildSeparatorNode($item, $nextItem);
        if ($separator) $nextItem.before($separator);
      }
      else {
        // Last of the list
        const $separator = buildSeparatorNode($items[$items.length - 1], $item);
        if ($separator) this.append($separator);
        this.append($item);
      }
    }

    // This insertion logics does not care about the various way to make a repeating pattern while manipulating the DOM.
    // At this point the dom is probably broken so we'll just re-parse it.
    // Please note that it'll break the elements references under this node though, so you'll probably need to find() them again.
    this.text(this.text());
  }
}
