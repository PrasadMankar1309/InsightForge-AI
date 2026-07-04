/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14: mark pdf-lib as an external server package so it runs as native
  // Node.js code instead of being bundled by webpack — fixes the Helvetica.afm
  // ENOENT error on Windows when generating PDFs.
  experimental: {
    serverComponentsExternalPackages: ['pdf-lib'],
  },
};

module.exports = nextConfig;
