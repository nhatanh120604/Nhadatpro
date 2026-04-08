'use server';

import prisma from '@/lib/prisma';
import {
  assertPropertyAccess,
  assertPropertyOwner,
  isTenant,
  normalizeActionError,
  parseId,
  requireRole,
  requireSession,
} from '@/lib/authz';
import { generateInviteCode, getInviteExpiryDate, hashInviteCode } from '@/lib/invite-codes';
import {
  approveUnitConnectionAndCreateLeaseSchema,
  executeLeaseTerminationSchema,
  getConnectionRequestSchema,
  rejectConnectionRequestSchema,
  requestEarlyTerminationSchema,
  requestUnitConnectionSchema,
  unitInviteSchema,
  type ApproveUnitConnectionAndCreateLeaseInput,
  type ExecuteLeaseTerminationInput,
  type GetConnectionRequestInput,
  type RejectConnectionRequestInput,
  type RequestEarlyTerminationInput,
  type RequestUnitConnectionInput,
  type UnitInviteInput,
} from './leases.validation';

type ActionResponse<T = null> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};

type InviteCodeData = {
  inviteCode: string;
  expiresAt: string;
};

type TenantConnectionState = {
  activeLease: {
    leaseId: string;
    propertyName: string;
    propertyId: string;
    unitCode: string;
    endDate?: string;
  } | null;
  pendingRequests: {
    requestId: string;
    propertyName: string;
    propertyId: string;
    unitCode: string;
    requestedAt: string;
  }[];
};

type TenantContractData = {
  leaseId: string;
  propertyName: string;
  propertyId: string;
  unitCode: string;
  startDate: string;
  endDate: string;
  dueDayOfMonth: number;
  baseRent: string;
  depositAmount: string;
  managementFee: string;
  utilityNote: string | null;
  status: string;
  terminationRequestedAt: string | null;
  terminationRequestedNote: string | null;
  terminatedAt: string | null;
};

type UnitConnectionRequestRow = {
  requestId: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitCode: string;
  tenantName: string;
  tenantEmail: string | null;
  tenantPhone: string | null;
  requestedAt: string;
  defaultMonthlyRent: string | null;
  defaultDeposit: string | null;
};

type UnitConnectionRequestDetail = UnitConnectionRequestRow & {
  inviteId: string;
};

type LeaseTerminationRequestRow = {
  leaseId: string;
  propertyId: string;
  propertyName: string;
  unitCode: string;
  tenantName: string;
  requestedAt: string;
  note: string | null;
};

function toDateString(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function parseDateInput(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('INVALID_DATE');
  }

  return parsed;
}

async function getUnitWithProperty(unitId: bigint) {
  return prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      id: true,
      propertyId: true,
      unitCode: true,
      defaultMonthlyRent: true,
      defaultDeposit: true,
      property: {
        select: {
          id: true,
          propertyName: true,
        },
      },
    },
  });
}

