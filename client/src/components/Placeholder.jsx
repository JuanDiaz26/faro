export default function Placeholder({ titulo, descripcion = 'Esta sección llega en el Día 2 o 3 del plan.' }) {
  return (
    <div className="p-6 text-center">
      <div className="mt-16 text-6xl">🚧</div>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">{titulo}</h1>
      <p className="mt-2 text-slate-500">{descripcion}</p>
    </div>
  )
}
