import { useCallback, useEffect, useRef, useState } from 'react'

export function useCallSimulation(messages = []) {
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(-1)
  const timer = useRef(null)

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    setActive(false)
  }, [])

  const start = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    setIndex(-1)
    setActive(true)
    let next = 0
    timer.current = window.setInterval(() => {
      setIndex(next)
      next += 1
      if (next >= messages.length) {
        window.clearInterval(timer.current)
        timer.current = null
        setActive(false)
      }
    }, 2300)
  }, [messages.length])

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current)
  }, [])

  const visibleMessages = messages.slice(0, Math.max(0, index + 1))
  return { active, index, visibleMessages, start, stop, reset: () => { stop(); setIndex(-1) } }
}
