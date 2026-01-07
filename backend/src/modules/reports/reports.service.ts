import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,
        @InjectRepository(Service)
        private serviceRepository: Repository<Service>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async getBookingsStats(tenantId: string, startDate: Date, endDate: Date) {
        const bookings = await this.bookingRepository.find({
            where: {
                tenantId,
                deletedAt: IsNull(),
                startTime: Between(startDate, endDate),
            },
            relations: ['service'],
        });

        // Total por estado
        const byStatus = {
            pending: bookings.filter(b => b.status === BookingStatus.PENDING).length,
            confirmed: bookings.filter(b => b.status === BookingStatus.CONFIRMED).length,
            completed: bookings.filter(b => b.status === BookingStatus.COMPLETED).length,
            cancelled: bookings.filter(b => b.status === BookingStatus.CANCELLED).length,
        };

        // Total general
        const total = bookings.length;

        // Ingresos (solo confirmadas y completadas)
        const revenue = bookings
            .filter(b => [BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(b.status))
            .reduce((sum, b) => sum + (Number(b.service?.price) || 0), 0);

        return { total, byStatus, revenue };
    }

    async getBookingsTrend(tenantId: string, days: number = 15) {
        const endDate = new Date();
        const startDate = new Date();
        // Retroceder days-1 días para que HOY sea el último día
        startDate.setDate(startDate.getDate() - (days - 1));

        const bookings = await this.bookingRepository.find({
            where: {
                tenantId,
                deletedAt: IsNull(),
                createdAt: Between(startDate, endDate),
            },
        });

        // Agrupar por día - desde startDate hasta hoy (days días)
        const trend: Record<string, number> = {};
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const key = date.toISOString().split('T')[0];
            trend[key] = 0;
        }

        bookings.forEach(b => {
            const key = new Date(b.createdAt).toISOString().split('T')[0];
            if (trend[key] !== undefined) {
                trend[key]++;
            }
        });

        return Object.entries(trend).map(([date, count]) => ({ date, count }));
    }

    async getRevenueStats(tenantId: string) {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Ingresos mes actual
        const currentMonthBookings = await this.bookingRepository.find({
            where: {
                tenantId,
                deletedAt: IsNull(),
                status: BookingStatus.COMPLETED,
                startTime: Between(currentMonth, now),
            },
            relations: ['service'],
        });

        // Ingresos mes anterior
        const lastMonthBookings = await this.bookingRepository.find({
            where: {
                tenantId,
                deletedAt: IsNull(),
                status: BookingStatus.COMPLETED,
                startTime: Between(lastMonth, lastMonthEnd),
            },
            relations: ['service'],
        });

        const currentRevenue = currentMonthBookings.reduce((sum, b) => sum + (Number(b.service?.price) || 0), 0);
        const lastRevenue = lastMonthBookings.reduce((sum, b) => sum + (Number(b.service?.price) || 0), 0);

        // Ingresos por servicio (mes actual)
        const byService: Record<string, { name: string; revenue: number; count: number }> = {};
        currentMonthBookings.forEach(b => {
            if (b.service) {
                if (!byService[b.serviceId]) {
                    byService[b.serviceId] = { name: b.service.name, revenue: 0, count: 0 };
                }
                byService[b.serviceId].revenue += Number(b.service.price) || 0;
                byService[b.serviceId].count++;
            }
        });

        return {
            currentMonth: currentRevenue,
            lastMonth: lastRevenue,
            growth: lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0,
            byService: Object.values(byService).sort((a, b) => b.revenue - a.revenue),
        };
    }

    async getPopularServices(tenantId: string, limit: number = 5) {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);

        const bookings = await this.bookingRepository.find({
            where: {
                tenantId,
                deletedAt: IsNull(),
                createdAt: Between(fifteenDaysAgo, new Date()),
            },
            relations: ['service'],
        });

        // Agrupar por servicio
        const serviceStats: Record<string, { name: string; total: number; completed: number }> = {};

        bookings.forEach(b => {
            if (b.service) {
                if (!serviceStats[b.serviceId]) {
                    serviceStats[b.serviceId] = { name: b.service.name, total: 0, completed: 0 };
                }
                serviceStats[b.serviceId].total++;
                if (b.status === BookingStatus.COMPLETED) {
                    serviceStats[b.serviceId].completed++;
                }
            }
        });

        return Object.entries(serviceStats)
            .map(([serviceId, stats]) => ({
                serviceId,
                serviceName: stats.name,
                bookingCount: stats.total,
                completedCount: stats.completed,
                completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
            }))
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, limit);
    }

    async getUserActivity(tenantId: string) {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);

        // Obtener reservas con usuarios
        const bookings = await this.bookingRepository.find({
            where: {
                tenantId,
                deletedAt: IsNull(),
                createdAt: Between(fifteenDaysAgo, new Date()),
            },
            relations: ['user'],
        });

        // Agrupar por usuario
        const userStats: Record<string, { name: string; email: string; count: number }> = {};
        bookings.forEach(b => {
            if (b.user) {
                if (!userStats[b.userId]) {
                    const name = `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || b.user.email;
                    userStats[b.userId] = { name, email: b.user.email, count: 0 };
                }
                userStats[b.userId].count++;
            }
        });

        const topClients = Object.entries(userStats)
            .map(([userId, stats]) => ({
                userId,
                name: stats.name,
                email: stats.email,
                bookingCount: stats.count,
            }))
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 5);

        // Nuevos registros
        const newUsers = await this.userRepository.count({
            where: {
                tenantId,
                deletedAt: IsNull(),
                createdAt: Between(fifteenDaysAgo, new Date()),
            },
        });

        const totalUsers = await this.userRepository.count({
            where: {
                tenantId,
                deletedAt: IsNull(),
            },
        });

        return {
            topClients,
            newUsers,
            totalUsers,
        };
    }

    async getTimeAnalysis(tenantId: string) {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);

        const bookings = await this.bookingRepository.find({
            where: {
                tenantId,
                deletedAt: IsNull(),
                createdAt: Between(fifteenDaysAgo, new Date()),
            },
        });

        // Horarios más demandados (agrupado por hora)
        const byHour: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
            byHour[i] = 0;
        }

        // Días más activos
        const byDayOfWeek: Record<number, number> = {};
        for (let i = 0; i < 7; i++) {
            byDayOfWeek[i] = 0;
        }

        bookings.forEach(b => {
            const date = new Date(b.startTime);
            const hour = date.getHours();
            const day = date.getDay();

            byHour[hour]++;
            byDayOfWeek[day]++;
        });

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        return {
            peakHours: Object.entries(byHour)
                .map(([hour, count]) => ({ hour: parseInt(hour), count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            busiestDays: Object.entries(byDayOfWeek)
                .map(([day, count]) => ({ day: dayNames[parseInt(day)], dayIndex: parseInt(day), count }))
                .sort((a, b) => b.count - a.count),
        };
    }

    async getFullReport(tenantId: string) {
        const now = new Date();
        const fifteenDaysAgo = new Date();
        // 14 días atrás para que HOY sea el día 15 (incluyendo hoy)
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);

        const [bookingsStats, trend, revenue, popularServices, userActivity, timeAnalysis] = await Promise.all([
            this.getBookingsStats(tenantId, fifteenDaysAgo, now),
            this.getBookingsTrend(tenantId, 15),
            this.getRevenueStats(tenantId),
            this.getPopularServices(tenantId),
            this.getUserActivity(tenantId),
            this.getTimeAnalysis(tenantId),
        ]);

        return {
            bookings: bookingsStats,
            trend,
            revenue,
            popularServices,
            userActivity,
            timeAnalysis,
        };
    }
}
