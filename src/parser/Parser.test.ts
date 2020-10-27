import Parser from "./Parser";
import {multiple, optional, optmul, or, tag} from "../grammar/grammarDefinitionsHelpers";
import {GrammarDefinition} from "../grammar/GrammarDefinitions";
import assert from "assert";

describe('Parser', function () {
    it('regex', async function () {
        const result = new Parser().parse(/^foo/, 'foo');
        console.debug(`result = "%s"`, result.xml());
    });

    it('string', async function () {
        const result = new Parser().parse('foo', 'foo');
        console.debug(`result = "%s"`, result.xml());
    });

    it('sequence', async function () {
        const g: GrammarDefinition = tag('foo', ['f', 'oo']);
        const result = new Parser().parse(g, "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('or', async function () {
        const g: GrammarDefinition = or('foo', ['b', 'ar']);
        const result = new Parser().parse(g, "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('optional', async function () {
        const g: GrammarDefinition = [optional('plop'), 'foo'];
        const result = new Parser().parse(g, "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('multiple', async function () {
        const g: GrammarDefinition = multiple('foo');
        const result = new Parser().parse(g, "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('optmul', async function () {
        const g: GrammarDefinition = optmul('foo');
        const result = new Parser().parse(g, "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('Ambiguous grammar', async function () {
        this.skip(); // TODO
        const number = /^\d+/;
        const ow = optional(/^ +/);
        const expr = or();
        const addition = tag('a', [expr, ow, '+', ow, expr]);
        const multiplication = tag('m', [expr, ow, '*', ow, expr]);
        const parenthesedExpr = ['(', ow, expr, ow, ')'];

        expr.or.push(parenthesedExpr, multiplication, addition, number);

        const result = new Parser().parse(expr, "3*(1+2)+3");
        assert.strictEqual(result.xml(), `<a><m>3*(<a>1+2</a>)</m>+3</a>`);

        console.debug(`result = "%s"`, result.xml());
    });

    it('Multiple with separator', async function () {
        const g = multiple(tag('n', /^\d/), tag('s', ','));
        const result = new Parser().parse(g, '1,2');
        assert.strictEqual(result.xml(), `<n>1</n><s>,</s><n>2</n>`);
    });
});
