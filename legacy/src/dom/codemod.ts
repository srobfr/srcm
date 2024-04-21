import {getDefault} from "..";
import {isOptionalGrammarDefinition, isOptMulGrammarDefinition} from "../grammar/GrammarDefinitions";
import Parser from "../parser/Parser";
import {Node} from "./Node";

/**
 * Helper to apply a definition to an optmul node
 * @param $ The root node, using a optmul() grammar
 * @param def The definition to apply
 * @param compare Nodes comparison function which allows to find the existing node or decide where to insert the new node.
 */
export function optmulApply<defT extends Array<{delete?: boolean}>>(
    $: Node,
    def: defT,
    compare: ($$: Node, subDef: defT[number]) => number
) {
    if (!isOptMulGrammarDefinition($.grammar)) throw new Error(`Not a optmul grammar definition : ${$.grammar}`);

    const subGrammar = $.grammar.optmul;

    for (const subDef of def) {
        // Find the previous or existing node using comparison function
        let $prev = null, $found = null, foundGreater = false;
        for (const $$ of $.children) {
            if ($$.grammar !== subGrammar) continue; // Skip separators

            const delta = compare($$, subDef);
            if (delta < 0 && !foundGreater) $prev = $$;
            if (delta === 0) {
                $found = $$;
                break;
            }
            if (delta > 0) foundGreater = true;
        }

        if (subDef.delete) {
            if ($found) {
                // Delete
                if ($.grammar.sep) {
                    if ($found.prev) $found.prev.remove(); // Remove previous separator (if any)
                    else if ($found.next) $found.next.remove(); // Or remove next separator (if any)
                }
                $found.remove();
            }

            continue;
        }

        if ($found) {
            // Update
            $found.apply(subDef);

            continue;
        }

        // Create
        const parser = new Parser();
        const $node = parser.parse(subGrammar, getDefault(subGrammar));
        $node.apply(subDef);

        const $sep = ($.grammar.sep && $.children.length > 0 ? parser.parse($.grammar.sep, getDefault($.grammar.sep)) : null);

        if (!$prev) {
            // Insert in first position
            if ($sep) $.prepend($sep);
            $.prepend($node);
        } else {
            // Insert after $prev
            $prev.after($node);
            if ($sep) $prev.after($sep);
        }
    }
}

/**
 * Helper to apply a definition to an optional node
 * @param $ The root node, using a optional() grammar
 * @param def The definition to apply
 */
export function optionalApply<defT extends {delete?: boolean} | null>(
    $: Node,
    def: defT
) {
    if (!isOptionalGrammarDefinition($.grammar)) throw new Error(`Not an opional grammar definition : ${$.grammar}`);
    if (def === null || def.delete) $.text('');
    else {
        if ($.children.length === 0) $.text(getDefault($.grammar.optional))
        $.children[0].apply(def);
    }
}
