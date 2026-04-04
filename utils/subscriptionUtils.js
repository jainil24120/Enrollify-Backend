import ClientProfile from "../models/clientProfile.js";

export const getSubscriptionStats = async () => {
  const now = new Date();

  const activeQuery = {
    subscriptionValidTill: { $gte: now },
    isActive: true
  };

  const expiredQuery = {
    subscriptionValidTill: { $lt: now },
    isActive: true
  };

  const [activeCount, expiredCount, totalClients] = await Promise.all([
    ClientProfile.countDocuments(activeQuery),
    ClientProfile.countDocuments(expiredQuery),
    ClientProfile.countDocuments()
  ]);

  const churnRate =
    totalClients > 0
      ? ((expiredCount / totalClients) * 100).toFixed(1)
      : 0;

  return {
    now,
    activeQuery,
    expiredQuery,
    activeCount,
    expiredCount,
    totalClients,
    churnRate
  };
};