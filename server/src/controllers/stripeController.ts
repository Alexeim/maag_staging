// server/src/controllers/stripeController.ts (НОВАЯ, ЧИСТАЯ ВЕРСИЯ)
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Create a custom interface that extends Stripe's Subscription type
// This is the clean way to fix the missing property issue.
interface SubscriptionWithPeriodEnd extends Stripe.Subscription {
  current_period_end: number;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { priceId, userId } = req.body;
  const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:4321';

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
      metadata: {
        userId: userId,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createPortalSession = async (req: Request, res: Response) => {
  const { customerId } = req.body;
  const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:4321';

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${YOUR_DOMAIN}/profile`,
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: error.message });
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = getFirestore();

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) {
        console.error('No userId found in checkout session metadata.');
        return res.status(400).send('No userId found in checkout session metadata.');
      }

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!subscriptionId) {
        console.error('No subscriptionId found in checkout session.');
        return res.status(400).send('No subscriptionId found in checkout session.');
      }

      try {
        // Retrieve the full subscription object to get all details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const priceId = subscription.items.data[0].price.id;
        
        // This is the data we will write to Firestore
        const subscriptionData = {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeSubscriptionStatus: subscription.status,
          // FIX: Use a reliable path to the period end and provide a null fallback
          stripeCurrentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        };

        // Write everything to the user's document in one go
        await db.collection('users').doc(userId).set(subscriptionData, { merge: true });

        console.log(`User ${userId} subscription data updated successfully.`);

      } catch (error) {
        console.error(`Error updating user ${userId} subscription:`, error);
        return res.status(500).send('Error updating user subscription.');
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      const customerIdUpdated = subscriptionUpdated.customer as string;

      try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('stripeCustomerId', '==', customerIdUpdated).limit(1).get();

        if (querySnapshot.empty) {
          console.error(`No user found with stripeCustomerId: ${customerIdUpdated}`);
          return res.status(404).send(`No user found with stripeCustomerId: ${customerIdUpdated}`);
        }

        const userDoc = querySnapshot.docs[0];
        
        const updateData = {
            stripePriceId: subscriptionUpdated.items.data[0].price.id,
            stripeSubscriptionStatus: subscriptionUpdated.status,
            stripeCurrentPeriodEnd: (subscriptionUpdated as any).current_period_end,
        };

        await userDoc.ref.update(updateData);

        console.log(`User ${userDoc.id} subscription updated successfully.`);
      } catch (error) {
        console.error(`Error updating user with customerId ${customerIdUpdated}:`, error);
        return res.status(500).send('Error updating user subscription.');
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      const customerIdDeleted = subscriptionDeleted.customer as string;
      
      console.log(`Received 'customer.subscription.deleted' webhook for customerId: ${customerIdDeleted}`);

      try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('stripeCustomerId', '==', customerIdDeleted).limit(1).get();

        if (querySnapshot.empty) {
          console.error(`No user found with stripeCustomerId: ${customerIdDeleted}`);
          return res.status(404).send(`No user found with stripeCustomerId: ${customerIdDeleted}`);
        }

        const userDoc = querySnapshot.docs[0];

        // Clean up all subscription-related fields, not just the status
        await userDoc.ref.update({
          stripeSubscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        });

        console.log(`User ${userDoc.id} subscription canceled and data cleaned.`);
      } catch (error) {
        console.error(`Error canceling subscription for customerId ${customerIdDeleted}:`, error);
        return res.status(500).send('Error canceling user subscription.');
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};
