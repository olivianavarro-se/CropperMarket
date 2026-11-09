// Keep in sync with the `md` custom variant in app/globals.css.
// Desktop = computer-sized screen that isn't touch-first; phones and tablets (pointer: coarse) get the mobile layout.
export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px) and (not (pointer: coarse))'

export function isDesktopViewport() {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches
}
