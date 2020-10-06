import {GrammarDefinition} from "./grammar/GrammarDefinitions";
import Parser from "./parser/Parser";

export * from './grammar/grammarDefinitionsHelpers';
export * from './codemod/codemod';

export const parse = (grammar: GrammarDefinition, code: string) => new Parser().parse(grammar, code);

