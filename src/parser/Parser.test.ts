import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import DomBuilder from "../dom/DomBuilder.ts";
import GrammarDefinitionHelper, { OrGrammarDef } from "../grammar/GrammarDefinitionHelper.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarAnalyzer from "./GrammarAnalyzer.ts";
import Parser from "./Parser.ts";
import { ChoiceGrammar } from "../grammar/GrammarTypes.ts";

const runtimeAdapter = new DenoRuntimeAdapter();
const grammarDefinitionHelper = new GrammarDefinitionHelper(runtimeAdapter);
const grammarAnalyzer = new GrammarAnalyzer(runtimeAdapter);
const domBuilder = new DomBuilder();
const parser = new Parser(runtimeAdapter, grammarAnalyzer, domBuilder);
const g = grammarDefinitionHelper.g
const parse = parser.parse;

Deno.test("Parser", async (t) => {
  await t.step("Simple grammar", () => {
    const o = g("o", { id: "o" });
    const foo = g`F${o}${o}`;
    foo.id = "foo";

    const $ = parse(`Foo`, foo);
    assertEquals($.xml(), "<foo>F<o>o</o><o>o</o></foo>");
    assertEquals($.text(), "Foo");
  });

  await t.step("Operators", () => {
    const expr: ChoiceGrammar = g({ or: [] }) as ChoiceGrammar;
    const number = g(/^\d+/);
    const addition = g([expr, "+", expr], { id: "add", precedence: 1 });
    const multiplication = g([expr, "*", expr], { id: "mul", precedence: 2 });
    expr.value.push(multiplication, addition, number);
    {
      const $ = parse("1+2", expr);
      assertEquals($.xml(), "<add>1+2</add>");
    }
    {
      const $ = parse("1*2+3+4", expr);
      assertEquals($.xml(), "<add>1+2</add>");
    }
  });
});
