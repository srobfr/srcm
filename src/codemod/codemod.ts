import File from "../files/File";
import {GrammarDefinition} from "../grammar/GrammarDefinitions";
import {parse} from "../index";
import {Node} from "../dom/Node";

/**
 * Codemod tool
 * This handles command-line arguments to save or diff files
 */
export function codemod(func: () => Promise<Array<ParsedFile>>) {
    const showXml = process.argv.find(a => a === '-x');
    const apply = process.argv.find(a => a === '-a');
    const help = process.argv.find(a => a === '-?') || process.argv.find(a => a === '-h');
    if (help) {
        console.log(`SRCM - A generic code modification tool
Copyright Simon Robert 2020
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

    (async () => {
        const files = await func();
        for (const f of files) f.content = f.$.text();

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
    })().catch(err => console.error(err));
}

export interface ParsedFile extends File {
    $: Node
}

export async function parseFile(grammar: GrammarDefinition, path: string, defaultCode: string): Promise<ParsedFile> {
    const file = new File(path) as ParsedFile;
    await file.load();
    if (!file.content) file.content = defaultCode;
    file.$ = parse(grammar, file.content);
    return file;
}
