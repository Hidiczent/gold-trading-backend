import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionType } from '../../common/constants/enums';
import { User } from '../users/user.entity';

@Entity('transactions')
@Index('idx_transactions_user_id', ['userId'])
@Index('idx_transactions_type', ['type'])
@Index('idx_transactions_timestamp', ['timestamp'])
@Index('idx_transactions_user_type_ts', ['userId', 'type', 'timestamp'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 8,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  amount!: string;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
