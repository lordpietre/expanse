const fs = require('fs');
const file = './components/playground/node/serviceNode.tsx';
let content = fs.readFileSync(file, 'utf8');

// The main issue might be that React Flow nodes have their own container that clips things,
// or our classes aren't taking effect because of Next.js CSS Modules scoping.
// Also, let's make sure the handles are absolutely positioned outside the node properly.
// Let's add a debug border to see where they are
content = content.replace(/!bg-slate-700/g, '!bg-green-500 !visible !opacity-100 !block z-[9999]');

fs.writeFileSync(file, content);
console.log('Added high-z-index to serviceNode handles');
