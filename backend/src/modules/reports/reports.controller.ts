import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get()
    @RequirePermissions('VIEW_REPORTS', 'MANAGE_BOOKINGS')
    getFullReport(@CurrentUser() user: any) {
        return this.reportsService.getFullReport(user.tenantId);
    }

    @Get('bookings')
    @RequirePermissions('VIEW_REPORTS', 'MANAGE_BOOKINGS')
    getBookingsStats(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        return this.reportsService.getBookingsStats(user.tenantId, start, end);
    }

    @Get('trend')
    @RequirePermissions('VIEW_REPORTS', 'MANAGE_BOOKINGS')
    getBookingsTrend(
        @CurrentUser() user: any,
        @Query('days') days?: string,
    ) {
        return this.reportsService.getBookingsTrend(user.tenantId, days ? parseInt(days) : 30);
    }

    @Get('revenue')
    @RequirePermissions('VIEW_REPORTS', 'MANAGE_BOOKINGS')
    getRevenueStats(@CurrentUser() user: any) {
        return this.reportsService.getRevenueStats(user.tenantId);
    }

    @Get('popular-services')
    @RequirePermissions('VIEW_REPORTS', 'MANAGE_BOOKINGS')
    getPopularServices(
        @CurrentUser() user: any,
        @Query('limit') limit?: string,
    ) {
        return this.reportsService.getPopularServices(user.tenantId, limit ? parseInt(limit) : 5);
    }

    @Get('user-activity')
    @RequirePermissions('VIEW_REPORTS', 'MANAGE_BOOKINGS')
    getUserActivity(@CurrentUser() user: any) {
        return this.reportsService.getUserActivity(user.tenantId);
    }

    @Get('time-analysis')
    @RequirePermissions('VIEW_REPORTS', 'MANAGE_BOOKINGS')
    getTimeAnalysis(@CurrentUser() user: any) {
        return this.reportsService.getTimeAnalysis(user.tenantId);
    }
}
