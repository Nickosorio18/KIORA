import { useEffect, useRef } from 'react'

/**
 * Applies IntersectionObserver scroll-reveal to all .reveal elements
 * inside the returned ref container.
 */
export const useScrollReveal = () => {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )

    container.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return ref
}
