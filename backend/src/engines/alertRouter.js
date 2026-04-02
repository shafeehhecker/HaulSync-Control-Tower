import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

/**
 * alertRouter.js — rule-based notification dispatcher.
 *
 * For each raised exception, finds matching AlertRule records and
 * creates Alert records. Dispatches notifications via the configured
 * channels (IN_APP via Socket.io, EMAIL via SMTP, WEBHOOK via HTTP).
 */

let _io = null;
export function setSocketIO(io) { _io = io; }

const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

/**
 * Route alerts for a newly raised exception.
 * @param {Object} exception - Prisma Exception record
 * @param {Object} shipment  - Prisma Shipment record
 */
export async function routeAlerts(exception, shipment) {
  // Find matching rules (source-specific rules first, then wildcard)
  const rules = await prisma.alertRule.findMany({
    where: {
      exceptionType: exception.type,
      active:        true,
      OR: [
        { source: shipment.source },
        { source: '*' },
      ],
    },
    orderBy: { source: 'desc' }, // specific before wildcard
  });

  if (!rules.length) return;
  const rule = rules[0]; // use most-specific matching rule

  // Find users with the notify roles
  const notifyUsers = await prisma.user.findMany({
    where: { role: { in: rule.notifyRoles }, active: true },
  });

  for (const user of notifyUsers) {
    for (const channel of rule.channels) {
      const alert = await prisma.alert.create({
        data: {
          exceptionId: exception.id,
          assignedTo:  user.id,
          role:        user.role,
          channel,
          status:      'PENDING',
        },
      });

      // Dispatch to channel
      if (channel === 'IN_APP' && _io) {
        _io.to(`role:${user.role}`).emit('alert:new', {
          alertId:       alert.id,
          exceptionId:   exception.id,
          exceptionType: exception.type,
          severity:      exception.severity,
          shipmentRef:   shipment.reference,
        });
      }

      if (channel === 'EMAIL' && mailer) {
        await sendEmail(user.email, exception, shipment).catch(console.error);
      }

      if (channel === 'WEBHOOK' && process.env.WEBHOOK_URL) {
        await fireWebhook(process.env.WEBHOOK_URL, { alert, exception, shipment }).catch(console.error);
      }
    }
  }

  // Schedule escalation
  if (rule.escalateAfterMinutes > 0 && rule.escalateToRoles.length > 0) {
    setTimeout(
      () => escalate(exception.id, rule.escalateToRoles, rule.channels),
      rule.escalateAfterMinutes * 60 * 1000
    );
  }
}

async function escalate(exceptionId, escalateToRoles, channels) {
  const exception = await prisma.exception.findUnique({ where: { id: exceptionId } });
  if (!exception || exception.status === 'RESOLVED') return;

  // Mark existing alerts as escalated
  await prisma.alert.updateMany({
    where: { exceptionId, status: { not: 'RESOLVED' } },
    data:  { status: 'ESCALATED', escalatedAt: new Date() },
  });

  await prisma.exception.update({
    where: { id: exceptionId },
    data:  { status: 'ESCALATED' },
  });

  if (_io) {
    _io.emit('exception:escalated', { exceptionId, escalateToRoles });
  }
}

async function sendEmail(to, exception, shipment) {
  if (!mailer) return;
  await mailer.sendMail({
    from:    process.env.SMTP_USER,
    to,
    subject: `[Control Tower] ${exception.type.replace(/_/g,' ')} — ${shipment.reference}`,
    text:    `Exception raised on shipment ${shipment.reference}.\n\nType: ${exception.type}\nSeverity: ${exception.severity}\nDetails: ${exception.description}\n\nLog in to Control Tower to take action.`,
  });
}

async function fireWebhook(url, payload) {
  await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
}
