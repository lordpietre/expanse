import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const withNextIntl = createNextIntlPlugin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const json = require("./package.json");

const nextConfig = {
	output: 'standalone',
	outputFileTracingRoot: __dirname,
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		remotePatterns: [new URL('https://directus.composecraft.com/assets/**')],
	},
	env: {
		NEXT_PUBLIC_VERSION: json.version,
	},
	async rewrites() {
		return [
			{
				source: "/mesures/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/mesures/:path*",
				destination: "https://eu.i.posthog.com/:path*",
			},
		];
	},
	skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);