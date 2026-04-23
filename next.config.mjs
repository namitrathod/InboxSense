/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push({
                'onnxruntime-node': 'commonjs onnxruntime-node',
            });
        }
        config.module.rules.push({
            test: /\.node$/,
            use: 'node-loader',
        });
        return config;
    },
};

export default nextConfig;
