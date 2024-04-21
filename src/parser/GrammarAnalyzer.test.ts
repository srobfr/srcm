
import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import GrammarDefinitionHelper from "../grammar/GrammarDefinitionHelper.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarAnalyzer from "./GrammarAnalyzer.ts";

const runtime = new DenoRuntimeAdapter();

Deno.test("Grammar analysis", () => {
  const { g } = new GrammarDefinitionHelper(runtime);
  const analyzer = new GrammarAnalyzer(runtime);

  const foo = g("Foo");

  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(foo);

  assertEquals(nextPossibleActionsByLastGrammar.get(null)?.size, 1);
  assertEquals(nextPossibleActionsByLastGrammar.get(foo)?.size, 1);
});
