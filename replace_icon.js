const fs = require('fs');
const path = require('path');

const src = '/home/x/expanse/assets/expanse.png';
const dst = '/home/x/expanse/app/icon.png';
const oldIcon = '/home/x/expanse/app/favicon.ico';

try {
    if (fs.existsSync(oldIcon)) {
        fs.unlinkSync(oldIcon);
        console.log('Removed old favicon.ico');
    }
    fs.copyFileSync(src, dst);
    console.log('Copied expanse.png to icon.png');
} catch (err) {
    console.error('Error during icon replacement:', err);
    process.exit(1);
}
