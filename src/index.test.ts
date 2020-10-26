import Parser from "./parser/Parser";
import {multiple, optmul, tag} from "./grammar/grammarDefinitionsHelpers";
import assert from "assert";

describe('srcm', function () {
    it('Multiple with separator', async function () {
        const g = multiple(tag('n', /^\d/), tag('s', ','));
        const result = new Parser().parse(g, '1,2');
        assert.strictEqual(result.xml(), `<n>1</n><s>,</s><n>2</n>`);
    });
});
