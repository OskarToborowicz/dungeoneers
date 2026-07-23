import type { SpireCard } from "../game/data/spire";

interface Props {
  clearedFloor: number;
  isWarden: boolean;
  cards: SpireCard[] | null;
  picked: boolean;
  onPick: (card: SpireCard) => void;
  onContinue: () => void;
  onLeave: () => void;
}

function cardFace(card: SpireCard): { icon: string; title: string; sub: string } {
  switch (card.kind) {
    case "alloy":
      return { icon: "❄", title: "Frozen Alloy", sub: `+${card.amount} alloy` };
    case "gold":
      return { icon: "💰", title: "Gold Hoard", sub: `+${card.amount} gold` };
    case "stats":
      return {
        icon: "💪",
        title: "Ascension",
        sub: `+${card.amount} stat points`,
      };
    case "unique":
      return {
        icon: "🗡",
        title: "Unique Relic",
        sub: `Random unique (ilvl ${card.itemLevel})`,
      };
  }
}

// Between-floor screen: at a Warden the player first picks 1 of the reward cards,
// then (like every floor) decides whether to descend deeper or leave with their
// spoils. Regular floors skip straight to the descend/leave choice.
export function SpireRewards({
  clearedFloor,
  isWarden,
  cards,
  picked,
  onPick,
  onContinue,
  onLeave,
}: Props) {
  const choosing = cards !== null && !picked;

  return (
    <div className="screen spire-reward-screen">
      <h2 className="spire-reward-title">
        {isWarden ? "Warden Defeated" : `Floor ${clearedFloor} Cleared`}
      </h2>

      {choosing ? (
        <>
          <p className="spire-reward-sub">Choose your spoils</p>
          <div className="spire-reward-cards">
            {cards.map((card, i) => {
              const face = cardFace(card);
              return (
                <button
                  key={i}
                  className={`spire-card spire-card--${card.kind}`}
                  onClick={() => onPick(card)}
                >
                  <span className="spire-card-icon">{face.icon}</span>
                  <span className="spire-card-name">{face.title}</span>
                  <span className="spire-card-sub">{face.sub}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="spire-reward-sub">
            Floor {clearedFloor + 1} awaits — descend deeper, or leave with what
            you've won?
          </p>
          <div className="spire-intermission-actions">
            <button className="spire-enter-btn" onClick={onContinue}>
              Descend — Floor {clearedFloor + 1}
            </button>
            <button className="spire-leave-btn" onClick={onLeave}>
              Leave the Spire
            </button>
          </div>
        </>
      )}
    </div>
  );
}
