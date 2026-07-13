/**
 * MOCK DATA - This is the ONLY mocked data in Vaani.
 * It represents the banking records of two demo customers.
 * Everything else in the product (agent reasoning, tool execution, health
 * scoring, jargon explanation, proactive triggers) operates dynamically on
 * top of this data.
 *
 * In production this seed is replaced by real IDBI Core Banking / UPI data
 * behind the same repository interface (see services/store.js). The shape here
 * mirrors what a Supabase schema would return.
 */

// ---- Helper to build recent dated transactions relative to "today" ----
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 8), (n * 13) % 60, 0, 0);
  return d.toISOString();
}

function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export const SEED = {
  users: [
    {
      id: 'user_ramesh',
      name: 'Ramesh Kumar',
      preferredLanguage: 'hinglish', // hi | en | hinglish | ta | mr
      phone: '+91 98XXXXXX21',
      occupation: 'Truck driver',
      city: 'Delhi',
      voiceEnrolled: true,
      // family / life-context memory seeds
      lifeContext: [
        { key: 'daughter_fees', label: "Daughter's school fees", note: 'Due every quarter, approx Rs. 8,000', nextDate: daysAhead(24) },
        { key: 'father_medicine', label: "Father's medicines", note: 'Monthly, approx Rs. 1,200', nextDate: daysAhead(6) },
        { key: 'goal_tractor', label: 'Save for a second truck', note: 'Long-term goal, target Rs. 3,00,000', nextDate: null },
      ],
    },
    {
      id: 'user_lakshmi',
      name: 'Lakshmi Devi',
      preferredLanguage: 'ta',
      phone: '+91 90XXXXXX87',
      occupation: 'Kirana store owner',
      city: 'Coimbatore',
      voiceEnrolled: true,
      lifeContext: [
        { key: 'gst_filing', label: 'GST filing', note: 'Monthly, 11th of every month', nextDate: daysAhead(4) },
        { key: 'supplier_payment', label: 'Wholesale supplier payment', note: 'Approx Rs. 25,000 fortnightly', nextDate: daysAhead(9) },
      ],
    },
  ],

  accounts: [
    { id: 'acc_ramesh_sav', userId: 'user_ramesh', type: 'savings', number: 'XXXX4521', balance: 12450.75, currency: 'INR' },
    { id: 'acc_ramesh_rd', userId: 'user_ramesh', type: 'recurring_deposit', number: 'RD-88213', balance: 45000.0, currency: 'INR', maturityDate: daysAhead(210), monthlyInstallment: 2000 },
    { id: 'acc_lakshmi_sav', userId: 'user_lakshmi', type: 'savings', number: 'XXXX7781', balance: 68230.5, currency: 'INR' },
    { id: 'acc_lakshmi_cc', userId: 'user_lakshmi', type: 'kcc', number: 'KCC-4471', balance: -42000.0, currency: 'INR', creditLimit: 150000 },
  ],

  // Scheduled debits / mandates - used by the proactive trigger engine
  mandates: [
    { id: 'm1', userId: 'user_ramesh', payee: 'Airtel Postpaid', amount: 599, nextDebit: daysAhead(1), accountId: 'acc_ramesh_sav', type: 'autopay' },
    { id: 'm2', userId: 'user_ramesh', payee: 'Truck loan EMI', amount: 9800, nextDebit: daysAhead(2), accountId: 'acc_ramesh_sav', type: 'emi' },
    { id: 'm3', userId: 'user_ramesh', payee: 'RD installment', amount: 2000, nextDebit: daysAhead(11), accountId: 'acc_ramesh_sav', type: 'sip' },
    { id: 'm4', userId: 'user_lakshmi', payee: 'Shop electricity', amount: 3400, nextDebit: daysAhead(3), accountId: 'acc_lakshmi_sav', type: 'autopay' },
  ],

  // Payees for transfers
  payees: [
    { id: 'p1', userId: 'user_ramesh', name: 'Suresh (brother)', upiId: 'suresh@okaxis', last4: '3321' },
    { id: 'p2', userId: 'user_ramesh', name: 'Diesel Pump - NH48', upiId: 'hppump48@ybl', last4: '0091' },
    { id: 'p3', userId: 'user_ramesh', name: "Daughter's School", upiId: 'dpsfees@sbi', last4: '7788' },
    { id: 'p4', userId: 'user_lakshmi', name: 'Wholesale Supplier', upiId: 'agrofoods@okhdfc', last4: '1122' },
  ],

  // Transaction history - drives balance, health score, spend analysis
  transactions: [
    // Ramesh - a realistic mix of income (trips) and spends
    { id: 't1', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(1), desc: 'UPI - Diesel Pump NH48', category: 'fuel', amount: -3200, type: 'debit' },
    { id: 't2', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(2), desc: 'UPI credit - Trip payment', category: 'income', amount: 14500, type: 'credit' },
    { id: 't3', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(3), desc: 'UPI - Dhaba', category: 'food', amount: -260, type: 'debit' },
    { id: 't4', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(4), desc: 'UPI - Toll FASTag', category: 'travel', amount: -885, type: 'debit' },
    { id: 't5', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(6), desc: 'Airtel Postpaid autopay', category: 'bills', amount: -599, type: 'debit' },
    { id: 't6', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(8), desc: 'UPI - Father medicines', category: 'health', amount: -1180, type: 'debit' },
    { id: 't7', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(9), desc: 'UPI credit - Trip payment', category: 'income', amount: 12000, type: 'credit' },
    { id: 't8', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(12), desc: 'Truck loan EMI', category: 'emi', amount: -9800, type: 'debit' },
    { id: 't9', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(14), desc: 'UPI - Grocery', category: 'groceries', amount: -1450, type: 'debit' },
    { id: 't10', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(16), desc: 'UPI - Diesel Pump', category: 'fuel', amount: -2900, type: 'debit' },
    { id: 't11', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(18), desc: 'RD installment', category: 'savings', amount: -2000, type: 'debit' },
    { id: 't12', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(20), desc: 'UPI credit - Trip payment', category: 'income', amount: 15200, type: 'credit' },
    { id: 't13', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(23), desc: 'UPI - Mobile recharge', category: 'bills', amount: -239, type: 'debit' },
    { id: 't14', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(26), desc: 'UPI - Vehicle repair', category: 'maintenance', amount: -4300, type: 'debit' },
    { id: 't15', userId: 'user_ramesh', accountId: 'acc_ramesh_sav', date: daysAgo(28), desc: 'UPI credit - Trip payment', category: 'income', amount: 13800, type: 'credit' },

    // Lakshmi
    { id: 'l1', userId: 'user_lakshmi', accountId: 'acc_lakshmi_sav', date: daysAgo(1), desc: 'UPI credit - Daily sales', category: 'income', amount: 8600, type: 'credit' },
    { id: 'l2', userId: 'user_lakshmi', accountId: 'acc_lakshmi_sav', date: daysAgo(2), desc: 'UPI - Wholesale Supplier', category: 'inventory', amount: -25000, type: 'debit' },
    { id: 'l3', userId: 'user_lakshmi', accountId: 'acc_lakshmi_sav', date: daysAgo(3), desc: 'UPI credit - Daily sales', category: 'income', amount: 7900, type: 'credit' },
    { id: 'l4', userId: 'user_lakshmi', accountId: 'acc_lakshmi_sav', date: daysAgo(5), desc: 'Shop electricity', category: 'bills', amount: -3400, type: 'debit' },
    { id: 'l5', userId: 'user_lakshmi', accountId: 'acc_lakshmi_sav', date: daysAgo(7), desc: 'UPI credit - Daily sales', category: 'income', amount: 9200, type: 'credit' },
  ],

  // Dispute cases (starts empty, filled dynamically by the dispute tool)
  disputes: [],

  // Agent conversation + action audit log (append-only, filled dynamically)
  auditLog: [],
};

export { daysAgo, daysAhead };
