'use server';

import prisma from '@/lib/prisma';
import {
  assertPropertyOwner,
  getAssignedPropertyCount,
  normalizeActionError,
  parseId,
  requireRole,
} from '@/lib/authz';
import { generateInviteCode, getInviteExpiryDate, hashInviteCode } from '@/lib/invite-codes';
import {
  managerAssignmentRequestDecisionSchema,
  managerLeavePropertySchema,
  ownerEndManagerAssignmentSchema,
  propertyInviteSchema,
  requestPropertyManagerAssignmentSchema,
  type ManagerAssignmentRequestDecisionInput,
  type ManagerLeavePropertyInput,
  type OwnerEndManagerAssignmentInput,
  type PropertyInviteInput,
  type RequestPropertyManagerAssignmentInput,
} from './managerAssignments.validation';

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

type ManagerAssignmentState = {
  assignedPropertyCount: number;
  assignedProperties: {
    propertyId: string;
    propertyName: string;
  }[];
  pendingRequests: {
    requestId: string;
    propertyId: string;
    propertyName: string;
    requestedAt: string;
  }[];
};

type ManagerAssignmentRequestRow = {
  requestId: string;
  propertyId: string;
  propertyName: string;
  managerName: string;
  managerEmail: string | null;
  managerPhone: string | null;
  requestedAt: string;
};

