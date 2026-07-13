import { CoinIcon } from "./CoinIcon";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import { CompareGroup } from "./ComparePanel";
import { useItemHover } from "./useItemHover";
import { RARITY_COLORS } from "../game/data/items";
import { gamblePrice, type GambleOffer } from "../game/data/gambler";
import type { Character, EquipmentSlot, Item } from "../game/types";

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: "Weapon",
  shield: "Shield",
  helm: "Helm",
  armor: "Body Armor",
  gloves: "Gloves",
  boots: "Boots",
  belt: "Belt",
  amulet: "Amulet",
  ring1: "Ring",
  ring2: "Ring",
};

const BASE_SLOTS: EquipmentSlot[] = ["weapon", "helm", "armor", "belt", "gloves", "boots", "amulet", "ring1"];

interface Props {
  character: Character;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  onGamble: (offer: GambleOffer) => void;
  onToggleFavorite: (itemId: string) => void;
}

export function GamblerTab({ character, equipment, inventory, onGamble, onToggleFavorite }: Props) {
  const { hovered, onMouseEnter, onMouseLeave, tooltipStyle, compareStyle, tooltipRef, compareRef } = useItemHover();

  const slots = character.classId === "paladin" ? [...BASE_SLOTS, "shield" as EquipmentSlot] : BASE_SLOTS;
  const offers: GambleOffer[] = slots.map((slot) => ({ slot, price: gamblePrice(slot, character.level) }));

  return (
    <div className="gambler-tab tab-panel">
      <div className="gambler-left">
      <div className="gambler-header">
        <div>
          <div className="gambler-title">Gheedon <span className="gambler-epithet">the Gambler</span></div>
        </div>
      </div>

      <div className="gambler-grid">
        {offers.map((offer, i) => (
          <div key={i} className="gamble-offer">
            <div className="gamble-mystery">?</div>
            <div className="gamble-slot">{SLOT_LABELS[offer.slot]}</div>
            <div className="gamble-price">
              <CoinIcon size={13} />
              {offer.price}
            </div>
            <button
              className="gamble-button"
              disabled={character.gold < offer.price}
              onClick={() => onGamble(offer)}
            >
              Gamble
            </button>
          </div>
        ))}
      </div>
      </div>

      {inventory.length > 0 && (
        <div className="gambler-inventory">
          <h3 className="inventory-label">Inventory ({inventory.length})</h3>
          <div className="inventory-grid">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="inv-cell"
                style={{ color: RARITY_COLORS[item.rarity] }}
                onMouseEnter={(e) => onMouseEnter(item, e)}
                onMouseLeave={onMouseLeave}
              >
                <ItemIcon item={item} />
                <button
                  className={`fav-btn${item.favorite ? " fav-btn--active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                  aria-label={item.favorite ? "Unmark favorite" : "Mark as favorite"}
                >★</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hovered && (
        <>
          <div ref={tooltipRef} style={tooltipStyle()!}>
            <ItemTooltip item={hovered.item} />
          </div>
          <div ref={compareRef} style={compareStyle()!}>
            <CompareGroup slot={hovered.item.slot} equipment={equipment} hoveredItem={hovered.item} />
          </div>
        </>
      )}
    </div>
  );
}
