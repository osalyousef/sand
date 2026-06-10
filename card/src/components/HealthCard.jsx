import CardFront from './CardFront'
import CardBack from './CardBack'

// Credit-card proportions (ISO 7810 ID-1 ≈ 1.586:1), scaled up for screen.
export default function HealthCard({ pilgrim, theme, flipped, onFlip }) {
  return (
    <div className="card-scene w-[520px] max-w-full" style={{ aspectRatio: '1.586 / 1' }}>
      <button
        type="button"
        onClick={onFlip}
        aria-label="Flip card"
        className={`card-flipper h-full w-full cursor-pointer text-left ${
          flipped ? 'is-flipped' : ''
        }`}
      >
        <div className="card-face">
          <CardFront pilgrim={pilgrim} theme={theme} />
        </div>
        <div className="card-face card-face--back">
          <CardBack pilgrim={pilgrim} theme={theme} />
        </div>
      </button>
    </div>
  )
}
