import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Favicon options",
  robots: { index: false, follow: false },
}

const options = [
  { id: "A", name: "Round bale (end view)", file: "round-bale.svg" },
  { id: "B", name: "Square bale with twine", file: "square-bale.svg" },
  { id: "C", name: "Stacked square bales", file: "stacked-bales.svg" },
  { id: "D", name: "Letter H", file: "letter-h.svg" },
]

const sizes = [16, 32, 64]

export default function FaviconOptionsPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-foreground">Favicon options</h1>
      <ul className="flex flex-col gap-4">
        {options.map((option) => (
          <li key={option.id} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold text-card-foreground">
              {option.id}. {option.name}
            </h2>
            <div className="flex flex-wrap items-end gap-6">
              {sizes.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1">
                  <img src={`/favicon-options/${option.file}`} width={size} height={size} alt={`${option.name} at ${size}px`} />
                  <span className="text-xs text-muted-foreground">{size}px</span>
                </div>
              ))}
              {[
                { label: "Light tab", bg: "#F3E6EC", text: "#3C3C3C" },
                { label: "Dark tab", bg: "#35363A", text: "#E8EAED" },
              ].map((tab) => (
                <div key={tab.label} className="flex flex-col items-center gap-1">
                  <div
                    className="flex w-48 items-center gap-2 rounded-t-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: tab.bg, color: tab.text }}
                  >
                    <img src={`/favicon-options/${option.file}`} width={16} height={16} alt="" />
                    <span className="truncate">HayResource - Buy &amp; Sell</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{tab.label}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
