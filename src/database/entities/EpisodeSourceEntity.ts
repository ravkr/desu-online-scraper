import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index
} from 'typeorm';
import { EpisodeEntity } from './EpisodeEntity.js';
import { SourceStatus } from '../SourceStatus.js';

@Entity('episode_sources')
@Index(['episode', 'code'], { unique: true })
export class EpisodeSourceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => EpisodeEntity, (e) => e.sources, {
    onDelete: 'CASCADE'
  })
  episode!: EpisodeEntity;

  @Column({ type: 'varchar', nullable: true })
  index!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'varchar' })
  url!: string;

  @Column({
    type: 'enum',
    enum: SourceStatus,
    default: SourceStatus.UNKNOWN
  })
  status!: SourceStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt!: Date | null;
}
