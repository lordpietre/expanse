import { IconDownloader } from './lib/icon-downloader.js';

async function test() {
    console.log('--- STARTING DEBUG SYNC ---');
    const downloader = new IconDownloader();
    await downloader.syncIcons();
    console.log('--- SYNC FINISHED ---');
}

test().catch(console.error);
