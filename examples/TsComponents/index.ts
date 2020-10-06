import {codemod, parseFile} from "../../src/codemod/codemod";
import {classBody, file, jsDoc} from "./grammar";

codemod(async () => {
    const Foo = await parseFile(file, `${__dirname}/samples/Foo.ts`);

    Foo.$.findByGrammar(jsDoc).findByTag('line').text('Plop ?');
    Foo.$.findOneDirectByTag('name').text('MyClass');
    Foo.$.findByGrammar(classBody).text('\n    // TODO\n');

    return [Foo];
});
