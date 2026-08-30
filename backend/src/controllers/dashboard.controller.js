const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardMetrics = async (req, res) => {
  try {
    const creatorId = req.user.id;

    const campaigns = await prisma.campaign.findMany({
      where: { creatorId },
      include: {
        spots: {
          include: { reservation: true }
        }
      }
    });

    let totalRaised = 0;
    let spotsSold = 0;
    let totalSpots = 0;
    let recentActivity = [];

    campaigns.forEach((campaign) => {
      campaign.spots.forEach((spot) => {
        totalSpots++;
        if (spot.isReserved && spot.reservation) {
          spotsSold++;
          totalRaised += spot.price;
          recentActivity.push({
            id: spot.reservation.id,
            brandName: spot.reservation.brandName,
            campaignTitle: campaign.title,
            amount: spot.price,
            date: spot.reservation.createdAt
          });
        }
      });
    });

    const platformFee = totalRaised * 0.07;

    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      metrics: {
        totalRaised,
        spotsSold,
        availableSpots: totalSpots - spotsSold,
        platformFee
      },
      campaigns,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
