'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export type DashboardMetrics = {
  totalProperties: number;
  totalUnits: number;
  vacantUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
};

export type DashboardActionResponse = {
  success: boolean;
  message?: string;
  data?: DashboardMetrics;
};

function parseBigInt(id: string): bigint {
  return BigInt(id);
}

function roundedPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function scopeWhereForProperty(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const activeFilter = { not: 'ARCHIVED' as const };

  if (session.role === 'ADMIN') {
    return { status: activeFilter };
  }

  if (session.role === 'OWNER') {
    return { ownerId: parseBigInt(session.userId), status: activeFilter };
  }

  if (session.role === 'MANAGER') {
    return {
      status: activeFilter,
      assignments: {
        some: {
          managerId: parseBigInt(session.userId),
          status: 'ACTIVE',
        },
      },
    };
  }

  return { id: BigInt(-1) };
}

export async function getDashboardMetrics(): Promise<DashboardActionResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const propertyIds = await prisma.property.findMany({
      where: scopeWhereForProperty(session),
      select: { id: true },
    });

    const ids = propertyIds.map((property) => property.id);

    if (ids.length === 0) {
      return {
        success: true,
        data: {
          totalProperties: 0,
          totalUnits: 0,
          vacantUnits: 0,
          occupiedUnits: 0,
          occupancyRate: 0,
        },
      };
    }

    const [totalUnits, vacantUnits, occupiedUnits] = await Promise.all([
      prisma.unit.count({ where: { propertyId: { in: ids }, occupancyStatus: { not: 'ARCHIVED' } } }),
      prisma.unit.count({ where: { propertyId: { in: ids }, occupancyStatus: 'VACANT' } }),
      prisma.unit.count({ where: { propertyId: { in: ids }, occupancyStatus: 'OCCUPIED' } }),
    ]);

    const occupancyRate = totalUnits > 0 ? roundedPercent((occupiedUnits / totalUnits) * 100) : 0;

    return {
      success: true,
      data: {
        totalProperties: ids.length,
        totalUnits,
        vacantUnits,
        occupiedUnits,
        occupancyRate,
      },
    };
  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    return { success: false, message: 'Failed to load dashboard metrics' };
  }
}
