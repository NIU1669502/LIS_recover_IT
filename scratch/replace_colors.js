const fs = require('fs');
const path = require('path');

const cssMap = {
    '#fff': 'var(--bg-primary)',
    '#ffffff': 'var(--bg-primary)',
    '#fafafa': 'var(--bg-secondary)',
    '#f5f5f5': 'var(--bg-secondary)',
    '#f8f9ff': 'var(--bg-tertiary)',
    '#fafcff': 'var(--bg-tertiary)',
    '#f0f0f0': 'var(--border-color)',
    '#e2e8f0': 'var(--border-color)',
    '#e5e7eb': 'var(--border-color)',
    '#111': 'var(--text-primary)',
    '#333': 'var(--text-primary)',
    '#1a1a1a': 'var(--text-primary)',
    '#444': 'var(--text-primary)',
    '#555': 'var(--text-secondary)',
    '#666': 'var(--text-secondary)',
    '#888': 'var(--text-secondary)',
    '#aaa': 'var(--text-muted)',
    '#999': 'var(--text-muted)',
    '#bbb': 'var(--text-muted)',
    '#cbd5e1': 'var(--text-muted)',
    '#94a3b8': 'var(--text-muted)',
    '#64748b': 'var(--text-secondary)',
    '#334155': 'var(--text-primary)',
    '#0f172a': 'var(--text-primary)',
    '#f8fafc': 'var(--hover-bg)',
    '#eaecf0': 'var(--hover-bg)',
    '#2563eb': 'var(--accent-blue)',
    '#3b82f6': 'var(--accent-blue)',
    '#1d4ed8': 'var(--accent-blue-dark)',
    '#1e40af': 'var(--accent-blue-dark)',
    '#0369a1': 'var(--accent-blue)',
    '#eff6ff': 'var(--accent-blue-bg)',
    '#e8f0ff': 'var(--accent-blue-bg)',
    '#f0f5ff': 'var(--accent-blue-bg)',
    '#f0f9ff': 'var(--accent-blue-bg)',
    '#bfdbfe': 'var(--accent-blue-border)',
    '#bae6fd': 'var(--accent-blue-border)',
    '#dbeafe': 'var(--accent-blue-hover)',
    '#ef4444': 'var(--danger-color)',
    '#dc2626': 'var(--danger-color)',
    '#b91c1c': 'var(--danger-color)',
    '#991b1b': 'var(--danger-color)',
    '#fee2e2': 'var(--danger-bg)',
    '#fef2f2': 'var(--danger-bg)',
    '#fecaca': 'var(--danger-border)',
    '#16a34a': 'var(--success-color)',
    '#15803d': 'var(--success-color)',
    '#f0fdf4': 'transparent' // badgeComplet
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Convert to lowercase for matching, but keep original case for variables if any
    for (const [hex, variable] of Object.entries(cssMap)) {
        // Regex to match exact hex codes, optionally followed by semicolon or space
        const regex = new RegExp(hex + '(?![a-zA-Z0-9])', 'gi');
        content = content.replace(regex, variable);
    }
    
    // Fix specific cases where transparent background is better
    content = content.replace(/background: transparent; color: var\(--success-color\);/g, 'background: rgba(45, 122, 79, 0.15); color: var(--success-color);');
    content = content.replace(/\.badgeComplet \{\s*display: inline-block;\s*font-size: 0\.78rem;\s*font-weight: 600;\s*background: transparent;\s*color: var\(--success-color\);/g, '.badgeComplet {\n    display: inline-block;\n    font-size: 0.78rem;\n    font-weight: 600;\n    background: rgba(45, 122, 79, 0.15);\n    color: var(--success-color);');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${path.basename(filePath)}`);
}

processFile('src/app/components/detallsPacientModal.module.css');
processFile('src/app/components/EditarRutinaModal.module.css');
