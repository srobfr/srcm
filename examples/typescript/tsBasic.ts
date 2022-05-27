import {multiple, optional, or, tag} from "../../src";

/** Javascript identifier (function name, var name...) */
export const ident = /^[a-z_][\w_]*/i;

/** a white space */
export const w = /^[ \n\s]+/;

/** an optional white space */
export const ow = /^[ \n\s]*/;

/** A line comment, starting with '//' */
export const lineComment = /^\/\/ *.+(?:\n|$)/;

/** A block comment */
export const blockComment = /^\/\*[^]*\*\//;

/** A JSDoc one-line block comment */
export const jsDocOneLineBlockComment = /^\/\*\*[^]*\*\//;
export const comment = tag('comment', or(lineComment, jsDocOneLineBlockComment, blockComment));

/** White spaces mixed with comments (speed optimization) */
export const wc = /^(?:[ \n\s]+|\/\/ *.+(?=\n|$)|\/\*[^]*\*\/)+/;

/** Strings */
export const quotedString = /^'(\\'|[^'\\]+|\\)*'/;
export const doubleQuotedString = /^"(\\"|[^"\\]+|\\)*"/;
export const templateStrings = [optional(ident), /^`(\\`|[^`\\]+|\\)*`/];
export const string = or(quotedString, doubleQuotedString, templateStrings);

/** Numbers */
export const number = /^(?:\d+(?:\.\d+)?|(?:\.\d+))/;

// Recursively nested things
export const curlyBracedBlock = [];
export const parenthesedBlock = [];
export const squaredBlock = [];

/** A block of recursive code with correct ([{wrapping}]) */
export const anything = multiple(or(
    comment,
    curlyBracedBlock,
    parenthesedBlock,
    squaredBlock,
    /^[^]+?(?=\/\*|\/\/|{|}|\(|\)|\[|\]|$)/,    
));
curlyBracedBlock.push('{', optional(anything), '}');
parenthesedBlock.push('(', optional(anything), ')');
squaredBlock.push('[', optional(anything), ']');

/** A block of recursive code with correct ([{wrapping}]) matched until semicolon */
export const anythingUntilSemicolon = multiple(or(
    comment,
    curlyBracedBlock,
    parenthesedBlock,
    squaredBlock,
    /^[^]+?(?=\/\*|\/\/|{|}|\(|\)|\[|\]|$|;)/,
));
