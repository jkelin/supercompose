module.exports = {
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/graphql',
  //       destination: process.env.BACKEND_URI + '/graphql',
  //     },
  //   ];
  // },

  publicRuntimeConfig: {
    BACKEND_URI: process.env.BACKEND_URI,
  },
};
