const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllCampaigns = async (req, res) => {
  try {
    const { search, category } = req.query;
    let whereClause = {};

    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        spots: {
          include: { reservation: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        spots: {
          include: { reservation: true }
        },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { title, description, category, goal, spotCount, spotPrice } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const parsedSpotCount = parseInt(spotCount, 10);
    const parsedSpotPrice = parseFloat(spotPrice);

    const spotsData = Array.from({ length: parsedSpotCount }, (_, index) => ({
      spotNumber: index + 1,
      price: parsedSpotPrice
    }));

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        category,
        goal: parseFloat(goal),
        image: imageUrl,
        creatorId: req.user.id,
        spots: {
          create: spotsData
        }
      },
      include: { spots: true }
    });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
