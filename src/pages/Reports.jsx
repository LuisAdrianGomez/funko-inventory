import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import Spinner from '../components/UI/Spinner'

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const SALES_FILTERS = [
  { key: 'current_month', label: 'Mes actual' },
  { key: 'current_week', label: 'Semana actual' },
  { key: 'last_30_days', label: 'Últimos 30 días' },
  { key: 'last_two_months', label: 'Últimos dos meses' },
]

function numberValue(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function csvCell(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getSalesRange(filterKey) {
  const now = new Date()
  const start = new Date(now)

  if (filterKey === 'current_month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  } else if (filterKey === 'current_week') {
    const day = start.getDay()
    const daysSinceMonday = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - daysSinceMonday)
    start.setHours(0, 0, 0, 0)
  } else if (filterKey === 'last_30_days') {
    start.setDate(start.getDate() - 30)
  } else if (filterKey === 'last_two_months') {
    start.setMonth(start.getMonth() - 2)
  }

  return { start, end: now }
}

function downloadCsv(products) {
  const headers = ['barcode', 'name', 'number', 'line', 'series', 'exclusive', 'stock', 'price', 'total_value']
  const rows = products.map((product) => {
    const stock = numberValue(product.stock)
    const price = numberValue(product.price)
    const total = stock * price

    return [
      product.barcode,
      product.name,
      product.number,
      product.line,
      product.series,
      product.exclusive,
      stock,
      price,
      total,
    ].map(csvCell).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'funko-inventory-report.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const navigate = useNavigate()
  const { inventory, loading } = useInventory()
  const [salesFilter, setSalesFilter] = useState('current_month')

  const products = useMemo(() => inventory?.products || [], [inventory?.products])

  const report = useMemo(() => {
    const byLineMap = new Map()
    let totalUnits = 0
    let exclusives = 0
    let outOfStock = 0
    let totalValue = 0

    const rows = products.map((product) => {
      const stock = numberValue(product.stock)
      const price = numberValue(product.price)
      const value = stock * price
      const line = product.line?.trim() || 'Sin línea'
      const isExclusive = Boolean(product.exclusive || product.is_exclusive)

      totalUnits += stock
      totalValue += value
      if (isExclusive) exclusives += 1
      if (stock <= 0) outOfStock += 1

      const group = byLineMap.get(line) || {
        line,
        products: 0,
        units: 0,
        value: 0,
        exclusives: 0,
      }
      group.products += 1
      group.units += stock
      group.value += value
      if (isExclusive) group.exclusives += 1
      byLineMap.set(line, group)

      return {
        ...product,
        stock,
        price,
        value,
        isExclusive,
      }
    })

    return {
      totalProducts: products.length,
      totalUnits,
      exclusives,
      outOfStock,
      totalValue,
      byLine: [...byLineMap.values()].sort((a, b) => b.value - a.value || a.line.localeCompare(b.line)),
      rows: rows.sort((a, b) => b.value - a.value || String(a.name).localeCompare(String(b.name))),
    }
  }, [products])

  const salesReport = useMemo(() => {
    const { start, end } = getSalesRange(salesFilter)
    const byLineMap = new Map()
    let totalUnits = 0
    let totalValue = 0

    const rows = products.flatMap((product) => {
      const price = numberValue(product.price)
      const line = product.line?.trim() || 'Sin línea'

      return (product.history || [])
        .filter((entry) => entry.action === 'remove')
        .map((entry, index) => {
          const date = new Date(entry.date)
          const units = numberValue(entry.units)
          const value = price * units

          return {
            id: `${product.barcode}-${entry.date}-${index}`,
            barcode: product.barcode,
            name: product.name || 'Sin nombre',
            number: product.number,
            line,
            series: product.series,
            units,
            price,
            value,
            date,
            note: entry.note || '',
          }
        })
        .filter((sale) => {
          if (Number.isNaN(sale.date.getTime())) return false
          return sale.date >= start && sale.date <= end
        })
    })

    rows.forEach((sale) => {
      totalUnits += sale.units
      totalValue += sale.value

      const group = byLineMap.get(sale.line) || {
        line: sale.line,
        movements: 0,
        units: 0,
        value: 0,
      }
      group.movements += 1
      group.units += sale.units
      group.value += sale.value
      byLineMap.set(sale.line, group)
    })

    return {
      start,
      end,
      movements: rows.length,
      totalUnits,
      totalValue,
      byLine: [...byLineMap.values()].sort((a, b) => b.value - a.value || a.line.localeCompare(b.line)),
      rows: rows.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }
  }, [products, salesFilter])

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-5 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Volver"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Reportes</h2>
            <p className="text-xs text-slate-500">Inventario, ventas y valor estimado.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => downloadCsv(products)}
          disabled={products.length === 0}
          className="px-3 py-2 rounded-xl bg-funko-orange text-sm font-semibold text-white hover:bg-funko-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric label="Productos" value={report.totalProducts} />
        <Metric label="Unidades" value={report.totalUnits} />
        <Metric label="Exclusivos" value={report.exclusives} />
        <Metric label="Sin stock" value={report.outOfStock} />
        <Metric label="Valor estimado" value={currency.format(report.totalValue)} wide />
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300">Ventas</h3>
            <p className="text-xs text-slate-500">
              {formatDateTime(salesReport.start)} - {formatDateTime(salesReport.end)}
            </p>
          </div>

          <select
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-600"
          >
            {SALES_FILTERS.map((filter) => (
              <option key={filter.key} value={filter.key}>{filter.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Metric label="Movimientos" value={salesReport.movements} />
          <Metric label="Unidades vendidas" value={salesReport.totalUnits} />
          <Metric label="Valor vendido" value={currency.format(salesReport.totalValue)} />
        </div>

        {salesReport.byLine.length > 0 && (
          <div className="grid md:grid-cols-2 gap-3">
            {salesReport.byLine.map((line) => (
              <div key={line.line} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{line.line}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {line.movements} movimiento{line.movements !== 1 ? 's' : ''} · {line.units} unidad{line.units !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">{currency.format(line.value)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {salesReport.rows.length === 0 ? (
          <EmptyState text="No hay ventas registradas en este periodo." />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.3fr_0.9fr_0.7fr_0.8fr_0.9fr] gap-3 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-800">
              <span>Producto</span>
              <span>Línea / serie</span>
              <span>Unidades</span>
              <span>Fecha</span>
              <span className="text-right">Valor</span>
            </div>

            <div className="divide-y divide-slate-800">
              {salesReport.rows.map((sale) => (
                <button
                  type="button"
                  key={sale.id}
                  onClick={() => navigate(`/product/${sale.barcode}`)}
                  className="w-full text-left grid md:grid-cols-[1.3fr_0.9fr_0.7fr_0.8fr_0.9fr] gap-2 md:gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">{sale.name}</p>
                    <p className="text-xs text-slate-500">{sale.number ? `#${sale.number}` : 'Sin número'}</p>
                  </div>
                  <div className="text-xs text-slate-400">
                    <p>{sale.line}</p>
                    <p className="text-slate-500">{sale.series || 'Sin serie'}</p>
                  </div>
                  <p className="text-sm text-slate-300">{sale.units}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(sale.date)}</p>
                  <p className="text-sm font-semibold text-emerald-300 md:text-right">{currency.format(sale.value)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Desglose por línea</h3>
        {report.byLine.length === 0 ? (
          <EmptyState text="Aún no hay productos para reportar." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {report.byLine.map((line) => (
              <div key={line.line} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{line.line}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {line.products} producto{line.products !== 1 ? 's' : ''} · {line.units} unidad{line.units !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">{currency.format(line.value)}</p>
                </div>
                <p className="text-xs text-slate-500 mt-3">{line.exclusives} exclusivo{line.exclusives !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Productos</h3>
        {report.rows.length === 0 ? (
          <EmptyState text="Cuando agregues Funkos, aquí verás precio, stock y valor." />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.4fr_1fr_0.6fr_0.8fr_0.9fr] gap-3 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-800">
              <span>Producto</span>
              <span>Línea / serie</span>
              <span>Stock</span>
              <span>Precio</span>
              <span className="text-right">Valor</span>
            </div>

            <div className="divide-y divide-slate-800">
              {report.rows.map((product) => (
                <button
                  type="button"
                  key={product.barcode}
                  onClick={() => navigate(`/product/${product.barcode}`)}
                  className="w-full text-left grid md:grid-cols-[1.4fr_1fr_0.6fr_0.8fr_0.9fr] gap-2 md:gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">{product.name || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-500">
                      {product.number ? `#${product.number}` : 'Sin número'}
                      {product.exclusive ? ` · ${product.exclusive}` : ''}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400">
                    <p>{product.line || 'Sin línea'}</p>
                    <p className="text-slate-500">{product.series || 'Sin serie'}</p>
                  </div>
                  <p className="text-sm text-slate-300">{product.stock}</p>
                  <p className="text-sm text-slate-300">{currency.format(product.price)}</p>
                  <p className="text-sm font-semibold text-emerald-300 md:text-right">{currency.format(product.value)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value, wide }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${wide ? 'col-span-2 lg:col-span-1' : ''}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-100">{value}</p>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}
