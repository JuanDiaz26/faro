import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="p-6 text-center">
      <div className="mt-16 text-6xl">🤔</div>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">Acá no hay nada</h1>
      <p className="mt-2 text-slate-500">La ruta que buscás no existe.</p>
      <Link
        to="/"
        className="inline-block mt-6 rounded-xl bg-emerald-500 text-white font-semibold px-4 py-2"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
