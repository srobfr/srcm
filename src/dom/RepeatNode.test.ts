import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import { assertStrictEquals } from "https://deno.land/std@0.223.0/assert/assert_strict_equals.ts";
import { assertThrows } from "https://deno.land/std@0.223.0/assert/assert_throws.ts";
import { g, parse } from "../deno-mod.ts";


Deno.test({
  name: "RepeatNode / insert", fn() {
    const item = g.or(["a", "b", "c", "d", "e"]);
    const list = g.repeat(item);

    const $ = parse(`bd`, list);
    $.insert(parse(`c`, item));
    $.insert(parse(`a`, item));
    $.insert(parse(`e`, item));

    assertEquals($.xml(), `abcde`);
  }
});

Deno.test({
  name: "RepeatNode / insert / list is somewhere in a child", fn() {
    const item = g.or(["a", "b", "c", "d", "e"]);
    const list = g.optional([g.repeat(item)]);

    const $ = parse(`bd`, list);
    $.insert(parse(`c`, item));
    $.insert(parse(`a`, item));
    $.insert(parse(`e`, item));

    assertEquals($.xml(), `abcde`);
  }
});

Deno.test({
  name: "RepeatNode / insert / list with separators", fn() {
    const item = g.or(["a", "b", "c", "d", "e"]);
    const separator = g(/^, */, { default: () => `,` });
    const list = g.optional(g.repeat(item, { sep: separator }));

    const $ = parse(`b,d`, list);
    const $c = parse(`c`, item);

    $.insert($c);
    $.insert(parse(`a`, item));
    $.insert(parse(`e`, item));
    assertEquals($.xml(), `a,b,c,d,e`);

    const $insertedC = $.findFirst($ => $.text() === "c");
    assertStrictEquals($insertedC, $c);

    $c.removeWithSep();
    assertEquals($.xml(), `a,b,d,e`);
  }
});

Deno.test({
  name: "RepeatNode / separators without default", fn() {
    const item = g.or(["a", "b", "c"]);
    const separator = g(/^, */);
    const list = g.optional(g.repeat(item, { sep: separator }));

    const $ = parse(`a,c`, list);
    const $c = parse(`b`, item);

    assertThrows(() => {
      $.insert($c);
    }, `Separator grammar /^, */ does not match its default ""`);
  }
});
