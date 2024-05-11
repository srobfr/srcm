
import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import GrammarDefinitionHelper from "../grammar/GrammarDefinitionHelper.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarAnalyzer from "./GrammarAnalyzer.ts";

function ioc() {
  const runtime = new DenoRuntimeAdapter();
  const { g } = new GrammarDefinitionHelper(runtime);
  const analyzer = new GrammarAnalyzer(runtime);

  return { runtime, g, analyzer };
}

Deno.test("GrammarAnalyzer / Simple Grammar", () => {
  const { g, analyzer } = ioc();

  const foo = g`F${g`o`}o`;

  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(foo);

  assertEquals(nextPossibleActionsByLastGrammar.get(null)?.size, 1);
  assertEquals(nextPossibleActionsByLastGrammar.get(foo)?.size, 1);
});

Deno.test("GrammarAnalyzer / Sequence", () => {
  const { runtime, g, analyzer } = ioc();

  const grammar = g(["a", "b"]);
  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
  assertEquals(nextPossibleActionsByLastGrammar.get(null)?.size, 1);
  assertEquals(nextPossibleActionsByLastGrammar.get(grammar)?.values().next().value.type, "accept");
  console.log(runtime.inspect(nextPossibleActionsByLastGrammar)); // SROB
});

Deno.test("GrammarAnalyzer / Operator", () => {
  const { runtime, g, analyzer } = ioc();

  const expr = g({ or: [] }, {id: "expr"});
  const number = g(/^\d+/, {id: "number"});
  const addition = g([expr, "+", expr], { id: "add", precedence: 1 });
  const multiplication = g([expr, "*", expr], { id: "mul", precedence: 2 });
  expr.value.push(multiplication, addition, number);

  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(expr);

  console.log(runtime.inspect(nextPossibleActionsByLastGrammar)); // SROB
});
