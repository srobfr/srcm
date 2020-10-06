import File from "../files/File";
import {GrammarDefinition} from "../grammar/GrammarDefinitions";
import {parse} from "../../index";
import Node from "../dom/Node";

/**
 * Codemod tool
 * This handles command-line arguments to save or diff files
 */
export default function codemod(func: () => Promise<Array<ParsedFile>>) {
    const showXml = process.argv.find(a => a === '-x');
    const apply = process.argv.find(a => a === '-a');
    const help = process.argv.find(a => a === '-?') || process.argv.find(a => a === '-h');
    if (help) {
        console.log(`SRCM`);
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

interface ParsedFile extends File {
    $: Node
}

export async function parseFile(grammar: GrammarDefinition, path: string): Promise<ParsedFile> {
    const file = new File(path) as ParsedFile;
    await file.load();
    if (!file.content && (grammar as any).default) file.content = (grammar as any).default;
    file.$ = parse(grammar, file.content);
    return file;
}
