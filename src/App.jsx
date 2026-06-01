import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import AddProduct from './pages/AddProduct'
import Search from './pages/Search'

// HashRouter is used instead of BrowserRouter so that
// GitHub Pages (static hosting) doesn't 404 on deep links.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="add" element={<AddProduct />} />
          <Route path="search" element={<Search />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
