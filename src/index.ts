import DenoRuntimeAdapter from "./runtimes/DenoRuntimeAdapter.ts";
import GrammarDefinitionHelper from "./grammar/GrammarDefinitionHelper.ts";
import Parser from "./parser/Parser.ts";
import GrammarAnalyzer from "./parser/GrammarAnalyzer.ts";
import DomBuilder from "./dom/DomBuilder.ts";

const runtimeAdapter = new DenoRuntimeAdapter();

const grammarDefinitionHelper = new GrammarDefinitionHelper(runtimeAdapter);
const grammarAnalyzer = new GrammarAnalyzer(runtimeAdapter);
const domBuilder = new DomBuilder();
const parser = new Parser(runtimeAdapter, grammarAnalyzer, domBuilder);

export const g = grammarDefinitionHelper.g
export const parse = parser.parse;