export async function generateUnitInviteCode(
  payload: UnitInviteInput
): Promise<ActionResponse<InviteCodeData>> {
  const parsed = unitInviteSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['OWNER', 'ADMIN']);
    const unitId = parseId(parsed.data.unitId);
    const unit = await getUnitWithProperty(unitId);

    if (!unit) {
      return { success: false, message: 'Unit not found' };
    }

    await assertPropertyOwner(session, unit.propertyId);

    const inviteCode = generateInviteCode(`UNIT${unit.unitCode.toUpperCase()}`);
    const expiresAt = getInviteExpiryDate();

    await prisma.$transaction([
      prisma.unitInviteCode.updateMany({
        where: {
          unitId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      prisma.unitInviteCode.create({
        data: {
          unitId,
          codeHash: hashInviteCode(inviteCode),
          expiresAt,
          createdById: parseId(session.userId),
        },
      }),
    ]);

    return {
      success: true,
      data: {
        inviteCode,
        expiresAt: expiresAt.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to generate unit invite code') };
  }
}

export async function revokeUnitInviteCode(payload: UnitInviteInput): Promise<ActionResponse> {
  const parsed = unitInviteSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['OWNER', 'ADMIN']);
    const unitId = parseId(parsed.data.unitId);
    const unit = await getUnitWithProperty(unitId);

    if (!unit) {
      return { success: false, message: 'Unit not found' };
    }

    await assertPropertyOwner(session, unit.propertyId);

    await prisma.unitInviteCode.updateMany({
      where: {
        unitId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true, message: 'Unit invite code revoked' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to revoke unit invite code') };
  }
}

export async function requestUnitConnection(
  payload: RequestUnitConnectionInput
): Promise<ActionResponse> {
  const parsed = requestUnitConnectionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['TENANT']);
    const tenantId = parseId(session.userId);
    const invite = await prisma.unitInviteCode.findFirst({
      where: {
        codeHash: hashInviteCode(parsed.data.inviteCode),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                propertyName: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return { success: false, message: 'Invite code is invalid or expired' };
    }

    const [activeUnitLease, activeTenantLease, existingPending] = await Promise.all([
      prisma.lease.findFirst({
        where: {
          unitId: invite.unitId,
          status: 'ACTIVE',
        },
        select: { id: true },
      }),
      prisma.lease.findFirst({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
        select: { id: true },
      }),
      prisma.unitConnectionRequest.findFirst({
        where: {
          unitId: invite.unitId,
          tenantId,
          status: 'PENDING',
        },
        select: { id: true },
      }),
    ]);

    if (activeUnitLease) {
      return { success: false, message: 'This unit already has an active lease' };
    }

    if (activeTenantLease) {
      return { success: false, message: 'You already have an active lease' };
    }

    if (existingPending) {
      return { success: false, message: 'You already have a pending request for this unit' };
    }

    await prisma.unitConnectionRequest.create({
      data: {
        unitId: invite.unitId,
        tenantId,
        inviteId: invite.id,
        status: 'PENDING',
      },
    });

    return { success: true, message: 'Connection request submitted' };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return { success: false, message: 'There is already a pending connection request for this unit' };
    }

    return { success: false, ...normalizeActionError(error, 'Failed to submit connection request') };
  }
}

export async function getTenantConnectionState(): Promise<ActionResponse<TenantConnectionState>> {
  try {
    const session = await requireRole(['TENANT']);
    const tenantId = parseId(session.userId);

    const activeLease = await prisma.lease.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                propertyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingRequests = await prisma.unitConnectionRequest.findMany({
      where: {
        tenantId,
        status: 'PENDING',
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                propertyName: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return {
      success: true,
      data: {
        activeLease: activeLease
          ? {
              leaseId: activeLease.id.toString(),
              propertyId: activeLease.unit.property.id.toString(),
              propertyName: activeLease.unit.property.propertyName,
              unitCode: activeLease.unit.unitCode,
              endDate: toDateString(activeLease.endDate) || undefined,
            }
          : null,
        pendingRequests: pendingRequests.map((request) => ({
          requestId: request.id.toString(),
          propertyId: request.unit.property.id.toString(),
          propertyName: request.unit.property.propertyName,
          unitCode: request.unit.unitCode,
          requestedAt: request.requestedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to load tenant connection state') };
  }
}

export async function listUnitConnectionRequests(): Promise<ActionResponse<UnitConnectionRequestRow[]>> {
  try {
    const session = await requireSession();
    if (isTenant(session)) {
      throw new Error('FORBIDDEN');
    }

    const requests = await prisma.unitConnectionRequest.findMany({
      where: {
        status: 'PENDING',
        unit: {
          property: session.role === 'OWNER'
            ? { ownerId: parseId(session.userId) }
            : session.role === 'MANAGER'
              ? {
                  assignments: {
                    some: {
                      managerId: parseId(session.userId),
                      status: 'ACTIVE',
                    },
                  },
                }
              : undefined,
        },
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                propertyName: true,
              },
            },
          },
        },
        tenant: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return {
      success: true,
      data: requests.map((request) => ({
        requestId: request.id.toString(),
        propertyId: request.unit.property.id.toString(),
        propertyName: request.unit.property.propertyName,
        unitId: request.unit.id.toString(),
        unitCode: request.unit.unitCode,
        tenantName: request.tenant.fullName,
        tenantEmail: request.tenant.email,
        tenantPhone: request.tenant.phone,
        requestedAt: request.requestedAt.toISOString(),
        defaultMonthlyRent: request.unit.defaultMonthlyRent?.toString() ?? null,
        defaultDeposit: request.unit.defaultDeposit?.toString() ?? null,
      })),
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to load unit connection requests') };
  }
}

export async function getUnitConnectionRequestById(
  payload: GetConnectionRequestInput
): Promise<ActionResponse<UnitConnectionRequestDetail>> {
  const parsed = getConnectionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireSession();
    if (isTenant(session)) {
      throw new Error('FORBIDDEN');
    }

    const request = await prisma.unitConnectionRequest.findUnique({
      where: { id: parseId(parsed.data.requestId) },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                propertyName: true,
              },
            },
          },
        },
        tenant: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!request || request.status !== 'PENDING') {
      return { success: false, message: 'Connection request not found' };
    }

    await assertPropertyAccess(session, request.unit.property.id);

    return {
      success: true,
      data: {
        requestId: request.id.toString(),
        propertyId: request.unit.property.id.toString(),
        propertyName: request.unit.property.propertyName,
        unitId: request.unit.id.toString(),
        unitCode: request.unit.unitCode,
        tenantName: request.tenant.fullName,
        tenantEmail: request.tenant.email,
        tenantPhone: request.tenant.phone,
        requestedAt: request.requestedAt.toISOString(),
        defaultMonthlyRent: request.unit.defaultMonthlyRent?.toString() ?? null,
        defaultDeposit: request.unit.defaultDeposit?.toString() ?? null,
        inviteId: request.inviteId.toString(),
      },
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to load connection request detail') };
  }
}

export async function approveUnitConnectionAndCreateLease(
  payload: ApproveUnitConnectionAndCreateLeaseInput
): Promise<ActionResponse<{ leaseId: string }>> {
  const parsed = approveUnitConnectionAndCreateLeaseSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireSession();
    if (isTenant(session)) {
      throw new Error('FORBIDDEN');
    }

    const request = await prisma.unitConnectionRequest.findUnique({
      where: { id: parseId(parsed.data.requestId) },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!request || request.status !== 'PENDING') {
      return { success: false, message: 'Connection request is no longer available' };
    }

    await assertPropertyAccess(session, request.unit.property.id);

    const startDate = parseDateInput(parsed.data.startDate);
    const endDate = parseDateInput(parsed.data.endDate);

    const result = await prisma.$transaction(async (tx) => {
      const [activeUnitLease, activeTenantLease] = await Promise.all([
        tx.lease.findFirst({
          where: {
            unitId: request.unitId,
            status: 'ACTIVE',
          },
          select: { id: true },
        }),
        tx.lease.findFirst({
          where: {
            tenantId: request.tenantId,
            status: 'ACTIVE',
          },
          select: { id: true },
        }),
      ]);

      if (activeUnitLease) {
        throw new Error('UNIT_ALREADY_LEASED');
      }

      if (activeTenantLease) {
        throw new Error('TENANT_ALREADY_LEASED');
      }

      const lease = await tx.lease.create({
        data: {
          unitId: request.unitId,
          tenantId: request.tenantId,
          startDate,
          endDate,
          dueDayOfMonth: parsed.data.dueDayOfMonth,
          baseRent: parsed.data.baseRent,
          depositAmount: parsed.data.depositAmount,
          managementFee: parsed.data.managementFee,
          utilityNote: parsed.data.utilityNote || null,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      await tx.unit.update({
        where: { id: request.unitId },
        data: {
          occupancyStatus: 'OCCUPIED',
          vacantSince: null,
        },
      });

      await tx.unitConnectionRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: parseId(session.userId),
          rejectionNote: null,
        },
      });

      const reviewTime = new Date();

      await tx.unitConnectionRequest.updateMany({
        where: {
          status: 'PENDING',
          OR: [
            { unitId: request.unitId },
            { tenantId: request.tenantId },
          ],
          NOT: {
            id: request.id,
          },
        },
        data: {
          status: 'REJECTED',
          reviewedAt: reviewTime,
          reviewedById: parseId(session.userId),
          rejectionNote: 'Automatically closed after another lease was approved.',
        },
      });

      await tx.unitInviteCode.updateMany({
        where: {
          unitId: request.unitId,
          revokedAt: null,
        },
        data: {
          revokedAt: reviewTime,
        },
      });

      return lease;
    });

    return {
      success: true,
      message: 'Lease created successfully',
      data: { leaseId: result.id.toString() },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNIT_ALREADY_LEASED') {
      return { success: false, message: 'This unit already has an active lease' };
    }

    if (error instanceof Error && error.message === 'TENANT_ALREADY_LEASED') {
      return { success: false, message: 'This tenant already has an active lease' };
    }

    return { success: false, ...normalizeActionError(error, 'Failed to approve request and create lease') };
  }
}

export async function rejectUnitConnectionRequest(
  payload: RejectConnectionRequestInput
): Promise<ActionResponse> {
  const parsed = rejectConnectionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireSession();
    if (isTenant(session)) {
      throw new Error('FORBIDDEN');
    }

    const request = await prisma.unitConnectionRequest.findUnique({
      where: { id: parseId(parsed.data.requestId) },
      include: {
        unit: {
          include: {
            property: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!request || request.status !== 'PENDING') {
      return { success: false, message: 'Connection request is no longer available' };
    }

    await assertPropertyAccess(session, request.unit.property.id);

    await prisma.unitConnectionRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: parseId(session.userId),
        rejectionNote: parsed.data.rejectionNote || null,
      },
    });

    return { success: true, message: 'Connection request rejected' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to reject connection request') };
  }
}

export async function getTenantContract(): Promise<ActionResponse<TenantContractData>> {
  try {
    const session = await requireRole(['TENANT']);
    const tenantId = parseId(session.userId);

    const lease = await prisma.lease.findFirst({
      where: {
        tenantId,
        status: {
          in: ['ACTIVE', 'TERMINATED'],
        },
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                propertyName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    if (!lease) {
      return { success: false, message: 'No lease found for this tenant' };
    }

    return {
      success: true,
      data: {
        leaseId: lease.id.toString(),
        propertyName: lease.unit.property.propertyName,
        propertyId: lease.unit.property.id.toString(),
        unitCode: lease.unit.unitCode,
        startDate: toDateString(lease.startDate) || '',
        endDate: toDateString(lease.endDate) || '',
        dueDayOfMonth: lease.dueDayOfMonth,
        baseRent: lease.baseRent.toString(),
        depositAmount: lease.depositAmount.toString(),
        managementFee: lease.managementFee.toString(),
        utilityNote: lease.utilityNote,
        status: lease.status,
        terminationRequestedAt: lease.terminationRequestedAt?.toISOString() ?? null,
        terminationRequestedNote: lease.terminationRequestedNote,
        terminatedAt: lease.terminatedAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to load tenant contract') };
  }
}

export async function requestEarlyTermination(
  payload: RequestEarlyTerminationInput
): Promise<ActionResponse> {
  const parsed = requestEarlyTerminationSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['TENANT']);
    const leaseId = parseId(parsed.data.leaseId);
    const tenantId = parseId(session.userId);

    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        tenantId,
        status: 'ACTIVE',
      },
      select: { id: true, terminationRequestedAt: true },
    });

    if (!lease) {
      return { success: false, message: 'Active lease not found' };
    }

    if (lease.terminationRequestedAt) {
      return { success: false, message: 'A termination request has already been submitted' };
    }

    await prisma.lease.update({
      where: { id: leaseId },
      data: {
        terminationRequestedAt: new Date(),
        terminationRequestedNote: parsed.data.note || null,
      },
    });

    return { success: true, message: 'Termination request submitted' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to request early termination') };
  }
}

export async function listLeaseTerminationRequests(): Promise<
  ActionResponse<LeaseTerminationRequestRow[]>
> {
  try {
    const session = await requireSession();
    if (isTenant(session)) {
      throw new Error('FORBIDDEN');
    }

    const leases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        terminationRequestedAt: { not: null },
        unit: {
          property: session.role === 'OWNER'
            ? { ownerId: parseId(session.userId) }
            : session.role === 'MANAGER'
              ? {
                  assignments: {
                    some: {
                      managerId: parseId(session.userId),
                      status: 'ACTIVE',
                    },
                  },
                }
              : undefined,
        },
      },
      include: {
        tenant: {
          select: {
            fullName: true,
          },
        },
        unit: {
          include: {
            property: {
              select: {
                id: true,
                propertyName: true,
              },
            },
          },
        },
      },
      orderBy: { terminationRequestedAt: 'desc' },
    });

    return {
      success: true,
      data: leases.map((lease) => ({
        leaseId: lease.id.toString(),
        propertyId: lease.unit.property.id.toString(),
        propertyName: lease.unit.property.propertyName,
        unitCode: lease.unit.unitCode,
        tenantName: lease.tenant.fullName,
        requestedAt: lease.terminationRequestedAt?.toISOString() || '',
        note: lease.terminationRequestedNote,
      })),
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to load lease termination requests') };
  }
}

export async function executeLeaseTermination(
  payload: ExecuteLeaseTerminationInput
): Promise<ActionResponse> {
  const parsed = executeLeaseTerminationSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireSession();
    if (isTenant(session)) {
      throw new Error('FORBIDDEN');
    }

    const lease = await prisma.lease.findUnique({
      where: { id: parseId(parsed.data.leaseId) },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!lease || lease.status !== 'ACTIVE') {
      return { success: false, message: 'Active lease not found' };
    }

    await assertPropertyAccess(session, lease.unit.property.id);

    await prisma.$transaction([
      prisma.lease.update({
        where: { id: lease.id },
        data: {
          status: 'TERMINATED',
          terminatedAt: new Date(),
          terminationRequestedAt: null,
          terminationRequestedNote: null,
        },
      }),
      prisma.unit.update({
        where: { id: lease.unitId },
        data: {
          occupancyStatus: 'VACANT',
          vacantSince: new Date(),
        },
      }),
    ]);

    return { success: true, message: 'Lease terminated successfully' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to terminate lease') };
  }
}
