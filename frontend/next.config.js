module.exports = {
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/graphql',
  //       destination: process.env.BACKEND_URI + '/graphql',
  //     },
  //   ];
  // },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  publicRuntimeConfig: {
    BACKEND_URI: process.env.BACKEND_URI,
  },
};
