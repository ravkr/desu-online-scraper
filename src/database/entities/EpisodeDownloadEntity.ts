import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { EpisodeEntity } from './EpisodeEntity.js';

@Entity('episode_downloads')
@Index(['episodeId'], { unique: true })
export class EpisodeDownloadEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  episodeId!: number;

  @OneToOne(() => EpisodeEntity, (episode) => episode.download, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'episodeId' })
  episode!: EpisodeEntity;

  @Column({ type: 'text' })
  downloadUrl!: string;

  @CreateDateColumn()
  createdAt: Date | undefined;

  @UpdateDateColumn()
  updatedAt: Date | undefined;
}

