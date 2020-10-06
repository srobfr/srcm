import {GrammarDefinition} from "./src/grammar/GrammarDefinitions";
import Parser from "./src/parser/Parser";

export * from './src/grammar/grammarDefinitionsHelpers';
export * from './src/codemod/codemod';

export const parse = (grammar: GrammarDefinition, code: string) => new Parser().parse(grammar, code);

