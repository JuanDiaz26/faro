import { useEffect } from 'react'

// Bloquea el scroll del body mientras un modal está abierto.
// Evita que al scrollear dentro del modal se mueva la página de atrás.
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    const originalTouch = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow = original
      document.body.style.touchAction = originalTouch
    }
  }, [locked])
}
