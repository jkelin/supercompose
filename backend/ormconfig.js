module.exports = {
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migration/*.entity.js'],
  migrationsRun: true,
  synchronize: false,
  dropSchema: false,
  logging: true,
  autoLoadEntities: true,
  type: 'postgres',
  url: process.env.DATABASE_URL,
  cli: {
    entitiesDir: 'src',
    migrationsDir: 'src/migration',
  },
};
