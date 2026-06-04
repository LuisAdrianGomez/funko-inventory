import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { InventoryProvider } from './context/InventoryContext'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import AddProduct from './pages/AddProduct'
import Search from './pages/Search'
import ProductDetail from './pages/ProductDetail'
import ProductEdit from './pages/ProductEdit'
import ProductHistory from './pages/ProductHistory'
import Settings from './pages/Settings'

export default function App() {
  return (
    <InventoryProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home"               element={<Home />} />
            <Route path="catalog"            element={<Catalog />} />
            <Route path="add"                element={<AddProduct />} />
            <Route path="search"             element={<Search />} />
            <Route path="settings"           element={<Settings />} />
            <Route path="product/:id"        element={<ProductDetail />} />
            <Route path="product/:id/edit"   element={<ProductEdit />} />
            <Route path="product/:id/history" element={<ProductHistory />} />
            <Route path="*"                  element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </InventoryProvider>
  )
}
