import { User } from '../modules/users/user.entity';
import { Wallet } from '../modules/wallets/wallet.entity';
import { GoldHolding } from '../modules/trades/gold-holding.entity';
import { Transaction } from '../modules/transactions/transaction.entity';
import { Trade } from '../modules/trades/trade.entity';
import { Broadcast } from '../modules/admin/broadcast.entity';

export const entities = [User, Wallet, GoldHolding, Transaction, Trade, Broadcast];
