import { inspect } from "util";
import { GrammarDefinition, ObjectGrammarDefinition } from "../grammar/GrammarDefinitions";
import { Node } from "../dom/Node";

export type ApplyFunctionDef = ($: Node, def: any) => void;
export const applyMap = new WeakMap<ObjectGrammarDefinition, ApplyFunctionDef>();
export const defaultsMap = new WeakMap<ObjectGrammarDefinition, string>();
export function getDefault(grammar: GrammarDefinition): string {
    if (typeof grammar === 'string') return grammar;
    if (defaultsMap.has(grammar)) return defaultsMap.get(grammar);
    if (Array.isArray(grammar)) return grammar.map(g => getDefault(g)).join('');
    throw new Error(`No default provided for grammar ${inspect(grammar)}`);
}
