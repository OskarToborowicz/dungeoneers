import { useState, type ReactNode } from "react";

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
              By royal decree, you've been cast into the sewers for treason. No trial. Survive, or rot.
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
                You clawed your way out. A travelling merchant, Aldric, greets you at the exit.
              </p>
              <p className="journal-italic">
                "You look like someone who could use a good blade. I go where the road takes me — perhaps with you."
              </p>
              <p>He'll sell you supplies along the way.</p>
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
                In the goblin warren you find a caged man — wiry, quick-eyed, surrounded by trinkets the goblins ignored.
              </p>
              <p className="journal-italic">
                "Gheedon. Collector, connoisseur, occasional gambler. I was merely inspecting the goblins' finer acquisitions when they took exception."
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
              The Chieftain's great key unlocks the colossus gate on the far side of camp. The mountains await.
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
              Sikktharkk's death screech triggers an avalanche. You tumble down the far slope and land at the edge of a vast jungle. Act 3 awaits.
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
                Zam'Koro falls. The flames die. The cursed masks shatter — then the shadows move.
              </p>
              <p>
                A tear rips open in the air itself, revealing ruined towers and wandering spirits. An icy wind carries whispers in a forgotten tongue.
              </p>
              <p className="journal-italic">
                "The veil between the living and the dead has been torn. The darkness is no longer waiting — it is coming."
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
                Relith's scream fades. The realm collapses. A rift of pale light tears open and pulls you through.
              </p>
              <p>
                Cold stone. Rain and iron. You rise from the rubble — and across the mist-filled valley stands the castle that damned you.
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
  const [openEntries, setOpenEntries] = useState<Set<string>>(new Set());

  function toggle(title: string) {
    setOpenEntries((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

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
                {section.entries.map((entry) => {
                  const isOpen = openEntries.has(entry.title);
                  return (
                    <div
                      key={entry.title}
                      className={`journal-entry${entry.unlocked ? "" : " journal-entry--locked"}${isOpen ? " journal-entry--open" : ""}`}
                      style={{ "--act-accent": section.accentColor } as React.CSSProperties}
                      tabIndex={entry.unlocked ? 0 : -1}
                      onClick={() => entry.unlocked && toggle(entry.title)}
                      onKeyDown={(e) => e.key === "Enter" && entry.unlocked && toggle(entry.title)}
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
