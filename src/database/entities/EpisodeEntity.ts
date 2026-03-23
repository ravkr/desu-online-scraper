import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn, OneToOne
} from 'typeorm';
import { EpisodeSource } from './EpisodeSource.js';
import { PageEntity } from './PageEntity.js';

@Entity('episodes')
export class EpisodeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'integer' })
  pageId!: number;

  @Index({ unique: true })
  @Column({ type: 'integer' })
  wpPageId!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  author!: string;

  @Column({ type: 'timestamp', nullable: true })
  datePublished!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateModified!: Date;

  @Index()
  @Column({ type: 'varchar' })
  seriesName!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string;

  @OneToOne(() => PageEntity, { cascade: true })
  pageEntity!: PageEntity;

  @OneToMany(() => EpisodeSource, (s) => s.episode)
  sources!: EpisodeSource[];

  @CreateDateColumn()
  createdAt: Date | undefined;

  @UpdateDateColumn()
  updatedAt: Date | undefined;
}