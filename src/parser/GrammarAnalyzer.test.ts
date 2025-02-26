
import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import { GrammarDefinitionHelper } from "../grammar/GrammarDefinitionHelper.ts";
import { DenoRuntimeAdapter } from "../runtimes/DenoRuntimeAdapter.ts";
import { GrammarAnalyzer } from "./GrammarAnalyzer.ts";
import { stableInspect } from "../utils/inspect.ts";
import type { SequenceGrammar } from "../grammar/GrammarTypes.ts";
import { assertThrows } from "https://deno.land/std@0.223.0/assert/assert_throws.ts";

const runtime = new DenoRuntimeAdapter();
const { g } = new GrammarDefinitionHelper(runtime);
const analyzer = new GrammarAnalyzer(runtime);

Deno.test("GrammarAnalyzer / Simple Grammar", () => {
  const foo = g("Foo");
  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(foo);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref0"}],"<{\\"type\\":\\"string\\",\\"value\\":\\"Foo\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"Foo\\"}}>":[{"type":"accept","grammar":null}]}`);
});

Deno.test("GrammarAnalyzer / Sequence", () => {
  const grammar = g(["a", "b"]);
  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref11"}],"<{\\"type\\":\\"sequence\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"a\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"a\\"}},{\\"type\\":\\"string\\",\\"value\\":\\"b\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"b\\"}}],\\"originalGrammar\\":{\\"type\\":\\"sequence\\",\\"value\\":[\\"#ref3\\",\\"#ref5\\"]}}>":[{"type":"accept","grammar":null}],"<\\"#ref4\\">":[{"type":"reduce","grammar":"#ref0"}],"<\\"#ref2\\">":[{"type":"shift","grammar":"#ref10"}]}`);
});

Deno.test("GrammarAnalyzer / Operator", () => {
  const expr = g.or(["foo"], { id: "expr" });
  const number = g(/^\d+/, { id: "number" });
  const addition = g([expr, "+", expr], { id: "add", precedence: 1 });
  const multiplication = g([expr, "*", expr], { id: "mul", precedence: 2 });
  expr.value.push(multiplication, addition, number);

  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(expr);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref36"},{"type":"shift","grammar":"#ref39"}],"<{\\"type\\":\\"choice\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"foo\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}},{\\"type\\":\\"sequence\\",\\"value\\":[\\"#ref0\\",{\\"type\\":\\"string\\",\\"value\\":\\"*\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"*\\"}},\\"#ref6\\"],\\"id\\":\\"mul\\",\\"precedence\\":2,\\"originalGrammar\\":{\\"type\\":\\"sequence\\",\\"value\\":[{\\"type\\":\\"choice\\",\\"value\\":[\\"#ref3\\",\\"#ref10\\",{\\"type\\":\\"sequence\\",\\"value\\":[\\"#ref12\\",{\\"type\\":\\"string\\",\\"value\\":\\"+\\"},\\"#ref18\\"],\\"id\\":\\"add\\",\\"precedence\\":1},{\\"type\\":\\"regexp\\",\\"value\\":\\"/^\\\\\\\\d+/\\",\\"id\\":\\"number\\"}],\\"id\\":\\"expr\\"},\\"#ref8\\",\\"#ref20\\"],\\"id\\":\\"mul\\",\\"precedence\\":2}},{\\"type\\":\\"sequence\\",\\"value\\":[\\"#ref9\\",{\\"type\\":\\"string\\",\\"value\\":\\"+\\",\\"originalGrammar\\":\\"#ref19\\"},\\"#ref27\\"],\\"id\\":\\"add\\",\\"precedence\\":1,\\"originalGrammar\\":\\"#ref16\\"},{\\"type\\":\\"regexp\\",\\"value\\":\\"#ref22\\",\\"id\\":\\"number\\",\\"originalGrammar\\":\\"#ref21\\"}],\\"id\\":\\"expr\\",\\"originalGrammar\\":\\"#ref24\\"}>":[{"type":"accept","grammar":null},{"type":"shift","grammar":"#ref40","precedence":2},{"type":"reduce","grammar":"#ref37"},{"type":"shift","grammar":"#ref41","precedence":1},{"type":"reduce","grammar":"#ref38"}],"<\\"#ref2\\">":[{"type":"reduce","grammar":"#ref30"}],"<\\"#ref4\\">":["#ref59"],"<\\"#ref25\\">":["#ref62"],"<\\"#ref32\\">":["#ref64"],"<\\"#ref7\\">":[{"type":"shift","grammar":"#ref45","precedence":2},{"type":"shift","grammar":"#ref47","precedence":2}],"<\\"#ref28\\">":[{"type":"shift","grammar":"#ref69","precedence":1},{"type":"shift","grammar":"#ref71","precedence":1}]}`);
});

