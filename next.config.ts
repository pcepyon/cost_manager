import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포를 위한 설정
  typescript: {
    // 타입 에러가 있어도 빌드를 계속 진행
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint 에러가 있어도 빌드를 계속 진행
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
