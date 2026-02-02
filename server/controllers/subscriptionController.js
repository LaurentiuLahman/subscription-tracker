const Subscription = require('../models/Subscription');
const { addMonths, addYears, isPast } = require('date-fns');


exports.createSubscription = async (req, res) => {
  try {
    const { name, price, currency, billingCycle, startDate, category, color } = req.body;

    let nextDate = new Date(startDate);

    if (isNaN(nextDate)) {
      return res.status(400).json({ message: 'Data de start invalidă' });
    }

    
    while (isPast(nextDate)) {
      if (billingCycle === 'monthly') {
        nextDate = addMonths(nextDate, 1);
      } else if (billingCycle === 'yearly') {
        nextDate = addYears(nextDate, 1);
      }
    }
    const newSubscription = new Subscription({
      user: req.user.id, 
      name,
      price,
      currency,
      billingCycle,
      startDate,
      nextPaymentDate: nextDate, 
      category,
      color
    });

    const savedSubscription = await newSubscription.save();

    res.status(201).json(savedSubscription);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id }).sort({ nextPaymentDate: 1 });
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.deleteSubscription = async (req, res) => {
  try {
    const deletedSub = await Subscription.findByIdAndDelete(req.params.id);

    if (!deletedSub) {
      return res.status(404).json({ message: 'Abonamentul nu a fost găsit' });
    }

    res.json({ message: 'Abonament șters cu succes' });
  } catch (err) {
    res.status(500).json({ message: 'Eroare la ștergere' });
  }
};

// ... codul existent ...

// 4. Funcția pentru ACTUALIZARE (Edit)
exports.updateSubscription = async (req, res) => {
  try {
    const { name, price, currency, billingCycle, startDate, category } = req.body;
    
    // Găsim abonamentul
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Abonament negăsit' });

    // Actualizăm câmpurile
    sub.name = name;
    sub.price = price;
    sub.currency = currency;
    sub.billingCycle = billingCycle;
    sub.category = category;
    sub.startDate = startDate;

    // Salvarea va declanșa automat recalcularea nextPaymentDate (dacă ai logica în Model)
    // Sau, Mongoose va salva pur și simplu noile date.
    const updatedSub = await sub.save();

    res.json(updatedSub);
  } catch (err) {
    res.status(500).json({ message: 'Eroare la actualizare' });
  }
};