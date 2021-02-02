module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: process.env.BACKEND_URI + '/graphql',
      },
    ];
  },
};
