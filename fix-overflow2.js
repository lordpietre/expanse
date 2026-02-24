const fs = require('fs');
const path = require('path');
const dir = './components/playground/node/';

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        let newContent = content.replace(/rounded-\[0\.65rem\] overflow-hidden/g, 'rounded-[0.65rem] overflow-visible');
        if (content !== newContent) {
            fs.writeFileSync(path.join(dir, file), newContent);
            console.log(`Updated ${file}`);
        }
    }
});
