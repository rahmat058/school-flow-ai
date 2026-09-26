import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum.js';

@Entity({ name: 'schools' })
@Index('idx_schools_slug', ['slug'], { unique: true })
@Index('idx_schools_subscription_status', ['subscriptionStatus'])
export class School {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'text' })
  name!: string;

  @Column({ name: 'slug', type: 'text' })
  slug!: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'contact_email', type: 'text', nullable: true })
  contactEmail!: string | null;

  @Column({ name: 'contact_phone', type: 'text', nullable: true })
  contactPhone!: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({
    name: 'subscription_status',
    type: 'enum',
    enum: SubscriptionStatus,
    enumName: 'subscription_status',
    default: SubscriptionStatus.TRIAL,
  })
  subscriptionStatus!: SubscriptionStatus;

  @Column({ name: 'settings', type: 'jsonb', default: () => "'{}'::jsonb" })
  settings!: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
