import { Request, Response, NextFunction } from 'express';
import { tradeService } from './trade.service';
import { TradeType } from '../../common/constants/enums';
import { formatGold, formatMoney, toDecimal } from '../../common/utils/decimal';

function mapTrade(trade: {
  id: string;
  userId: string;
  type: TradeType;
  goldAmount: string;
  pricePerGram: string;
  totalCost: string;
  timestamp: Date;
}) {
  return {
    id: trade.id,
    userId: trade.userId,
    type: trade.type,
    goldAmount: formatGold(toDecimal(trade.goldAmount)),
    pricePerGram: formatMoney(toDecimal(trade.pricePerGram)),
    totalCost: formatMoney(toDecimal(trade.totalCost)),
    timestamp: trade.timestamp.toISOString(),
  };
}

export class TradeController {
  buy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goldAmount } = req.body as { goldAmount: string };
      await tradeService.buy(req.user!.id, goldAmount);
      res.status(200).json({ message: 'Buy trade successful' });
    } catch (error) {
      next(error);
    }
  };

  sell = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goldAmount } = req.body as { goldAmount: string };
      await tradeService.sell(req.user!.id, goldAmount);
      res.status(200).json({ message: 'Sell trade successful' });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, type } = req.query as unknown as {
        page: number;
        limit: number;
        type?: TradeType;
      };
      const result = await tradeService.listTrades(req.user!.id, page, limit, type);
      res.json({
        data: result.data.map(mapTrade),
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getHolding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await tradeService.getGoldHolding(req.user!.id);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };
}

export const tradeController = new TradeController();
