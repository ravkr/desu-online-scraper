import "reflect-metadata"
import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from "typeorm"

@Entity('pages')
export class PageEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "varchar", unique: true, length: 255 })
    url!: string

    @Column({ type: "varchar", length: 16 })
    sitemapSource!: string

    @Column({ type: 'timestamp', nullable: true })
    sitemapLastModified!: Date | null

    @CreateDateColumn({ type: 'timestamp' })
    firstSeen!: Date

    @UpdateDateColumn({ type: 'timestamp' })
    lastSeen!: Date
}
