import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
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

Deno.test({
  name: "Parser / Simple grammar", fn() {
    const o = g("o", { id: "o" });
    const foo = g`F${o}${o}`;
    foo.id = "foo";

    const $ = parse(`Foo`, foo);
    assertEquals($.xml(), "<foo>F<o>o</o><o>o</o></foo>");
    assertEquals($.text(), "Foo");
  }
});

Deno.test({
  name: "Parser / Operators & precedence parsing", fn() {
    const expr = g({ or: [] }); // TODO Migrate to g.or()
    const number = g(/^\d+/);
    const addition = g([expr, "+", expr], { id: "add", precedence: 1 });
    const subtraction = g([expr, "-", expr], { id: "sub", precedence: 1 });
    const multiplication = g([expr, "*", expr], { id: "mul", precedence: 2 });
    const division = g([expr, "/", expr], { id: "div", precedence: 2 });
    const exponentiation = g([expr, "^", expr], { id: "exp", rightToLeft: true, precedence: 3 });
    expr.value.push(multiplication, division, addition, subtraction, exponentiation, number);

    for (const [code, xml] of [
      ["1+2*3", "<add>1+<mul>2*3</mul></add>"],
      ["1*2+3", "<add><mul>1*2</mul>+3</add>"],
      ["1+2+3", "<add><add>1+2</add>+3</add>"],
      ["1-2+3", "<add><sub>1-2</sub>+3</add>"],
      ["1^2^3", "<exp>1^<exp>2^3</exp></exp>"],
      ["1^2/3^4", "<div><exp>1^2</exp>/<exp>3^4</exp></div>"],
    ]) {
      const $ = parse(code, expr);
      assertEquals(`${code} => ${$.xml()}`, `${code} => ${xml}`);
    }
  }
});
