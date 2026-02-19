import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from "typeorm"

@Entity('pages')
export class PageEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true, length: 255 })
    url!: string

    @Column({ length: 16 })
    sitemapSource!: string

    @Column({ type: 'timestamp' })
    sitemapLastModified!: Date

    @CreateDateColumn({ type: 'timestamp' })
    firstSeen!: Date

    @UpdateDateColumn({ type: 'timestamp' })
    lastSeen!: Date
}
