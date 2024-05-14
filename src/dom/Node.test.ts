
import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import { g, parse } from "../index.ts";
import { assertThrows } from "https://deno.land/std@0.223.0/assert/assert_throws.ts";

Deno.test({
  name: "Node", async fn(t) {
    const foo = g("Foo", { id: "foo" });
    const bar = g(/^Bar/i, { id: "bar" });
    const grammar = g.or([foo, bar]);

    const $ = parse("Foo", grammar);

    await t.step("read xml", () => {
      assertEquals($.xml(), `<foo>Foo</foo>`);
    });

    await t.step("read text", () => {
      assertEquals($.text(), `Foo`);
    });

    await t.step("write text", () => {
      assertEquals($.text("BAR"), $);
      assertEquals($.xml(), `<bar>BAR</bar>`);
    });

    await t.step("write text (syntax error)", () => {
      assertThrows(() => { $.text("plop"); }, Error, `\nplop\n^Expected one of [<foo>, <bar>]`);
    });

    const $bar = $.children[0];
    const $test = parse("test", g("test", { id: "test" }));

    await t.step("prepend", () => {
      $.prepend($test);
      assertEquals($.xml(), `<test>test</test><bar>BAR</bar>`);
    });

    await t.step("remove", () => {
      $test.remove();
      assertEquals($.xml(), `<bar>BAR</bar>`);
    });

    await t.step("append", () => {
      $.append($test);
      assertEquals($.xml(), `<bar>BAR</bar><test>test</test>`);
    });

    await t.step("before", () => {
      $bar.before($test);
      assertEquals($.xml(), `<test>test</test><bar>BAR</bar>`);
    });

    await t.step("after", () => {
      $bar.after($test);
      assertEquals($.xml(), `<bar>BAR</bar><test>test</test>`);
    });

    await t.step("replaceWith", () => {
      $bar.replaceWith($test);
      assertEquals($.xml(), `<test>test</test>`);
    });

    await t.step("empty", () => {
      $.empty();
      assertEquals($.xml(), ``);
    });

    await t.step("xml escaping", () => {
      const $any = parse("<&>", g(/^.+/, { id: "any" }));
      assertEquals($any.xml(), `<any>&lt;&amp;&gt;</any>`);
      assertEquals($any.text(), `<&>`);
    });
  }
});
