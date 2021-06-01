module.exports = {
  async rewrites() {
    return [
      // {
      //   source: '/api/graphql',
      //   destination: process.env.BACKEND_URI + '/graphql',
      // },
      {
        source: '/_panelbear.js',
        destination: 'https://cdn.panelbear.com/analytics.js',
      },
      {
        source: '/_panelbear/:path*',
        destination: 'https://api.panelbear.com/:path*',
      },
    ];
  },
  // webpack(config) {
  //   config.module.rules.push({
  //     test: /\.svg$/,
  //     use: ['@svgr/webpack'],
  //   });

  //   return config;
  // },

  publicRuntimeConfig: {
    BACKEND_URI: process.env.BACKEND_URI,
    PANELBEAR_SITE_ID: process.env.PANELBEAR_SITE_ID,
  },
};