Deno.test("GrammarAnalyzer / Infinite recursion", () => {
  const grammar = g([]);
  grammar.value.push(grammar);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `No next action found for grammar : null`);
});

Deno.test("GrammarAnalyzer / Infinite prefix recursion", () => {
  const grammar = g(["foo"]) as SequenceGrammar;
  grammar.value.unshift(grammar);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `No next action found for grammar : null`);
});

Deno.test("GrammarAnalyzer / Infinite postfix recursion", () => {
  const grammar = g(["foo"]) as SequenceGrammar;
  grammar.value.push(grammar);
  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref9"}],"<{\\"type\\":\\"sequence\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"foo\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}},\\"#ref0\\"],\\"originalGrammar\\":{\\"type\\":\\"sequence\\",\\"value\\":[\\"#ref3\\",\\"#ref5\\"]}}>":[{"type":"accept","grammar":null},{"type":"reduce","grammar":"#ref4"}],"<\\"#ref2\\">":[{"type":"shift","grammar":"#ref13"}]}`);
});

Deno.test({
  name: "GrammarAnalyzer / Choice", fn() {
    const grammar = g.or(["foo", "bar"]);
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref10"},{"type":"shift","grammar":"#ref11"}],"<{\\"type\\":\\"choice\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"foo\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}},{\\"type\\":\\"string\\",\\"value\\":\\"bar\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"bar\\"}}],\\"originalGrammar\\":{\\"type\\":\\"choice\\",\\"value\\":[\\"#ref3\\",\\"#ref5\\"]}}>":[{"type":"accept","grammar":null}],"<\\"#ref2\\">":[{"type":"reduce","grammar":"#ref0"}],"<\\"#ref4\\">":["#ref21"]}`);
  }
});

Deno.test({
  name: "GrammarAnalyzer / Optional", fn() {
    const grammar = g.optional("foo");
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref0"},{"type":"shift","grammar":"#ref5"}],"<{\\"type\\":\\"optional\\",\\"value\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}},\\"originalGrammar\\":{\\"type\\":\\"optional\\",\\"value\\":\\"#ref2\\"}}>":[{"type":"accept","grammar":null}],"<\\"#ref1\\">":[{"type":"reduce","grammar":"#ref9"}]}`);
  }
});

Deno.test({
  name: "GrammarAnalyzer / Repetition", fn() {
    const grammar = g.repeat("foo");
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref5"}],"<{\\"type\\":\\"repeat\\",\\"value\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}},\\"originalGrammar\\":{\\"type\\":\\"repeat\\",\\"value\\":\\"#ref2\\"}}>":[{"type":"accept","grammar":null}],"<\\"#ref1\\">":[{"type":"reduce","grammar":"#ref0"},{"type":"shift","grammar":"#ref9"}]}`);
  }
});

Deno.test({
  name: "GrammarAnalyzer / Repetition with separator", fn() {
    const grammar = g.repeat("foo", {sep: g(",")});
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref8"}],"<{\\"type\\":\\"repeat\\",\\"value\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}},\\"sep\\":{\\"type\\":\\"string\\",\\"value\\":\\",\\",\\"originalGrammar\\":{\\"type\\":\\"string\\",\\"value\\":\\",\\"}},\\"originalGrammar\\":{\\"type\\":\\"repeat\\",\\"value\\":\\"#ref2\\",\\"sep\\":\\"#ref4\\"}}>":[{"type":"accept","grammar":null}],"<\\"#ref1\\">":[{"type":"reduce","grammar":"#ref0"},{"type":"shift","grammar":"#ref9"}],"<\\"#ref3\\">":[{"type":"shift","grammar":"#ref13"}]}`);
  }
});

Deno.test("GrammarAnalyzer / Empty string", () => {
  const grammar = g("");
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `Empty string grammar is not allowed. Use optional instead.`);
});

Deno.test("GrammarAnalyzer / Regex matching empty string", () => {
  const grammar = g(/^.*/);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `Regexp grammar should not match an empty string : /^.*/. Use optional instead.`);
});

Deno.test("GrammarAnalyzer / Regex start", () => {
  const grammar = g(/.*/);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `Regexp grammar should start with "/^" : /.*/`);
});
