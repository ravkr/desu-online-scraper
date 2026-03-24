import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PageEntity } from './entities/PageEntity.js';
import { EpisodeEntity } from './entities/EpisodeEntity.js';
import { EpisodeSourceEntity } from './entities/EpisodeSourceEntity.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'desu-online-scraper',
  password: '',
  database: 'desu_online_scraper',
  entities: [PageEntity, EpisodeEntity, EpisodeSourceEntity],
  synchronize: true // TODO: this is only for development
});

try {
  await AppDataSource.initialize();
  console.log('Data Source has been initialized!');
} catch (error) {
  console.error('Error during Data Source initialization', error);
}
