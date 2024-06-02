# SRCM

[![NPM version](https://badge.fury.io/js/srcm.svg)](http://badge.fury.io/js/srcm)
[![JSR](https://jsr.io/badges/@srob/srcm)](https://jsr.io/@srob/srcm)

A generic code modification tool.

```ts
import { g, parse } from "jsr:@srob/srcm";

const barOrBaz = g.or([/^bar/i, "baz"]);
const grammar = g`Foo is ${barOrBaz}`;

// parse("Plop", grammar); // Throws :
// SyntaxError: Syntax error on line 1, columns 1:
// Plop
// ^Expected one of ["Foo is "]

const $ = parse("Foo is BAR", grammar);
console.log($.text()); // Foo is BAR

// $.findByGrammar(barOrBaz)[0].text("ohno"); // Throws with : Expected one of ["/^bar/i", "baz"]
const $barOrBaz = $.findByGrammar(barOrBaz)[0];
$barOrBaz.text("baz");
console.log($barOrBaz.text()); // baz
console.log($.text()); // Foo is baz
```

## What is this ?

The goal of this project is to allow you to convert any javascript text into a DOM-like Abstract Syntax Tree, using a grammar written in simple javascript.

The module provides two exports :

### g

`g` provides utilities for converting convenient javascript objects and values into grammars usable by the internal parser :

```ts
g("a"); // => { type: "string", value: "a" }

g("a", { id: "A" }); // => { type: "string", value: "a", id: "A" }

g(["a", "b"]); // => { type: "sequence", value: [ { type: "string", value: "a" }, { type: "string", value: "b" } ] }

g.or(["a", "b"]); // => { type: "choice", value: [ { type: "string", value: "a" }, { type: "string", value: "b" } ] }
```

Notice that the grammars are themselves plain old js object, the `g` helper is not actually required to use the parser.

`g` can also be used as a tag function for [tagged template litterals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals):

```ts
g`Foo ${bar} baz`
// is actually equivalent to
g(["Foo ", bar, " baz"])
```

This feature allows to paste full chunks of existing source code in a template litteral and use it as a grammar:

```ts
const myFileGrammar = g`<?php
class FooBar
{
}
`;
```

...then replace directly in-place some code by sub-grammars:

```ts
const phpClassName = g(/^[\w][\w\d_]+/);
const myFileGrammar = g`<?php
class ${phpClassName}
{
}
`;
```

Being simple js objects, grammars can be manipulated to produce interesting results. For example :

```ts
const digits = g(/^[\d]+/);
const expression = g.or([digits]);
const addition = g`${expr}+${expr}`;
const multiplication = g`${expr}*${expr}`;
// Here, expression is: { type: "choice", value: [ { type: "regexp", value: /^[\d]+/ } ] }
// Create a recursive grammar by adding addition and multiplication as possible children of expression:
expression.value.push(addition, multiplication);
```
Note that the `expression` grammar now has an infinite depth, due to the cyclic references. This is not a problem for the internal parser, as it uses a bottom-up parsing algorithm.

### parse

The `parse()` function converts a given string into a pseudo-DOM structure :

```ts
const $ = parse("Foo", g("Foo"));
console.log($);
/* =>
Node {
  grammar: { type: "string", value: "Foo" },
  parent: null,
  prev: null,
  next: null,
  children: [],
  textContent: "Foo",
  parse: [Function (anonymous)]
}
*/
```

The `Node` class provides features inspired by the DOM structure used in browser (but really simpler!) to manipulate the generated Abstract Syntax Tree.

TODO Node methods

## Install

### Using NPM

Execute this in a shell at your project root :

```sh
pnpm add srcm
```

```sh
yarn add srcm
```

```sh
npm i --save srcm
```

### Using Deno

Execute this in a shell at your project root :

```sh
deno add @srob/srcm
```

or skip the install step and use it in your source :

```ts
import { g, parse } from "jsr:@srob/srcm";
```

## Author

**Simon Robert**

- [github/srobfr](https://github.com/srobfr)

## License

Copyright © 2024 [Simon Robert](https://github.com/srobfr)

Released under the [MIT license](./LICENCE).