export async function generatePropertyManagerInviteCode(
  payload: PropertyInviteInput
): Promise<ActionResponse<InviteCodeData>> {
  const parsed = propertyInviteSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['OWNER', 'ADMIN']);
    const propertyId = parseId(parsed.data.propertyId);
    await assertPropertyOwner(session, propertyId);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { propertyCode: true },
    });

    if (!property) {
      return { success: false, message: 'Property not found' };
    }

    const activeAssignment = await prisma.propertyManagerAssignment.findFirst({
      where: {
        propertyId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (activeAssignment) {
      return { success: false, message: 'This property already has an active manager' };
    }

    const inviteCode = generateInviteCode(`MGR${property.propertyCode.toUpperCase()}`);
    const expiresAt = getInviteExpiryDate();

    await prisma.$transaction([
      prisma.propertyManagerInviteCode.updateMany({
        where: {
          propertyId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      prisma.propertyManagerInviteCode.create({
        data: {
          propertyId,
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
    return { success: false, ...normalizeActionError(error, 'Failed to generate manager invite code') };
  }
}

export async function revokePropertyManagerInviteCode(
  payload: PropertyInviteInput
): Promise<ActionResponse> {
  const parsed = propertyInviteSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['OWNER', 'ADMIN']);
    const propertyId = parseId(parsed.data.propertyId);
    await assertPropertyOwner(session, propertyId);

    await prisma.propertyManagerInviteCode.updateMany({
      where: {
        propertyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true, message: 'Manager invite code revoked' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to revoke manager invite code') };
  }
}

export async function requestPropertyManagerAssignment(
  payload: RequestPropertyManagerAssignmentInput
): Promise<ActionResponse> {
  const parsed = requestPropertyManagerAssignmentSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['MANAGER']);
    const managerId = parseId(session.userId);
    const invite = await prisma.propertyManagerInviteCode.findFirst({
      where: {
        codeHash: hashInviteCode(parsed.data.inviteCode),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
          },
        },
      },
    });

    if (!invite) {
      return { success: false, message: 'Invite code is invalid or expired' };
    }

    const [activePropertyAssignment, activeAssignment, pendingRequest] = await Promise.all([
      prisma.propertyManagerAssignment.findFirst({
        where: {
          propertyId: invite.propertyId,
          status: 'ACTIVE',
        },
        select: { id: true },
      }),
      prisma.propertyManagerAssignment.findFirst({
        where: {
          propertyId: invite.propertyId,
          managerId,
          status: 'ACTIVE',
        },
        select: { id: true },
      }),
      prisma.managerAssignmentRequest.findFirst({
        where: {
          propertyId: invite.propertyId,
          managerId,
          status: 'PENDING',
        },
        select: { id: true },
      }),
    ]);

    if (activePropertyAssignment) {
      return { success: false, message: 'This property already has an active manager' };
    }

    if (activeAssignment) {
      return { success: false, message: 'You are already assigned to this property' };
    }

    if (pendingRequest) {
      return { success: false, message: 'You already have a pending request for this property' };
    }

    await prisma.managerAssignmentRequest.create({
      data: {
        propertyId: invite.propertyId,
        managerId,
        inviteId: invite.id,
        status: 'PENDING',
      },
    });

    return { success: true, message: 'Manager assignment request submitted' };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return { success: false, message: 'A pending manager assignment request already exists' };
    }

    return { success: false, ...normalizeActionError(error, 'Failed to submit manager assignment request') };
  }
}

export async function getManagerAssignmentState(): Promise<
  ActionResponse<ManagerAssignmentState>
> {
  try {
    const session = await requireRole(['MANAGER']);
    const [assignedPropertyCount, assignedProperties, pendingRequests] = await Promise.all([
      getAssignedPropertyCount(session),
      prisma.propertyManagerAssignment.findMany({
        where: {
          managerId: parseId(session.userId),
          status: 'ACTIVE',
        },
        orderBy: {
          startDate: 'asc',
        },
        select: {
          propertyId: true,
          property: {
            select: {
              propertyName: true,
            },
          },
        },
      }),
      prisma.managerAssignmentRequest.findMany({
        where: {
          managerId: parseId(session.userId),
          status: 'PENDING',
        },
        include: {
          property: {
            select: {
              id: true,
              propertyName: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      data: {
        assignedPropertyCount,
        assignedProperties: assignedProperties.map((assignment) => ({
          propertyId: assignment.propertyId.toString(),
          propertyName: assignment.property.propertyName,
        })),
        pendingRequests: pendingRequests.map((request) => ({
          requestId: request.id.toString(),
          propertyId: request.property.id.toString(),
          propertyName: request.property.propertyName,
          requestedAt: request.requestedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to load manager assignment state') };
  }
}

export async function listManagerAssignmentRequests(): Promise<
  ActionResponse<ManagerAssignmentRequestRow[]>
> {
  try {
    const session = await requireRole(['OWNER', 'ADMIN']);

    const requests = await prisma.managerAssignmentRequest.findMany({
      where: {
        status: 'PENDING',
        property: session.role === 'OWNER'
          ? { ownerId: parseId(session.userId) }
          : undefined,
      },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        manager: {
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
        propertyId: request.property.id.toString(),
        propertyName: request.property.propertyName,
        managerName: request.manager.fullName,
        managerEmail: request.manager.email,
        managerPhone: request.manager.phone,
        requestedAt: request.requestedAt.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to load manager assignment requests') };
  }
}

export async function approveManagerAssignmentRequest(
  payload: ManagerAssignmentRequestDecisionInput
): Promise<ActionResponse> {
  const parsed = managerAssignmentRequestDecisionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['OWNER']);
    const request = await prisma.managerAssignmentRequest.findUnique({
      where: { id: parseId(parsed.data.requestId) },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!request || request.status !== 'PENDING') {
      return { success: false, message: 'Manager assignment request not found' };
    }

    if (request.property.ownerId !== parseId(session.userId)) {
      return { success: false, message: 'Forbidden' };
    }

    const today = new Date();

    await prisma.$transaction(async (tx) => {
      const existingPropertyAssignment = await tx.propertyManagerAssignment.findFirst({
        where: {
          propertyId: request.propertyId,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (existingPropertyAssignment) {
        throw new Error('PROPERTY_ALREADY_ASSIGNED');
      }

      const existingAssignment = await tx.propertyManagerAssignment.findFirst({
        where: {
          propertyId: request.propertyId,
          managerId: request.managerId,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (existingAssignment) {
        throw new Error('MANAGER_ALREADY_ASSIGNED');
      }

      await tx.propertyManagerAssignment.create({
        data: {
          propertyId: request.propertyId,
          managerId: request.managerId,
          startDate: today,
          salaryType: 'FIXED_MONTHLY',
          baseSalary: 0,
          commissionRate: 0,
          status: 'ACTIVE',
        },
      });

      const reviewTime = new Date();

      await tx.managerAssignmentRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          reviewedAt: reviewTime,
          reviewedById: parseId(session.userId),
          rejectionNote: null,
        },
      });

      await tx.managerAssignmentRequest.updateMany({
        where: {
          propertyId: request.propertyId,
          status: 'PENDING',
          NOT: {
            id: request.id,
          },
        },
        data: {
          status: 'REJECTED',
          reviewedAt: reviewTime,
          reviewedById: parseId(session.userId),
          rejectionNote: 'Automatically closed after another manager was assigned.',
        },
      });

      await tx.propertyManagerInviteCode.updateMany({
        where: {
          propertyId: request.propertyId,
          revokedAt: null,
        },
        data: {
          revokedAt: reviewTime,
        },
      });
    });

    return { success: true, message: 'Manager assigned successfully' };
  } catch (error) {
    if (error instanceof Error && error.message === 'PROPERTY_ALREADY_ASSIGNED') {
      return { success: false, message: 'This property already has an active manager' };
    }

    if (error instanceof Error && error.message === 'MANAGER_ALREADY_ASSIGNED') {
      return { success: false, message: 'Manager is already assigned to this property' };
    }

    return { success: false, ...normalizeActionError(error, 'Failed to approve manager assignment request') };
  }
}

export async function rejectManagerAssignmentRequest(
  payload: ManagerAssignmentRequestDecisionInput
): Promise<ActionResponse> {
  const parsed = managerAssignmentRequestDecisionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['OWNER']);
    const request = await prisma.managerAssignmentRequest.findUnique({
      where: { id: parseId(parsed.data.requestId) },
      include: {
        property: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!request || request.status !== 'PENDING') {
      return { success: false, message: 'Manager assignment request not found' };
    }

    if (request.property.ownerId !== parseId(session.userId)) {
      return { success: false, message: 'Forbidden' };
    }

    await prisma.managerAssignmentRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: parseId(session.userId),
        rejectionNote: parsed.data.rejectionNote || null,
      },
    });

    return { success: true, message: 'Manager assignment request rejected' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to reject manager assignment request') };
  }
}

export async function endManagerAssignmentByOwner(
  payload: OwnerEndManagerAssignmentInput
): Promise<ActionResponse> {
  const parsed = ownerEndManagerAssignmentSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['OWNER', 'ADMIN']);
    const assignmentId = parseId(parsed.data.assignmentId);

    const assignment = await prisma.propertyManagerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        property: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!assignment || assignment.status !== 'ACTIVE') {
      return { success: false, message: 'Active manager assignment not found' };
    }

    if (session.role === 'OWNER' && assignment.property.ownerId !== parseId(session.userId)) {
      return { success: false, message: 'Forbidden' };
    }

    const endedAt = new Date();

    await prisma.propertyManagerAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'ENDED',
        endDate: endedAt,
      },
    });

    return { success: true, message: 'Manager assignment ended' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to end manager assignment') };
  }
}

export async function leaveManagedProperty(
  payload: ManagerLeavePropertyInput
): Promise<ActionResponse> {
  const parsed = managerLeavePropertySchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await requireRole(['MANAGER']);
    const propertyId = parseId(parsed.data.propertyId);
    const managerId = parseId(session.userId);

    const assignment = await prisma.propertyManagerAssignment.findFirst({
      where: {
        propertyId,
        managerId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      return { success: false, message: 'You are not actively assigned to this property' };
    }

    await prisma.propertyManagerAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'ENDED',
        endDate: new Date(),
      },
    });

    return { success: true, message: 'You have been removed from this property' };
  } catch (error) {
    return { success: false, ...normalizeActionError(error, 'Failed to leave managed property') };
  }
}
