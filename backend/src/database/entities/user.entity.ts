import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { School } from './school.entity.js';
import { Role } from '../../common/enums/role.enum.js';

@Entity({ name: 'users' })
@Index('idx_users_email', ['email'], { unique: true })
@Index('idx_users_school_id_role', ['schoolId', 'role'])
@Index('idx_users_verification_token_hash', ['verificationTokenHash'], {
  where: 'verification_token_hash is not null',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId!: string;

  @Column({ name: 'email', type: 'text' })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'role', type: 'enum', enum: Role, enumName: 'role' })
  role!: Role;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'verification_token_hash', type: 'text', nullable: true })
  verificationTokenHash!: string | null;

  @Column({
    name: 'verification_token_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  verificationTokenExpiresAt!: Date | null;

  @Column({ name: 'profile_id', type: 'uuid', nullable: true })
  profileId!: string | null;

  @Column({ name: 'first_name', type: 'text' })
  firstName!: string;

  @Column({ name: 'last_name', type: 'text' })
  lastName!: string;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId!: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => School, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'school_id' })
  school?: School;
}
