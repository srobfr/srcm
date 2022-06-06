import {inspect} from 'util';
import {Node} from "./dom/Node";
import {GrammarDefinition, ObjectGrammarDefinition} from "./grammar/GrammarDefinitions";
import Parser from "./parser/Parser";

export * from './grammar/GrammarDefinitions';
export * from './grammar/grammarDefinitionsHelpers';
export * from './codemod/codemod';
export * from './dom/search';
export * from './dom/Node';
export * from './dom/codemod';

export const parse = (grammar: GrammarDefinition, code: string) => new Parser().parse(grammar, code);

export type ApplyFunctionDef = ($: Node, def: any) => void;
export const applyMap = new WeakMap<ObjectGrammarDefinition, ApplyFunctionDef>();
export const defaultsMap = new WeakMap<ObjectGrammarDefinition, string>();
export function getDefault(grammar: GrammarDefinition): string {
    if (typeof grammar === 'string') return grammar;
    if (defaultsMap.has(grammar)) return defaultsMap.get(grammar);
    if (Array.isArray(grammar)) return grammar.map(g => getDefault(g)).join('');
    throw new Error(`No default provided for grammar ${inspect(grammar)}`);
}
