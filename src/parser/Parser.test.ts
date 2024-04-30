import DomBuilder from "../dom/DomBuilder.ts";
import GrammarDefinitionHelper from "../grammar/GrammarDefinitionHelper.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarAnalyzer from "./GrammarAnalyzer.ts";
import Parser from "./Parser.ts";

const runtimeAdapter = new DenoRuntimeAdapter();
const grammarDefinitionHelper = new GrammarDefinitionHelper(runtimeAdapter);
const grammarAnalyzer = new GrammarAnalyzer(runtimeAdapter);
const domBuilder = new DomBuilder();
const parser = new Parser(runtimeAdapter, grammarAnalyzer, domBuilder);
const g = grammarDefinitionHelper.g
const parse = parser.parse;

Deno.test("Parsing simple grammar", async (t) => {

  await t.step("wip", () => {
    const foo = g("Foo", { id: "foo" });

    const $ = parse(`Foo`, foo);
    console.log({ $ }); // SROB
  });
});
