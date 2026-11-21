export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getCategoryBadge = (category) => {
  const map = {
    FOOD_AND_DRINK: { label: 'Food & Drink', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    HOUSING_AND_RENT: { label: 'Rent & Housing', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    TRANSPORTATION: { label: 'Transport', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ENTERTAINMENT: { label: 'Entertainment', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    UTILITIES: { label: 'Utilities', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    SHOPPING: { label: 'Shopping', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    TRAVEL: { label: 'Travel', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    GROCERIES: { label: 'Groceries', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
    HEALTH: { label: 'Health', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    OTHER: { label: 'Other', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  };
  return map[category] || { label: category, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
};

export const getGroupCategoryIcon = (category) => {
  const icons = {
    TRIP: '✈️',
    HOME: '🏠',
    COUPLE: '❤️',
    COLLEGE: '🎓',
    PROJECT: '💻',
    FAMILY: '👨‍👩‍👧‍👦',
    OTHER: '📁',
  };
  return icons[category] || '👥';
};
