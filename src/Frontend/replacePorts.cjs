const fs = require('fs');
const path = require('path');

function replacePort(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replacePort(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('5050')) {
                content = content.replace(/5050/g, '5051');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Replaced 5050 with 5051 in ${fullPath}`);
            }
        }
    }
}

replacePort(path.join(__dirname, 'src'));
console.log('Done replacing ports.');
