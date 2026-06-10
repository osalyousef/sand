import CardFront from './CardFront'
import CardBack from './CardBack'

// Vertical ID-badge proportions, like the real Nusuk card.
export default function HealthCard({ pilgrim, theme, flipped, onFlip }) {
  return (
    <div className="card-scene mx-auto w-[340px] max-w-full" style={{ aspectRatio: '0.62 / 1' }}>
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
