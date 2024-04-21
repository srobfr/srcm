import {GrammarDefinition, ObjectGrammarDefinition} from "..";
import {Node} from "./Node";

export type DefaultTextsByGrammar = WeakMap<ObjectGrammarDefinition, string>;

export function findFirstByGrammar($: Node, grammar: GrammarDefinition): Node | null {
    if ($.grammar === grammar) return $;
    const $$ = [...$.children];
    while ($$.length > 0) {
        const $ = $$.shift();
        if ($.grammar === grammar) return $;
        $$.push(...$.children);
    }
    return null;
}

export function findByGrammar($: Node, grammar: GrammarDefinition): Array<Node> {
    if ($.grammar === grammar) return [$];
    const $$ = [...$.children];
    const $results = [];
    while ($$.length > 0) {
        const $ = $$.shift();
        if ($.grammar === grammar) $results.push($);
        else $$.push(...$.children);
    }
    return $results;
}

export function findOrCreateByPath($: Node, path: Array<GrammarDefinition>, defaultsByGrammar: DefaultTextsByGrammar): Node {
    let $$ = $;
    for (const g of path) {
        const previous$$ = $$;
        $$ = findFirstByGrammar($$, g);
        if (!$$) {
            previous$$.text(defaultsByGrammar.get(previous$$.grammar as ObjectGrammarDefinition));
            $$ = findFirstByGrammar(previous$$, g);
        }
    }
    return $$
}

export function findFirstByPath($: Node, path: Array<GrammarDefinition>): Node | null {
    let $$ = $;
    for (const g of path) {
        $$ = findFirstByGrammar($$, g);
        if (!$$) return null;
    }
    return $$
}

export function findByPath($: Node, path: Array<GrammarDefinition>): Array<Node> {
    let $$ = [$];
    for (const g of path) {
        const next$$ = [];
        for (const $ of $$) next$$.push(...findByGrammar($, g));
        $$ = next$$;
    }
    return $$;
}
