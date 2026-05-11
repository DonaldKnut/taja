import connectDB from "@/lib/db";
import DeliveryJob, { DeliveryJobStatus } from "@/models/DeliveryJob";
import DeliveryEvent from "@/models/DeliveryEvent";

const DELIVERY_TRANSITIONS: Record<DeliveryJobStatus, DeliveryJobStatus[]> = {
  open: ["reserved", "cancelled"],
  reserved: ["open", "picked_up", "cancelled"],
  picked_up: ["open", "delivered", "disputed", "cancelled"],
  delivered: [],
  cancelled: [],
  disputed: [],
};

export function canTransitionDeliveryJob(
  from: DeliveryJobStatus,
  to: DeliveryJobStatus
) {
  return DELIVERY_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function processExpiredDeliveryClaims() {
  await connectDB();
  const now = new Date();
  const expiredReservedJobs = await DeliveryJob.find(
    {
      status: "reserved",
      "claim.claimExpiresAt": { $lte: now },
    },
    { _id: 1 }
  ).lean();
  const expiredOpenJobs = await DeliveryJob.find(
    {
      status: "open",
      "broadcast.expiresAt": { $lte: now },
    },
    { _id: 1 }
  ).lean();

  const [expiredReserved, expiredOpen] = await Promise.all([
    DeliveryJob.updateMany(
      {
        status: "reserved",
        "claim.claimExpiresAt": { $lte: now },
      },
      {
        $set: {
          status: "open",
          rider: undefined,
          "claim.claimedAt": undefined,
          "claim.claimExpiresAt": undefined,
          "broadcast.expiresAt": new Date(now.getTime() + 20 * 60 * 1000),
        },
      }
    ),
    DeliveryJob.updateMany(
      {
        status: "open",
        "broadcast.expiresAt": { $lte: now },
      },
      {
        $set: { status: "cancelled" },
      }
    ),
  ]);

  const events = [
    ...expiredReservedJobs.map((job) => ({
      job: job._id,
      actorRole: "system" as const,
      eventType: "claim_timeout_requeued" as const,
      metadata: { at: now.toISOString() },
    })),
    ...expiredOpenJobs.map((job) => ({
      job: job._id,
      actorRole: "system" as const,
      eventType: "broadcast_expired_cancelled" as const,
      metadata: { at: now.toISOString() },
    })),
  ];
  if (events.length > 0) {
    await DeliveryEvent.insertMany(events, { ordered: false }).catch(() => undefined);
  }

  return {
    requeuedClaims: expiredReserved.modifiedCount || 0,
    cancelledExpiredOpenJobs: expiredOpen.modifiedCount || 0,
  };
}
