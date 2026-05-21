const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'src', 'app', 'components');
const pageCss = path.join(__dirname, 'src', 'app', 'page.module.css');

const replacements = [
    { regex: /color:\s*#0f172a/gi, replace: 'color: var(--text-primary)' },
    { regex: /color:\s*#1e293b/gi, replace: 'color: var(--text-primary)' },
    { regex: /color:\s*#334155/gi, replace: 'color: var(--text-secondary)' },
    { regex: /color:\s*#475569/gi, replace: 'color: var(--text-secondary)' },
    { regex: /color:\s*#64748b/gi, replace: 'color: var(--text-secondary)' },
    { regex: /color:\s*#94a3b8/gi, replace: 'color: var(--text-muted)' },
    
    // Backgrounds
    { regex: /background:\s*#ffffff/gi, replace: 'background: var(--bg-secondary)' },
    { regex: /background:\s*#fff(?![\w\d])/gi, replace: 'background: var(--bg-secondary)' },
    { regex: /background-color:\s*#ffffff/gi, replace: 'background-color: var(--bg-secondary)' },
    { regex: /background-color:\s*#fff(?![\w\d])/gi, replace: 'background-color: var(--bg-secondary)' },
    { regex: /background:\s*#f8fafc/gi, replace: 'background: var(--bg-tertiary)' },
    { regex: /background:\s*#f1f5f9/gi, replace: 'background: var(--bg-tertiary)' },
    { regex: /background-color:\s*#f8fafc/gi, replace: 'background-color: var(--bg-tertiary)' },
    
    // Borders
    { regex: /border-color:\s*#e2e8f0/gi, replace: 'border-color: var(--border-color)' },
    { regex: /border-color:\s*#cbd5e1/gi, replace: 'border-color: var(--border-color)' },
    { regex: /border:\s*(\dpx\s+(?:solid|dashed)\s+)#e2e8f0/gi, replace: 'border: $1var(--border-color)' },
    { regex: /border:\s*(\dpx\s+(?:solid|dashed)\s+)#cbd5e1/gi, replace: 'border: $1var(--border-color)' },
    { regex: /border:\s*(\dpx\s+(?:solid|dashed)\s+)#f1f5f9/gi, replace: 'border: $1var(--border-color)' },
    { regex: /border-(bottom|top|left|right):\s*(\dpx\s+(?:solid|dashed)\s+)#e2e8f0/gi, replace: 'border-$1: $2var(--border-color)' },
    { regex: /border-(bottom|top|left|right):\s*(\dpx\s+(?:solid|dashed)\s+)#f1f5f9/gi, replace: 'border-$1: $2var(--border-color)' }
];

function processFile(filePath) {
    if (filePath.endsWith('perfilUsuari.module.css')) return; // Already updated or skipped
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (let r of replacements) {
        content = content.replace(r.regex, r.replace);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.module.css')) {
            processFile(fullPath);
        }
    }
}

processDirectory(cssDir);
if (fs.existsSync(pageCss)) {
    processFile(pageCss);
}

console.log('All CSS files updated successfully.');
