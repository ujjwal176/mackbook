const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  const { spotId, brandName, brandWebsite, brandEmail } = req.body;

  try {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { campaign: true }
    });

    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.isReserved) return res.status(400).json({ error: 'Spot is already reserved' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: brandEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Spot #${spot.spotNumber} on ${spot.campaign.title}`,
              description: `Sponsorship spot for ${brandName}`
            },
            unit_amount: Math.round(spot.price * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        spotId,
        brandName,
        brandWebsite,
        brandEmail
      },
      success_url: `${process.env.FRONTEND_URL}/campaign.html?id=${spot.campaignId}&payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/campaign.html?id=${spot.campaignId}&payment=cancelled`
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { spotId, brandName, brandWebsite, brandEmail } = session.metadata;

    await prisma.$transaction(async (tx) => {
      const spot = await tx.spot.findUnique({ where: { id: spotId } });
      if (spot && !spot.isReserved) {
        await tx.spot.update({
          where: { id: spotId },
          data: { isReserved: true }
        });

        await tx.reservation.create({
          data: {
            spotId,
            brandName,
            brandWebsite,
            brandEmail,
            amountPaid: session.amount_total / 100
          }
        });
      }
    });
  }

  res.json({ received: true });
};
