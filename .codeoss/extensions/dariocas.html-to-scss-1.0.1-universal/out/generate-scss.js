"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSCSS = void 0;
const htmlparser2 = require("htmlparser2");
const domhandler_1 = require("domhandler");
function generateSCSS(htmlSnippet, outputStyle) {
    let scssCode = '';
    let indentLevel = 0;
    let isSelfClosing = false;
    const uniqueTags = new Set();
    const openingTags = [];
    const handler = new domhandler_1.DomHandler((error, dom) => {
        if (error) {
            throw new Error(`Error parsing HTML: ${error}`);
        }
        function processElement(element) {
            const { tagName, attribs, children } = element;
            if (tagName && tagName !== 'svg') {
                const classNames = attribs.class ? attribs.class.split(' ') : [];
                const tagKey = `${tagName}.${classNames.join('.')}`;
                if (uniqueTags.has(tagKey)) {
                    return; // Skip duplicate tag
                }
                uniqueTags.add(tagKey);
                const indent = '\t'.repeat(indentLevel);
                let selector = '';
                if (tagName !== 'div') {
                    selector = tagName;
                }
                if (classNames.length > 0) {
                    selector += `.${classNames.join('.')}`;
                }
                let openingBlock = '';
                if (outputStyle === 'standard') {
                    openingBlock = `${indent}${selector} {\n\n`;
                }
                else {
                    openingBlock = `${indent}${selector}\n${indent}{\n\n`;
                }
                scssCode += openingBlock;
                openingTags.push(tagName);
                indentLevel++;
                for (const child of children) {
                    if (child.type === 'tag') {
                        processElement(child);
                    }
                }
                indentLevel--;
                const closingBlock = `${indent}}\n`;
                scssCode += closingBlock;
                openingTags.pop();
            }
        }
        for (const element of dom) {
            if (element.type === 'tag') {
                processElement(element);
            }
        }
    });
    const parser = new htmlparser2.Parser(handler);
    parser.write(htmlSnippet);
    parser.end();
    return scssCode;
}
exports.generateSCSS = generateSCSS;
//# sourceMappingURL=generate-scss.js.map