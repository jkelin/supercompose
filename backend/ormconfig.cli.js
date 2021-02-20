module.exports = {
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migration/*.ts'],
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
