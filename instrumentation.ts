export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { IconDownloader } = await import('./lib/icon-downloader');
        console.log('[Expanse] Initializing background tasks...');

        // Only run on the main process to avoid duplicating tasks on workers
        // NEXT_MANUAL_SIGIG is often used to detect the main process in dev
        const isMainProcess = !process.env.NEXT_MANUAL_SIGIG;

        if (isMainProcess) {
            const downloader = new IconDownloader();

            // Icons are now primarily synced during deployment/build.
            // We skip the immediate call to avoid slowing down startup.

            // Setup 24-hour interval (86400000 ms)
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
            setInterval(() => {
                downloader.syncIcons().catch(error => {
                    console.error('[IconDownloader] Scheduled sync failed:', error);
                });
            }, TWENTY_FOUR_HOURS);

            console.log('[Expanse] Icon sync cron scheduled (every 24h).');
        }
    }
}

