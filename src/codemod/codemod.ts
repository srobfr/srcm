import File from "../files/File";
import {GrammarDefinition, ObjectGrammarDefinition} from "../grammar/GrammarDefinitions";
import {Node} from "../dom/Node";
import { defaultsMap } from "./maps";
import { parse } from "./parse";
import { optional } from "../grammar/grammarDefinitionsHelpers";

/** The "match-anything" grammar. Used as default grammar. */
export const anything = optional(/^[^]+/);
defaultsMap.set(anything, '');

/**
 * Codemod tool
 * This handles command-line arguments to save or diff files
 * 
 * @deprecated Just call persist() at the end of your script
 */
export function codemod(func: () => Promise<Array<ParsedFile>>) {
    (async () => {
        await func();
        await persist();
    })().catch(console.error);
}

export interface ParsedFile extends File {
    $: Node
}

/** @deprecated use openFile + persist */
export async function parseFile(grammar: GrammarDefinition, path: string, defaultCode?: string): Promise<ParsedFile> {
    return openFile(path, grammar, defaultCode);
}

export const openFilesByPath = new Map();

/** Open and parse a file */
export async function openFile(path: string, grammar: GrammarDefinition = anything, defaultCode?: string): Promise<ParsedFile> {
    const file = new File(path) as ParsedFile;
    openFilesByPath.set(path, file);
    await file.load();
    if (!file.content) file.content = defaultCode ?? defaultsMap.get(grammar as ObjectGrammarDefinition) ?? "";
    file.$ = parse(grammar, file.content);
    return file;
}

/** Saves files changes on disk, or shows the diff */
export async function persist() {
    const showXml = process.argv.find(a => a === '-x');
    const apply = process.argv.find(a => a === '-a');
    const help = process.argv.find(a => a === '-?') ?? process.argv.find(a => a === '-h');
    if (help) {
        console.log(`SRCM - A generic code modification tool
Copyright Simon Robert 2023
Licensed under the MIT license. The Software is provided “as is” without warranty of any kind.
I am not responsible of any source code loss in case of wrong manipulation (use a versioning system !).

Usage :
${process.argv[0]} ${process.argv[1]} : Shows the unified diff of the modification, without applying it.
        By default, the "diff" command is used to generate the diff. Use the DIFFCMD env var to customize this.
 -a : Writes the modifications to disk
 -h|-? : Prints this help message
`);
        return;
    }

    const files = Array.from(openFilesByPath.values());
    for (const f of files) {
        if (!(f instanceof File)) throw new Error(`Codemod can only handle instances of File, returned value is ${f}`);
        f.content = (f as ParsedFile).$?.text() ?? f.content;
    }

    if (showXml) {
        console.log(files.map(f => `=== ${f.path} ===\n${f.$.xml()}`).join(''));

    } else if (apply) {
        for (const f of files) {
            await f.save();
            process.stderr.write(`${f.path} written\n`);
        }

    } else {
        for (const f of files) {
            const diff = await f.getDiff();
            process.stdout.write(diff);
        }
    }
}