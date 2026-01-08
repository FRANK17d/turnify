import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly fromAddress: string;
  private readonly appName: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.password');

    this.logger.log(`📧 Email Config: host=${host}, port=${port}, user=${user ? '***' : 'MISSING'}, pass=${pass ? '***' : 'MISSING'}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 10000,
      socketTimeout: 30000, // 30 segundos
    });

    this.fromAddress = this.configService.get<string>('mail.from') || 'noreply@turnify.com';
    this.appName = this.configService.get<string>('mail.appName') || 'Turnify';
    this.frontendUrl = this.configService.get<string>('mail.frontendUrl') || 'http://localhost:4200';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.appName}" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || this.stripHtml(options.html),
        html: options.html,
      });

      this.logger.log(`Email enviado a ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email a ${options.to}: ${error.message}`, error.stack);
      return false;
    }
  }

  // ==================== BOOKING EMAILS ====================
  async sendBookingCreated(
    email: string,
    data: {
      userName: string;
      serviceName: string;
      date: string;
      time: string;
      duration: number;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>¡Reserva Recibida!</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Hemos recibido tu solicitud de reserva y está <strong>pendiente de confirmación</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📋 Servicio:</strong> ${data.serviceName}</p>
        <p><strong>📅 Fecha:</strong> ${data.date}</p>
        <p><strong>🕐 Hora:</strong> ${data.time}</p>
        <p><strong>⏱️ Duración:</strong> ${data.duration} minutos</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>Te notificaremos en cuanto sea confirmada.</p>
    `, 'Reserva Recibida');

    return this.sendEmail({
      to: email,
      subject: `🗓️ Reserva recibida - ${data.serviceName}`,
      html,
    });
  }

  async sendBookingConfirmation(
    email: string,
    data: {
      userName: string;
      serviceName: string;
      date: string;
      time: string;
      duration: number;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>¡Reserva Confirmada!</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Tu reserva ha sido confirmada exitosamente.</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📋 Servicio:</strong> ${data.serviceName}</p>
        <p><strong>📅 Fecha:</strong> ${data.date}</p>
        <p><strong>🕐 Hora:</strong> ${data.time}</p>
        <p><strong>⏱️ Duración:</strong> ${data.duration} minutos</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>¡Te esperamos!</p>
    `, 'Reserva Confirmada');

    return this.sendEmail({
      to: email,
      subject: `✅ Reserva confirmada - ${data.serviceName}`,
      html,
    });
  }

  async sendBookingReminder(
    email: string,
    data: {
      userName: string;
      serviceName: string;
      date: string;
      time: string;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>🔔 Recordatorio de Reserva</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Te recordamos que tienes una reserva próxima:</p>
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📋 Servicio:</strong> ${data.serviceName}</p>
        <p><strong>📅 Fecha:</strong> ${data.date}</p>
        <p><strong>🕐 Hora:</strong> ${data.time}</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>¡No olvides asistir!</p>
    `, 'Recordatorio de Reserva');

    return this.sendEmail({
      to: email,
      subject: `🔔 Recordatorio: Tu reserva de ${data.serviceName} es pronto`,
      html,
    });
  }

  async sendBookingCancellation(
    email: string,
    data: {
      userName: string;
      serviceName: string;
      date: string;
      time: string;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>Reserva Cancelada</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Tu reserva ha sido cancelada.</p>
      <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📋 Servicio:</strong> ${data.serviceName}</p>
        <p><strong>📅 Fecha:</strong> ${data.date}</p>
        <p><strong>🕐 Hora:</strong> ${data.time}</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>Si deseas reagendar, puedes hacerlo desde tu cuenta.</p>
    `, 'Reserva Cancelada');

    return this.sendEmail({
      to: email,
      subject: `❌ Reserva cancelada - ${data.serviceName}`,
      html,
    });
  }

  async sendNewBookingToAdmin(
    email: string,
    data: {
      adminName: string;
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>🔔 Nueva Reserva Recibida</h2>
      <p>Hola <strong>${data.adminName}</strong>,</p>
      <p>El cliente <strong>${data.clientName}</strong> ha realizado una nueva reserva.</p>
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>👤 Cliente:</strong> ${data.clientName}</p>
        <p><strong>📋 Servicio:</strong> ${data.serviceName}</p>
        <p><strong>📅 Fecha:</strong> ${data.date}</p>
        <p><strong>🕐 Hora:</strong> ${data.time}</p>
      </div>
      <p>Ingresa al panel para confirmarla.</p>
    `, 'Nueva Reserva (Admin)');

    return this.sendEmail({
      to: email,
      subject: `🔔 Nueva reserva de ${data.clientName} - ${data.serviceName}`,
      html,
    });
  }

  async sendCancellationToAdmin(
    email: string,
    data: {
      adminName: string;
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>⚠️ Reserva Cancelada</h2>
      <p>Hola <strong>${data.adminName}</strong>,</p>
      <p>El cliente <strong>${data.clientName}</strong> ha cancelado su reserva.</p>
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
       <p><strong>👤 Cliente:</strong> ${data.clientName}</p>
        <p><strong>📋 Servicio:</strong> ${data.serviceName}</p>
        <p><strong>📅 Fecha:</strong> ${data.date}</p>
        <p><strong>🕐 Hora:</strong> ${data.time}</p>
      </div>
    `, 'Reserva Cancelada (Admin)');

    return this.sendEmail({
      to: email,
      subject: `⚠️ Cancelación de ${data.clientName} - ${data.serviceName}`,
      html,
    });
  }

  // ==================== SUBSCRIPTION EMAILS ====================
  async sendSubscriptionCreated(
    email: string,
    data: {
      userName: string;
      planName: string;
      tenantName: string;
      price: number;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>🎉 ¡Bienvenido a ${data.planName}!</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Tu suscripción al plan <strong>${data.planName}</strong> ha sido activada exitosamente.</p>
      <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📦 Plan:</strong> ${data.planName}</p>
        <p><strong>💰 Precio:</strong> $${data.price}/mes</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>Ya puedes disfrutar de todas las funcionalidades de tu plan.</p>
    `, 'Suscripción Activada');

    return this.sendEmail({
      to: email,
      subject: `🎉 Bienvenido al plan ${data.planName}`,
      html,
    });
  }

  async sendSubscriptionExpiring(
    email: string,
    data: {
      userName: string;
      planName: string;
      tenantName: string;
      expirationDate: string;
      daysRemaining: number;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>⚠️ Tu suscripción está por vencer</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Tu suscripción al plan <strong>${data.planName}</strong> vencerá en <strong>${data.daysRemaining} días</strong>.</p>
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📦 Plan:</strong> ${data.planName}</p>
        <p><strong>📅 Fecha de vencimiento:</strong> ${data.expirationDate}</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>Renueva tu suscripción para seguir disfrutando de todas las funcionalidades.</p>
      <a href="${this.frontendUrl}/subscription" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Renovar Suscripción</a>
    `, 'Suscripción Por Vencer');

    return this.sendEmail({
      to: email,
      subject: `⚠️ Tu suscripción vence en ${data.daysRemaining} días`,
      html,
    });
  }

  async sendSubscriptionExpired(
    email: string,
    data: {
      userName: string;
      planName: string;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>🔴 Tu suscripción ha expirado</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Tu suscripción al plan <strong>${data.planName}</strong> ha expirado.</p>
      <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📦 Plan:</strong> ${data.planName}</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>Tu cuenta ahora está en modo restringido. Renueva tu suscripción para recuperar el acceso completo.</p>
      <a href="${this.frontendUrl}/subscription" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Renovar Ahora</a>
    `, 'Suscripción Expirada');

    return this.sendEmail({
      to: email,
      subject: `🔴 Tu suscripción ha expirado`,
      html,
    });
  }

  async sendSubscriptionCancelled(
    email: string,
    data: {
      userName: string;
      planName: string;
      tenantName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>Suscripción Cancelada</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Tu suscripción al plan <strong>${data.planName}</strong> ha sido cancelada.</p>
      <div style="background-color: #e2e3e5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📦 Plan:</strong> ${data.planName}</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>Tu cuenta pasará a modo restringido al finalizar el período de facturación actual.</p>
      <p>Si cambias de opinión, puedes reactivar tu suscripción en cualquier momento.</p>
    `, 'Suscripción Cancelada');

    return this.sendEmail({
      to: email,
      subject: `Suscripción cancelada - ${data.planName}`,
      html,
    });
  }

  async sendPaymentFailed(
    email: string,
    data: {
      userName: string;
      planName: string;
      tenantName: string;
      amount: number;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>❌ Error en el Pago</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>No pudimos procesar el pago de tu suscripción.</p>
      <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📦 Plan:</strong> ${data.planName}</p>
        <p><strong>💰 Monto:</strong> $${data.amount}</p>
        <p><strong>🏢 Empresa:</strong> ${data.tenantName}</p>
      </div>
      <p>Por favor, actualiza tu método de pago para evitar la suspensión del servicio.</p>
      <a href="${this.frontendUrl}/subscription/billing" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Actualizar Método de Pago</a>
    `, 'Error en el Pago');

    return this.sendEmail({
      to: email,
      subject: `❌ Error al procesar tu pago`,
      html,
    });
  }

  // ==================== AUTH EMAILS ====================
  async sendPasswordReset(
    email: string,
    data: {
      userName: string;
      resetUrl: string;
      expiresIn: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>🔑 Recuperación de Contraseña</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <a href="${data.resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Restablecer Contraseña</a>
      <p style="color: #6c757d; font-size: 14px;">Este enlace expira en ${data.expiresIn}.</p>
      <p style="color: #6c757d; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    `, 'Recuperar Contraseña');

    return this.sendEmail({
      to: email,
      subject: `🔑 Recupera tu contraseña`,
      html,
    });
  }

  async sendPasswordChanged(
    email: string,
    data: {
      userName: string;
    },
  ): Promise<boolean> {
    const html = this.getEmailTemplate(`
      <h2>✅ Contraseña Actualizada</h2>
      <p>Hola <strong>${data.userName}</strong>,</p>
      <p>Tu contraseña ha sido actualizada exitosamente.</p>
      <p>Si no realizaste este cambio, contacta a soporte inmediatamente.</p>
    `, 'Contraseña Actualizada');

    return this.sendEmail({
      to: email,
      subject: `✅ Tu contraseña ha sido actualizada`,
      html,
    });
  }

  // ==================== HELPERS ====================
  private getEmailTemplate(content: string, title: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0; font-size: 28px;">${this.appName}</h1>
            </div>
            ${content}
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este es un correo automático de ${this.appName}. Por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
