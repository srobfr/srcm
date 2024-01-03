
import { GrammarDefinition } from '../grammar/GrammarDefinitions';
import Parser from '../parser/Parser';
export const parse = (grammar: GrammarDefinition, code: string) => new Parser().parse(grammar, code);

