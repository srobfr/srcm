import {defaultsMap, getDefault, GrammarDefinition, ObjectGrammarDefinition} from "..";
import {isOptMulGrammarDefinition} from "../grammar/GrammarDefinitions";
import Parser from "../parser/Parser";
import {Node} from "./Node";

const parser = new Parser();

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

        console.debug({subDef, $prev: ($prev?.xml()), $found: ($found?.xml())});

        // TODO
    }
}
