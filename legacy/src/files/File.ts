import {promises as fsPromises, mkdtemp} from 'fs';
import mkdirp from 'mkdirp';
import {sep, dirname} from 'path';
import {spawn} from "child_process";
import {tmpdir} from "os";
import {promisify} from "util";

export default class File {
    public content: string | null = null;

    constructor(public readonly path: string) {
    }

    public async load() {
        try {
            this.content = await fsPromises.readFile(this.path, {encoding: "utf8"});
        } catch (err) {
            if (err.code === 'ENOENT') this.content = '';
            else throw err;
        }
    }

    public async save() {
        await mkdirp(dirname(this.path));
        await fsPromises.writeFile(this.path, this.content);
    }

    public async getDiff(): Promise<string> {
        const diffCmd = process.env.DIFFCMD || 'diff';
        const tmpDir = await promisify(mkdtemp)(tmpdir() + sep);
        const tmpFullPath = tmpDir + this.path;
        await mkdirp(dirname(tmpFullPath));
        await fsPromises.writeFile(tmpFullPath, this.content);

        return await new Promise((resolve, reject) => {
            const diffPs = spawn(diffCmd, ['-uN', this.path, '-'], {stdio: ['pipe', 'inherit', 'inherit']});
            let stdout = '';
            diffPs.on('close', (code) => (code < 2 ? resolve(stdout) : reject(new Error(`Code ${code}`))));
            diffPs.stdin.end(this.content);
        });
    }
}
