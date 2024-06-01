import DomBuilder from "./dom/DomBuilder.ts";
import GrammarDefinitionHelper from "./grammar/GrammarDefinitionHelper.ts";
import GrammarAnalyzer from "./parser/GrammarAnalyzer.ts";
import Parser from "./parser/Parser.ts";
import { RuntimeAdapter } from "./runtimes/types.ts";

export default function ioc(runtimeAdapter: RuntimeAdapter) {
  const grammarDefinitionHelper = new GrammarDefinitionHelper(runtimeAdapter);
  const grammarAnalyzer = new GrammarAnalyzer(runtimeAdapter);
  const domBuilder = new DomBuilder();
  const parser = new Parser(runtimeAdapter, grammarAnalyzer, domBuilder);

  const g = grammarDefinitionHelper.g;
  const parse = parser.parse;

  return { g, parse };
}
