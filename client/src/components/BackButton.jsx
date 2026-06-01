import { useNavigate } from 'react-router-dom'

// Botón "atrás" para Android (que no siempre usa el gesto de deslizar).
// Vuelve a la pantalla anterior, o a "Más" si no hay historial.
export default function BackButton({ fallback = '/settings' }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(fallback)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Volver"
      className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-slate-500 active:bg-slate-100 transition-colors"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}
