/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // The pitch deck is a self-contained HTML page served from /public.
    return [{ source: "/slide", destination: "/slide.html" }];
  },
};

export default nextConfig;
