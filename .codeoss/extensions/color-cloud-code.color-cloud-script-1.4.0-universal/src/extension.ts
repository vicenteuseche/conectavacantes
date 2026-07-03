import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('ccs.runFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.fileName;
            
            let terminal = vscode.window.terminals.find(t => t.name === "CCS Terminal");
            if (!terminal) {
                terminal = vscode.window.createTerminal("CCS Terminal");
            }
            
            terminal.show();
            
            // Wir nutzen den INTERNEN Interpreter aus dem Extension-Ordner
            const interpreterPath = path.join(context.extensionPath, 'out', 'interpreter.js');
            
            // Wir nutzen normales 'node', da der Interpreter bereits in JS umgewandelt wurde
            terminal.sendText(`node "${interpreterPath}" "${filePath}"`);
        } else {
            vscode.window.showErrorMessage("Keine .ccs Datei zum Ausführen gefunden!");
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
