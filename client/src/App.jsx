import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Budgets from './pages/Budgets'
import Debts from './pages/Debts'
import Savings from './pages/Savings'
import FixedExpenses from './pages/FixedExpenses'
import Cards from './pages/Cards'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import PWAUpdateToast from './components/PWAUpdateToast'

function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/fixed" element={<FixedExpenses />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <PWAUpdateToast />
    </>
  )
}

export default App
