const fs = require('fs');
const path = require('path');
const dir = './components/playground/node/';

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        let newContent = content.replace(/!w-3 !h-3/g, '!w-9 !h-3 !rounded-full');
        if (content !== newContent) {
            fs.writeFileSync(path.join(dir, file), newContent);
            console.log(`Updated ${file}`);
        }
    }
});
