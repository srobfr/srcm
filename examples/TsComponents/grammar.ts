import {multiple, optional, or, tag} from "../../src";

export const ident = /^[a-z_][\w_]*/i;
export const w = /^[ \n\s]+/;
export const ow = /^[ \n\s]*/;

export const lineComment = [/^\/\/ */, tag('comment', /^.+(?=\n|$)/)];

export const jsDocLine = [/^\/\*\* */, tag('doc', /^ *.+?(?= *\*\/)/), /^ *\*\//];
export const jsDocBlock = [
    /^\/\*\* *\n/,
    multiple([/^ *\* */, tag('line', /^.+(?=\n|$)/), '\n',]),
    /^ *\*\//,
];

export const jsDoc = or(jsDocLine, jsDocBlock);

export const methodBody = [ow];
export const method = tag('method', [
    optional([jsDoc, w]),
    or('public', 'protected', 'private'), w, optional(['async', w]),
    tag('name', ident), ow,
    '()', ow, '{', methodBody, '}'
]);

export const classBody = tag('classBody', [
    multiple(or(w, lineComment, method)),
]);

export const file: any = [
    ow,
    jsDoc, ow,
    `export default class`, w, tag('name', ident), ow, '{', classBody, '}',
    ow,
];
file.default = `
/**
 * TODO
 */
export default class TODO {

}
`;
