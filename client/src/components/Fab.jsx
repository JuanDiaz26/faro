// FAB con identidad Faro: amber beacon + sombra cálida.
export default function Fab({ onClick, label = 'Agregar' }) {
  return (
    <div className="fixed bottom-20 inset-x-0 z-20 pointer-events-none">
      <div className="max-w-md mx-auto relative h-0">
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="pointer-events-auto absolute right-4 bottom-0 w-14 h-14 rounded-full bg-beam-500 hover:bg-beam-600 text-white shadow-beam active:scale-95 transition-all flex items-center justify-center ring-4 ring-beam-500/20"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
