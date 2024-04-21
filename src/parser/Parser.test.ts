import GrammarDefinitionHelper from "../grammar/GrammarDefinitionHelper.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarAnalyzer from "./GrammarAnalyzer.ts";
import Parser from "./Parser.ts";

const runtime = new DenoRuntimeAdapter();
const grammarAnalyzer = new GrammarAnalyzer(runtime);
const { g } = new GrammarDefinitionHelper(runtime);
const { parse } = new Parser(runtime, grammarAnalyzer);

Deno.test("Parsing simple grammar", () => {
  const foo = g("Foo", { id: "foo" });

  const r = parse(`Foo`, foo);
  console.log(r);
});
