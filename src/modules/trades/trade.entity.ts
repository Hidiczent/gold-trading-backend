import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TradeType } from '../../common/constants/enums';
import { User } from '../users/user.entity';

@Entity('trades')
@Index('idx_trades_user_id', ['userId'])
@Index('idx_trades_type', ['type'])
@Index('idx_trades_timestamp', ['timestamp'])
@Index('idx_trades_user_type_ts', ['userId', 'type', 'timestamp'])
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: TradeType })
  type!: TradeType;

  @Column({
    name: 'gold_amount',
    type: 'numeric',
    precision: 20,
    scale: 8,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  goldAmount!: string;

  @Column({
    name: 'price_per_gram',
    type: 'numeric',
    precision: 20,
    scale: 8,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  pricePerGram!: string;

  @Column({
    name: 'total_cost',
    type: 'numeric',
    precision: 20,
    scale: 8,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  totalCost!: string;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
