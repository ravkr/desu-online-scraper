import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { EpisodeEntity } from './EpisodeEntity.js';

@Entity('series')
export class SeriesEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  seriesName!: string;

  @Column({ type: 'varchar', nullable: true })
  seriesTitle!: string | null;

  @OneToMany(() => EpisodeEntity, (episode) => episode.series)
  episodes!: EpisodeEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

