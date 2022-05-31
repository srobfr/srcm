import {codemod, parseFile} from "../../src/codemod/codemod";
import {srcmDefsFile} from "../srcmGrammar/srcmDefDef";

/**
 * Example codemod using srcm example grammar.
 *
 * To run this, use :
 * ./node_modules/.bin/ts-node examples/codemod/codemod.ts
 */
codemod(async () => {
    const sampleFile = await parseFile(srcmDefsFile, `${__dirname}/php.ts`, '');

    sampleFile.$.apply([
        {name: "w", desc: `A white space`, def: '/^[ \\n\\s]+/'},
        {name: "ow", desc: `An optional white space`, def: `/^[ \\n\\s]*/`},
        {name: "ident", desc: `An identifier, like a function name, etc.`, def: `/^[a-z_][\\w_]*/i`},
        {name: "lineComment", desc: `A line comment, starting with '//'`, def: `/^\\/\\/ *.+(?:\\n|$)/`},
        {name: "blockComment", desc: `A block comment`, def: `/^\\/\\*[^]*\\*\\//`},
        {name: "phpDocOneLineBlockComment", desc: `A one-line PHPDoc block comment`, def: `/^\\/\\*\\*[^]*?\\*\\//`},
        {name: "comment", desc: `A comment`, def: `or(lineComment, phpDocOneLineBlockComment, blockComment)`},
        {name: "wc", desc: `White spaces mixed with comments (speed optimization)`, def: `/^(?:[ \\n\\s]+|\\/\\/ *.+(?=\\n|$)|\\/\\*[^]*?\\*\\/)+/`},
    ]);

    return [sampleFile];
});
