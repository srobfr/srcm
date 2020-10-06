import Parser from "./Parser";
import {multiple, optional, optmul, or, tag} from "../grammar/grammarDefinitionsHelpers";
import {GrammarDefinition} from "../grammar/GrammarDefinitions";

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
        const result = new Parser().parse(g , "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('optional', async function () {
        const g: GrammarDefinition = [optional('plop'), 'foo'];
        const result = new Parser().parse(g, "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('multiple', async function () {
        const g: GrammarDefinition = multiple('foo');
        const result = new Parser().parse(g,"foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('optmul', async function () {
        const g: GrammarDefinition = optmul('foo');
        const result = new Parser().parse(g, "foo");
        console.debug(`result = "%s"`, result.xml());
    });

    it('lr', async function () {
        const number = /^\d+/;
        const ow = optional(/^ +/);
        const expr = or();
        const addition = tag('addition', [expr, ow, '+', ow, expr]);
        const multiplication = tag('multiplication', [expr, ow, '*', ow, expr]);
        const parenthesedExpr = ['(', ow, expr, ow, ')'];

        expr.or.push(parenthesedExpr, multiplication, addition, number);

        const result = new Parser().parse(expr, "(1+2)*3*4+5");
        console.debug(`result = "%s"`, result.xml());
    });
});
