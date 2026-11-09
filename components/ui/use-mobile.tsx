import * as React from 'react'
import { DESKTOP_MEDIA_QUERY } from '@/lib/breakpoints'

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const onChange = () => {
      setIsMobile(!mql.matches)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(!mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
