/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Allow remote images from any domain.  Although this application
  // doesn't use Next's <Image> component, enabling remote patterns
  // here ensures that if a developer swaps in <Image> later on, the
  // TikTok CDN images will load correctly.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;