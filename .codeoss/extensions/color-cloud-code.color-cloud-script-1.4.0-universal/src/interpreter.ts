import * as fs from 'node:fs';
import * as readline from 'node:readline';
import * as https from 'node:https';
import * as path from 'node:path';

class ColorCloudScript {
    private variables: Map<string, any> = new Map();
    private functions: Map<string, string> = new Map();
    private triggers: Map<string, string> = new Map();
    private allowedPaths: Set<string> = new Set();
    private workspacePath: string = process.cwd();

    async run(code: string) {
        const lines = code.split('\n');
        let i = 0;
        
        // Erst-Durchlauf für Berechtigungen
        while (i < lines.length) {
            let line = lines[i].trim();
            if (line === "Erlauben Teil Start") {
                i++;
                while (i < lines.length && lines[i].trim() !== "Erlauben Teil Ende") {
                    let permLine = lines[i].trim();
                    if (permLine.startsWith('Erlaube ')) {
                        let target = permLine.substring(8).replace(/"/g, '').trim();
                        if (target === "ganzen workspace") {
                            this.allowedPaths.add(this.workspacePath);
                            console.log(`[Sicherheit] Zugriff auf den gesamten Workspace erlaubt.`);
                        } else {
                            const absolutePath = path.resolve(target);
                            this.allowedPaths.add(absolutePath);
                            console.log(`[Sicherheit] Zugriff auf '${absolutePath}' erlaubt.`);
                        }
                    }
                    i++;
                }
            }
            i++;
        }

        // Haupt-Durchlauf (Reset Index)
        i = 0;
        while (i < lines.length) {
            let line = lines[i].trim();
            if (!line || line.startsWith('--') || line === "Erlauben Teil Start" || line === "Erlauben Teil Ende" || line.startsWith('Erlaube ')) { i++; continue; }

            // Internet mit Sicherheitscheck
            if (line.startsWith('Erstelle Dokument ')) {
                const match = line.match(/Erstelle Dokument\s+(.*)\s+von\s+(.*)/);
                if (match) {
                    const fileName = String(this.evaluate(match[1]));
                    const url = String(this.evaluate(match[2]));
                    
                    if (this.isAccessAllowed(fileName)) {
                        console.log(`[Internet] Lade '${fileName}' herunter...`);
                        await this.downloadFile(url, fileName);
                    } else {
                        console.error(`[Sicherheit] ZUGRIFF VERWEIGERT! '${fileName}' ist nicht erlaubt.`);
                    }
                }
                i++;
                continue;
            }

            // -- Restliche Logik (Warte, Trigger, Variablen etc.) --
            if (line.startsWith('Variable ')) {
                const match = line.match(/Variable\s+(\w+)\s*=\s*(.*)/);
                if (match) this.variables.set(match[1], this.evaluate(match[2]));
                i++;
                continue;
            }

            if (line.startsWith('Schreibe ')) {
                console.log(this.evaluate(line.substring(9).trim()));
                i++;
                continue;
            }

            if (line.startsWith('Frage ')) {
                const prompt = String(this.evaluate(line.substring(6).trim()));
                const answer = await this.ask(prompt);
                this.variables.set('Antwort', answer);
                i++;
                continue;
            }

            if (line.startsWith('Warte ')) {
                const match = line.match(/Warte\s+(.*)\s+Sekunden/);
                if (match) {
                    const seconds = Number(this.evaluate(match[1]));
                    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
                }
                i++;
                continue;
            }

            if (line.startsWith('Wenn ')) {
                const match = line.match(/Wenn\s+(.*):/);
                if (match) {
                    if (!this.evalCondition(match[1])) {
                        let depth = 1;
                        while (depth > 0 && i < lines.length - 1) {
                            i++;
                            let nextLine = lines[i].trim();
                            if (nextLine.startsWith('Wenn ')) depth++;
                            if (nextLine === "Ende") depth--;
                        }
                    }
                }
                i++;
                continue;
            }

            if (line.startsWith('Wiederhole ')) {
                const match = line.match(/Wiederhole\s+(.*)\s+mal:/);
                if (match) {
                    const times = Number(this.evaluate(match[1]));
                    let depth = 1;
                    let startLine = i + 1;
                    let endLine = i;
                    while (depth > 0 && endLine < lines.length - 1) {
                        endLine++;
                        let nextLine = lines[endLine].trim();
                        if (nextLine.startsWith('Wiederhole ')) depth++;
                        if (nextLine === "Ende") depth--;
                    }
                    const loopLines = lines.slice(startLine, endLine).join('\n');
                    for (let n = 0; n < times; n++) await this.run(loopLines);
                    i = endLine + 1;
                    continue;
                }
            }

            i++;
        }
    }

    private isAccessAllowed(filePath: string): boolean {
        const absoluteTarget = path.resolve(filePath);
        for (const allowed of this.allowedPaths) {
            if (absoluteTarget.startsWith(allowed)) return true;
        }
        return false;
    }

    private evaluate(expression: string): any {
        expression = expression.trim();
        if (expression.startsWith('Zufall(')) {
            const match = expression.match(/Zufall\((\d+)\s*,\s*(\d+)\)/);
            if (match) return Math.floor(Math.random() * (Number(match[2]) - Number(match[1]) + 1)) + Number(match[1]);
        }
        if (expression.startsWith('"') && expression.endsWith('"')) return expression.slice(1, -1);
        if (!isNaN(Number(expression)) && expression !== "") return Number(expression);
        if (this.variables.has(expression)) return this.variables.get(expression);
        if (expression.includes('+')) {
            const parts = expression.split('+').map((p: string) => p.trim());
            return this.evaluate(parts[0]) + this.evaluate(parts[1]);
        }
        return expression;
    }

    private evalCondition(condition: string): boolean {
        const parts = condition.split(' ').map(p => p.trim());
        const left = this.evaluate(parts[0]);
        let op = parts[1];
        const right = this.evaluate(parts[2]);
        if (op === "ist" && parts[2] === "gleich") op = "==";
        switch (op) {
            case '==': return left == right;
            case '>': return left > right;
            case '<': return left < right;
            default: return false;
        }
    }

    private ask(question: string): Promise<string> {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise(resolve => rl.question(`${question} `, (answer: string) => {
            rl.close();
            resolve(answer);
        }));
    }

    private downloadFile(url: string, dest: string): Promise<void> {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    this.downloadFile(response.headers.location!, dest).then(resolve).catch(reject);
                    return;
                }
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => { file.close(); console.log(`[Erfolg] '${dest}' wurde erstellt.`); resolve(); });
            }).on('error', (err) => { console.error(`[Fehler] Download fehlgeschlagen: ${err.message}`); reject(err); });
        });
    }
}

const filePath = process.argv[2];
if (filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    new ColorCloudScript().run(code);
}
