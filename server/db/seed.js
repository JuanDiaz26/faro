// Datos iniciales: categorías de gastos e ingresos.
// Usado por init.js para poblar la tabla `categories` en una DB nueva.

const categories = [
  { name: 'Comida', icon: '🍔', color: '#FF6B6B', type: 'expense' },
  { name: 'Cenas/Salidas', icon: '🍽️', color: '#FFA94D', type: 'expense' },
  { name: 'Transporte', icon: '⛽', color: '#4DABF7', type: 'expense' },
  { name: 'Salud/Fitness', icon: '💪', color: '#51CF66', type: 'expense' },
  { name: 'Cuidado personal', icon: '💇', color: '#DA77F2', type: 'expense' },
  { name: 'Ropa', icon: '👕', color: '#FF8787', type: 'expense' },
  { name: 'Telefonía', icon: '📱', color: '#748FFC', type: 'expense' },
  { name: 'Gastos fijos', icon: '🏠', color: '#868E96', type: 'expense' },
  { name: 'Ocio/Vicios', icon: '🎮', color: '#F783AC', type: 'expense' },
  { name: 'Pago deudas', icon: '💳', color: '#FA5252', type: 'expense' },
  { name: 'Otros', icon: '📦', color: '#ADB5BD', type: 'expense' },
  { name: 'Sueldo', icon: '💼', color: '#20C997', type: 'income' },
  { name: 'Extras', icon: '💰', color: '#15AABF', type: 'income' },
]

module.exports = { categories }
