import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { DashboardService } from './dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryProductsDashboardDto } from './dto/query-products-dashboard.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';
import { ProductsDashboardResponseDto } from './dto/products-dashboard-response.dto';
import { ClientsDashboardResponseDto } from './dto/clients-dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Sales dashboard overview (KPIs + breakdowns)' })
  @ApiOkResponse({
    description: 'Dashboard metrics for the selected window.',
    type: DashboardOverviewResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid range or custom window.',
    type: ErrorResponseDto,
  })
  overview(@Query() query: QueryDashboardDto) {
    return this.dashboard.getOverview(query);
  }

  @Get('products')
  @ApiOperation({ summary: 'Products dashboard inventory stats' })
  @ApiOkResponse({
    description:
      'Inventory metrics: stock totals, low-stock count, categories.',
    type: ProductsDashboardResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters.',
    type: ErrorResponseDto,
  })
  products(@Query() query: QueryProductsDashboardDto) {
    return this.dashboard.getProductsOverview(query);
  }

  @Get('clients')
  @ApiOperation({ summary: 'Clients dashboard: total clients and median LTV' })
  @ApiOkResponse({
    description: 'Total registered clients and the median client LTV.',
    type: ClientsDashboardResponseDto,
  })
  clients() {
    return this.dashboard.getClientsOverview();
  }
}
