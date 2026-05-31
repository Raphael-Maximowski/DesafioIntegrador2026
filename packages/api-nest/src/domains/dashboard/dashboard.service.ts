import { BadRequestException, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../products/categories.service';
import { CustomersService } from '../customers/customers.service';
import { SALE_STATUSES } from '../orders/constants/order-status';
import {
  MONTH_LABELS,
  OTHER_LABEL,
  TOP_N,
  type DateRange,
} from './constants/date-range';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryProductsDashboardDto } from './dto/query-products-dashboard.dto';
import {
  CategorySliceDto,
  DashboardKpisDto,
  DashboardOverviewResponseDto,
  MonthlySalesPointDto,
  RegionSliceDto,
  TopProductDto,
} from './dto/dashboard-overview-response.dto';
import { ProductsDashboardResponseDto } from './dto/products-dashboard-response.dto';
import { ClientsDashboardResponseDto } from './dto/clients-dashboard-response.dto';

interface DateWindow {
  from: Date;
  to: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly orders: OrdersService,
    private readonly products: ProductsService,
    private readonly categories: CategoriesService,
    private readonly customers: CustomersService,
  ) {}

  async getClientsOverview(): Promise<ClientsDashboardResponseDto> {
    const [totalClients, ltvRows] = await Promise.all([
      this.customers.countAll(),
      this.orders.ltvByCustomer(SALE_STATUSES),
    ]);

    const zeros = Math.max(0, totalClients - ltvRows.length);
    const values = [
      ...ltvRows.map((r) => r.ltv),
      ...Array<number>(zeros).fill(0),
    ];

    return { totalClients, medianLtv: median(values) };
  }

  async getProductsOverview(
    query: QueryProductsDashboardDto,
  ): Promise<ProductsDashboardResponseDto> {
    const { lowStockThreshold } = query;
    const [stats, activeCategories] = await Promise.all([
      this.products.getInventoryStats(lowStockThreshold),
      this.categories.countAll(),
    ]);

    return {
      totalStock: stats.totalStock,
      lowStockCount: stats.lowStockCount,
      lowStockThreshold,
      activeCategories,
      totalStockValue: stats.totalStockValue,
    };
  }

  async getOverview(
    query: QueryDashboardDto,
  ): Promise<DashboardOverviewResponseDto> {
    const now = this.now();
    const window = this.resolveWindow(query, now);
    const yearWindow = this.currentYearWindow(now);

    const [summary, monthly, categories, products, regions] = await Promise.all(
      [
        this.orders.salesSummary(window.from, window.to),
        this.orders.monthlySales(yearWindow.from, yearWindow.to),
        this.orders.salesByCategory(window.from, window.to),
        this.orders.topProducts(window.from, window.to, TOP_N),
        this.orders.salesByRegion(window.from, window.to),
      ],
    );

    return {
      kpis: this.buildKpis(summary),
      monthlySales: this.buildMonthlySeries(monthly),
      categories: this.buildCategorySlices(categories),
      topProducts: this.buildTopProducts(products),
      topRegions: this.buildRegionSlices(regions),
    };
  }

  protected now(): Date {
    return new Date();
  }

  private resolveWindow(query: QueryDashboardDto, now: Date): DateWindow {
    const range: DateRange = query.range;

    if (range === 'custom') {
      const { startedAt, finishedAt } = query;
      if (!startedAt || !finishedAt) {
        throw new BadRequestException(
          'startedAt and finishedAt are required when range=custom',
        );
      }
      if (startedAt > finishedAt) {
        throw new BadRequestException(
          'startedAt must be on or before finishedAt',
        );
      }
      return { from: startedAt, to: finishedAt };
    }

    const from = new Date(now);
    if (range === '30d') {
      from.setDate(from.getDate() - 30);
    } else if (range === '6m') {
      from.setMonth(from.getMonth() - 6);
    } else {
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    }
    return { from, to: now };
  }

  private currentYearWindow(now: Date): DateWindow {
    const year = now.getFullYear();
    return {
      from: new Date(year, 0, 1, 0, 0, 0, 0),
      to: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  private buildKpis(summary: {
    totalSales: number;
    orderCount: number;
    distinctCustomers: number;
  }): DashboardKpisDto {
    return {
      totalSales: summary.totalSales,
      totalClients: summary.distinctCustomers,
      orderCount: summary.orderCount,
      averageTicket:
        summary.orderCount > 0
          ? round(summary.totalSales / summary.orderCount)
          : 0,
    };
  }

  private buildMonthlySeries(
    rows: { month: number; total: number }[],
  ): MonthlySalesPointDto[] {
    const totals = new Map(rows.map((r) => [r.month, r.total]));
    return MONTH_LABELS.map((label, index) => {
      const month = index + 1;
      return { label, month, total: totals.get(month) ?? 0 };
    });
  }

  private buildCategorySlices(
    rows: { categoryName: string; revenue: number }[],
  ): CategorySliceDto[] {
    const grandTotal = rows.reduce((sum, r) => sum + r.revenue, 0);
    const slices: CategorySliceDto[] = rows.slice(0, TOP_N).map((r) => ({
      label: r.categoryName,
      amount: r.revenue,
      percentage: percentage(r.revenue, grandTotal),
    }));

    const tail = rows.slice(TOP_N);
    if (tail.length > 0) {
      const amount = tail.reduce((sum, r) => sum + r.revenue, 0);
      slices.push({
        label: OTHER_LABEL,
        amount,
        percentage: percentage(amount, grandTotal),
      });
    }
    return slices;
  }

  private buildTopProducts(
    rows: {
      productId: string;
      name: string;
      categoryName: string;
      revenue: number;
    }[],
  ): TopProductDto[] {
    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      category: r.categoryName,
      amount: r.revenue,
    }));
  }

  private buildRegionSlices(
    rows: { state: string; revenue: number }[],
  ): RegionSliceDto[] {
    const grandTotal = rows.reduce((sum, r) => sum + r.revenue, 0);
    return rows.slice(0, TOP_N).map((r) => ({
      state: r.state,
      amount: r.revenue,
      percentage: percentage(r.revenue, grandTotal),
    }));
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function percentage(amount: number, total: number): number {
  return total > 0 ? round((amount / total) * 100) : 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}
