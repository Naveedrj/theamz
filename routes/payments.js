// routes/payments.js
router.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body; // amount in cents
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://yourapp.com/success', // Replace with your frontend success URL
      cancel_url: 'https://yourapp.com/cancel',   // Replace with your frontend cancel URL
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});
