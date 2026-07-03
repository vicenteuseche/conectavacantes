"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const generate_scss_1 = require("./generate-scss");
function activate(context) {
    console.log('Congratulations, your extension "html-to-scss" is now active!');
    // Register the command to generate SCSS from selected HTML
    let disposable = vscode.commands.registerCommand('extension.html-to-scss.generate-scss', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const htmlSnippet = editor.document.getText(selection);
            const outputStyle = vscode.workspace.getConfiguration().get('html-to-scss.outputStyle', 'alman');
            const scssSnippet = (0, generate_scss_1.generateSCSS)(htmlSnippet, outputStyle);
            vscode.env.clipboard.writeText(scssSnippet);
            vscode.window.showInformationMessage('SCSS snippet generated and copied to clipboard!');
        }
    });
    // Add the command as a context menu item
    let contextDisposable = vscode.commands.registerTextEditorCommand('extension.html-to-scss.generate-scssContextMenu', (textEditor) => {
        const selection = textEditor.selection;
        const htmlSnippet = textEditor.document.getText(selection);
        const outputStyle = vscode.workspace.getConfiguration().get('html-to-scss.outputStyle', 'alman');
        const scssSnippet = (0, generate_scss_1.generateSCSS)(htmlSnippet, outputStyle);
        vscode.env.clipboard.writeText(scssSnippet);
        vscode.window.showInformationMessage('SCSS snippet generated and copied to clipboard!');
    });
    context.subscriptions.push(disposable, contextDisposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map