import { prisma } from "@/lib/prisma";

type AuditEventInput = {
  action: string;
  userId?: string | null;
  userEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: unknown;
  path?: string | null;
  method?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  request?: Request;
};

function getRequestDetails(request?: Request) {
  if (!request) {
    return {};
  }

  const url = new URL(request.url);
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor
    ? forwardedFor.split(",")[0]?.trim()
    : request.headers.get("x-real-ip");

  return {
    path: `${url.pathname}${url.search}`,
    method: request.method,
    ip: ip || null,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function logAuditEvent(input: AuditEventInput) {
  const requestDetails = getRequestDetails(input.request);

  return prisma.auditLog.create({
    data: {
      action: input.action,
      userId: input.userId ?? null,
      userEmail: input.userEmail ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
      path: input.path ?? requestDetails.path ?? null,
      method: input.method ?? requestDetails.method ?? null,
      ip: input.ip ?? requestDetails.ip ?? null,
      userAgent: input.userAgent ?? requestDetails.userAgent ?? null,
    },
  });
}

export function truncateAuditValue(value: string | null | undefined, max = 240) {
  if (!value) {
    return null;
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}
