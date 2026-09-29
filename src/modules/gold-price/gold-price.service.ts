import { env } from '../../config/env';
import { Decimal, formatMoney } from '../../common/utils/decimal';

export interface GoldPriceSnapshot {
  pricePerGram: string;
  currency: string;
  updatedAt: Date;
}

export interface GoldPriceProvider {
  getCurrentPrice(): Promise<GoldPriceSnapshot>;
}

class EnvGoldPriceProvider implements GoldPriceProvider {
  private price: Decimal;
  private updatedAt: Date;

  constructor() {
    this.price = new Decimal(env.GOLD_PRICE_PER_GRAM);
    this.updatedAt = new Date();
  }

  getCurrentPrice(): Promise<GoldPriceSnapshot> {
    return Promise.resolve({
      pricePerGram: formatMoney(this.price),
      currency: 'LAK',
      updatedAt: this.updatedAt,
    });
  }

  setPrice(pricePerGram: string): void {
    this.price = new Decimal(pricePerGram);
    this.updatedAt = new Date();
  }
}

class SimulatedGoldPriceProvider implements GoldPriceProvider {
  private price: Decimal;
  private updatedAt: Date;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly basePrice: Decimal) {
    this.price = basePrice;
    this.updatedAt = new Date();
  }

  start(intervalMs = 30_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const fluctuation = (Math.random() - 0.5) * 0.02;
      this.price = this.basePrice.mul(new Decimal(1 + fluctuation));
      this.updatedAt = new Date();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getCurrentPrice(): Promise<GoldPriceSnapshot> {
    return Promise.resolve({
      pricePerGram: formatMoney(this.price),
      currency: 'LAK',
      updatedAt: this.updatedAt,
    });
  }
}

const base = new Decimal(env.GOLD_PRICE_PER_GRAM);
const envProvider = new EnvGoldPriceProvider();
const simulatedProvider = new SimulatedGoldPriceProvider(base);

export class GoldPriceService {
  constructor(private readonly provider: GoldPriceProvider = envProvider) {}

  async getPrice(): Promise<GoldPriceSnapshot> {
    return this.provider.getCurrentPrice();
  }

  getPriceDecimal(): Promise<Decimal> {
    return this.getPrice().then((p) => new Decimal(p.pricePerGram));
  }
}

export const goldPriceService = new GoldPriceService(
  env.NODE_ENV === 'development' ? simulatedProvider : envProvider,
);

if (env.NODE_ENV === 'development') {
  simulatedProvider.start();
}
