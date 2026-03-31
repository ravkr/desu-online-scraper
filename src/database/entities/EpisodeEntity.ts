import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne
} from 'typeorm';
import { EpisodeSourceEntity } from './EpisodeSourceEntity.js';
import { PageEntity } from './PageEntity.js';
import { SeriesEntity } from './SeriesEntity.js';

@Entity('episodes')
@Index(['seriesId', 'episodeNumber'], { unique: true })
export class EpisodeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'integer' })
  pageId!: number;

  @Index({ unique: true })
  @Column({ type: 'integer' })
  wpPageId!: number;

  @Index()
  @Column({ type: 'integer' })
  episodeNumber!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  author!: string;

  @Column({ type: 'timestamp', nullable: true })
  datePublished!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateModified!: Date;

  @Index()
  @Column({ type: 'integer' })
  seriesId!: number;

  @ManyToOne(() => SeriesEntity, (series) => series.episodes, {
    nullable: false
  })
  @JoinColumn({ name: 'seriesId' })
  series!: SeriesEntity;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string;

  @OneToOne(() => PageEntity, { cascade: true })
  pageEntity!: PageEntity;

  @OneToMany(() => EpisodeSourceEntity, (s) => s.episode)
  sources!: EpisodeSourceEntity[];

  @CreateDateColumn()
  createdAt: Date | undefined;

  @UpdateDateColumn()
  updatedAt: Date | undefined;
}
