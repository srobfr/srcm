import {Node} from "./dom/Node";
import {GrammarDefinition, ObjectGrammarDefinition} from "./grammar/GrammarDefinitions";
import Parser from "./parser/Parser";

export * from './grammar/GrammarDefinitions';
export * from './grammar/grammarDefinitionsHelpers';
export * from './codemod/codemod';
export * from './dom/search';
export * from './dom/Node';

export const parse = (grammar: GrammarDefinition, code: string) => new Parser().parse(grammar, code);

export type ApplyFunctionDef = ($: Node, def: any) => void;
export const applyMap = new WeakMap<ObjectGrammarDefinition, ApplyFunctionDef>();
export const defaultsMap = new WeakMap<ObjectGrammarDefinition, string>();
