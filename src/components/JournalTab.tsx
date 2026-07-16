import type { ReactNode } from "react";

interface JournalEntry {
  icon: string;
  title: string;
  unlocked: boolean;
  content: ReactNode;
}

interface ActSection {
  label: string;
  accentColor: string;
  entries: JournalEntry[];
}

function buildSections(clearedDungeons: string[]): ActSection[] {
  const cleared = (id: string) => clearedDungeons.includes(id);

  return [
    {
      label: "Act I — The Road Out",
      accentColor: "#c9932a",
      entries: [
        {
          icon: "⛓️",
          title: "Thrown Into the Sewers",
          unlocked: true,
          content: (
            <p>
              By order of King Victor the Second, you have been cast into the
              royal sewers for treason. No trial. No mercy. Survive, or rot in
              the dark.
            </p>
          ),
        },
        {
          icon: "🌅",
          title: "You Escaped the Sewers",
          unlocked: cleared("sewers"),
          content: (
            <>
              <p>
                Against all odds, you clawed your way out. As your eyes adjust
                to the light, a kind voice greets you — a travelling merchant,
                Aldric, who happened to be passing through. He takes one look at
                you and smiles.
              </p>
              <p className="journal-italic">
                "You look like someone who could use a good blade — or at least
                a warm meal. I go where the road takes me. Perhaps it takes me
                with you."
              </p>
              <p>
                He will accompany you and sell you supplies throughout your
                journey. The world now lies ahead.
              </p>
            </>
          ),
        },
        {
          icon: "🎲",
          title: "A Man in a Cage",
          unlocked: cleared("goblins-path"),
          content: (
            <>
              <p>
                Among the goblin warren's clutter you spot a wooden cage by the
                road — and inside it, a wiry man with quick eyes and ink-stained
                fingers, surrounded by a small pile of trinkets the goblins
                hadn't bothered to take.
              </p>
              <p className="journal-italic">
                "Ah — a capable one! Gheedon is the name. Collector,
                connoisseur, occasional gambler. I was merely... inspecting some
                of the goblins' finer acquisitions when they took exception to
                my presence."
              </p>
              <p>
                He dusts himself off and grins. His curiosity for magic, rare,
                and unique items is insatiable — he keeps an eye on everything
                that passes through the world and offers it to you. But don't
                expect a straightforward deal. Gheedon likes to keep things
                interesting.
              </p>
              <p className="journal-italic">"I'll do it my way. Take it or leave it."</p>
            </>
          ),
        },
        {
          icon: "⛰️",
          title: "The Gate Opens",
          unlocked: cleared("bandits-town-hall"),
          content: (
            <p>
              The Bandit Chieftain is dead. On the far side of town, the heavy
              iron gate groans open — beyond it, a winding road climbs into the
              mountains. Act 2 awaits.
            </p>
          ),
        },
      ],
    },
    {
      label: "Act II — The Frozen Peaks",
      accentColor: "#6ab8d4",
      entries: [
        {
          icon: "🌿",
          title: "The Mountain Falls",
          unlocked: cleared("the-white-maw"),
          content: (
            <p>
              Sikktharkk's dying screech shook the peaks. An avalanche tore the
              mountainside open and swept you down the far slope. You survived —
              battered, half-frozen — and at the bottom you saw it: a vast, deep
              jungle where the frozen wastelands end. Act 3 awaits.
            </p>
          ),
        },
      ],
    },
    {
      label: "Act III — The Jungle Depths",
      accentColor: "#4ec97b",
      entries: [
        {
          icon: "🌑",
          title: "The Veil Has Torn",
          unlocked: cleared("sacrificial-altar"),
          content: (
            <>
              <p>
                Zam'Koro's final cry fades. The emerald flames die. The cursed
                masks shatter, releasing souls imprisoned for centuries.
              </p>
              <p>Then the shadows move.</p>
              <p>
                Darkness spills like liquid across the ground, swallowing the
                light. A jagged tear opens in the air itself — revealing ruined
                towers, twisted forests, and wandering spirits beyond. An icy
                wind carries whispers in a language long forgotten.
              </p>
              <p className="journal-italic">
                "The Loa's curse has fallen... but its prison has broken with
                it. The veil between the living and the dead has been torn open.
                Beyond this rift lies the Shadowlands, where lost souls wander
                and forgotten kings still reign. The darkness is no longer
                waiting — it is coming."
              </p>
            </>
          ),
        },
      ],
    },
    {
      label: "Act IV — Realm of Endless Night",
      accentColor: "#9966cc",
      entries: [
        {
          icon: "🌌",
          title: "The Void Collapses",
          unlocked: cleared("throne-of-endless-night"),
          content: (
            <>
              <p>
                The realm tears itself apart. Stone dissolves into void. The sky
                collapses inward as Relith's final scream fades into nothing.
              </p>
              <p>Then — silence.</p>
              <p>
                A rift of pale light tears open above the rubble. You feel it
                pulling, dragging you through — and in an instant, you're
                somewhere else.
              </p>
              <p>Cold stone beneath your hands. The scent of rain and iron. You push yourself upright, and the fog clears.</p>
              <p className="journal-italic">
                Before you, across a valley blanketed in mist, stands a great
                castle — its towers lit with golden light, its banners
                unmistakable. The castle you were thrown out of. The castle that
                damned you to die beneath the sewers.
              </p>
              <p className="journal-italic">It is calling you home.</p>
            </>
          ),
        },
      ],
    },
  ];
}

interface Props {
  clearedDungeons: string[];
}

export function JournalTab({ clearedDungeons }: Props) {
  const sections = buildSections(clearedDungeons);

  return (
    <div className="tab-panel journal-panel">
      <div className="journal-scroll">
        {sections.map((section) => {
          const anyUnlocked = section.entries.some((e) => e.unlocked);
          return (
            <div
              key={section.label}
              className={`journal-act${anyUnlocked ? "" : " journal-act--locked"}`}
            >
              <div
                className="journal-act-label"
                style={{ "--act-accent": section.accentColor } as React.CSSProperties}
              >
                {anyUnlocked ? section.label : section.label.replace(/— .+$/, "— ????")}
              </div>
              <div className="journal-entries">
                {section.entries.map((entry) => (
                  <div
                    key={entry.title}
                    className={`journal-entry${entry.unlocked ? "" : " journal-entry--locked"}`}
                    style={{ "--act-accent": section.accentColor } as React.CSSProperties}
                    tabIndex={entry.unlocked ? 0 : -1}
                  >
                    <div className="journal-entry-header">
                      <span className="journal-entry-icon">{entry.unlocked ? entry.icon : "?"}</span>
                      <span className="journal-entry-title">{entry.unlocked ? entry.title : "????"}</span>
                      {entry.unlocked && (
                        <span className="journal-entry-caret">›</span>
                      )}
                    </div>
                    {entry.unlocked ? (
                      <div className="journal-entry-body">
                        <div className="journal-entry-inner">
                          {entry.content}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
