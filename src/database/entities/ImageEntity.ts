import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { EpisodeEntity } from './EpisodeEntity.js';

@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  url!: string;

  @OneToMany(() => EpisodeEntity, (episode) => episode.image)
  episodes!: EpisodeEntity[];

  @CreateDateColumn()
  createdAt: Date | undefined;

  @UpdateDateColumn()
  updatedAt: Date | undefined;
}
