const fs = require('fs');
const path = require('path');
const dir = './components/playground/node/';

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        let needsUpdate = false;
        
        // For serviceNode, networkNode, etc., we want the main card container to be overflow-visible
        // but we still want the gradient header to be rounded and clip its contents if needed
        // Since different files have different structures, doing a strategic replace:
        
        // Replace "overflow-hidden" with "overflow-visible flex flex-col min-w" 
        // wherever the main card wrapper is
        // Let's just find `overflow-hidden border border-white/5` which seems common
        if (content.match(/min-w-\[.*\] overflow-hidden/)) {
            content = content.replace(/min-w-\[(.*?)\] overflow-hidden/g, 'min-w-[$1] overflow-visible');
            needsUpdate = true;
        }

        if (needsUpdate) {
            fs.writeFileSync(path.join(dir, file), content);
            console.log(`Updated ${file}`);
        }
    }
});
