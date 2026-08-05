import { NOTIF_SEED, useAppStore } from "@/lib/core";
import { Avatar, Icon, Menu } from "@/lib/ui";

export default function NotificationsPage() {
  const S = useAppStore();
  return (
    <div className="content" style={{ maxWidth: 680 }}>
      <div className="row between" style={{ marginBottom: 18 }}>
        <h2 className="display t32">Notifications</h2>
        <button className="btn btn-ghost btn-sm" disabled={S.notifsRead} onClick={S.markNotifsRead}>
          {S.notifsRead ? "All read ✓" : "Mark all as read"}
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {NOTIF_SEED.map((n, i) => {
          const unread = !S.notifsRead && i < 4;
          return (
            <div key={i}>
              <div className="row gap14" style={{ padding: "15px 18px", background: unread ? "rgba(37,153,246,.05)" : "" }}>
                {/* A social row leads with the person, with the reason as a
                    badge on their shoulder — the face is what makes the list
                    scannable. A platform notice has no person, so it keeps the
                    plain icon disc and reads as visibly different. */}
                {n.actor ? (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar name={n.actor} size={42} />
                    <span className="feature-ic"
                      style={{ position: "absolute", right: -2, bottom: -2, width: 20, height: 20, background: "var(--card)", border: "2px solid var(--bg)" }}>
                      <span style={{ color: n.color, display: "flex" }}><Icon n={n.icon} s={11} /></span>
                    </span>
                  </div>
                ) : (
                  <div className="feature-ic" style={{ width: 42, height: 42, background: "var(--fill)", flexShrink: 0 }}>
                    <span style={{ color: n.color }}><Icon n={n.icon} s={18} /></span>
                  </div>
                )}
                <div className="grow">
                  <div className="t14 b6">{n.text}</div>
                  <div className="muted t12">{n.time}</div>
                </div>
                {unread && <span className="dot" style={{ background: "var(--blue)" }} />}
                <Menu items={[
                  { ic: "check", t: "Mark as read", fn: () => S.toast("Marked as read") },
                  { ic: "bell", t: "Turn off this type", fn: () => S.toast("You'll get fewer notifications like this") },
                ]} />
              </div>
              {i < NOTIF_SEED.length - 1 && <hr className="divider" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
