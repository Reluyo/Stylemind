'use client'

export type StyleExpression = 'feminine' | 'masculine' | 'fluid' | 'no_preference'

const OPTIONS: { value: StyleExpression; label: string; description: string }[] = [
  {
    value: 'feminine',
    label: 'Feminine',
    description: 'Dresses, skirts, fitted silhouettes, softer lines',
  },
  {
    value: 'masculine',
    label: 'Masculine',
    description: 'Structured, tailored, and relaxed fits',
  },
  {
    value: 'fluid',
    label: 'Fluid',
    description: 'Mix of both — no rules, anything goes',
  },
  {
    value: 'no_preference',
    label: 'No preference',
    description: 'Suggest anything based on weather and occasion',
  },
]

interface Props {
  value: StyleExpression
  onChange: (v: StyleExpression) => void
}

export default function StyleExpressionPicker({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
        Style expression
      </p>
      <p className="text-xs text-stone-500 mb-3 leading-relaxed">
        How you like your outfits to feel. This is about silhouette and cut — not identity.
        You can change this anytime.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="text-left rounded-2xl border p-3 transition-all"
              style={
                active
                  ? { borderColor: '#AA8EA0', background: '#FAF6F9' }
                  : { borderColor: '#e7e3e6', background: 'white' }
              }
            >
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: active ? '#725265' : '#292524' }}
              >
                {opt.label}
              </p>
              <p className="text-xs text-stone-400 leading-snug">{opt.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
