import DomBuilder from "./dom/DomBuilder.ts";
import type { INode } from "./dom/Node.ts";
import GrammarDefinitionHelper, { G } from "./grammar/GrammarDefinitionHelper.ts";
import type { Grammar } from "./grammar/GrammarTypes.ts";
import GrammarAnalyzer from "./parser/GrammarAnalyzer.ts";
import Parser from "./parser/Parser.ts";
import type { RuntimeAdapter } from "./runtimes/types.ts";

export default function ioc(runtimeAdapter: RuntimeAdapter): {
  g: G;
  parse: (code: string, grammar: Grammar) => INode;
} {
  const grammarDefinitionHelper = new GrammarDefinitionHelper(runtimeAdapter);
  const grammarAnalyzer = new GrammarAnalyzer(runtimeAdapter);
  const domBuilder = new DomBuilder();
  const parser = new Parser(runtimeAdapter, grammarAnalyzer, domBuilder);

  const g = grammarDefinitionHelper.g;
  const parse = parser.parse;

  return { g, parse };
}
