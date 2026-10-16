import { useAppStore } from "@/lib/core";
import { Avatar } from "@/lib/ui";
import { SettingsBack, SettingsNav } from "@/components/settings-nav";

export default function SettingsBlockedPage() {
  const S = useAppStore();
  const handles = Object.entries(S.blocked)
    .filter(([, v]) => v)
    .map(([h]) => h);

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
          <div className="row between" style={{ alignItems: "center" }}>
            <SettingsBack />
            <span className="muted t13">{handles.length} blocked</span>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Blocked accounts</div>
            <hr className="divider" />

            {handles.length === 0 ? (
              <div className="col center gap6" style={{ padding: "40px 18px" }}>
                <span className="b7 t15">No blocked accounts</span>
                <span className="muted t13">
                  When you block someone, they appear here. You can unblock them any time.
                </span>
              </div>
            ) : (
              handles.map((handle, i) => (
                <div key={handle}>
                  <div className="row between" style={{ padding: "13px 18px", gap: 12 }}>
                    <div className="row gap12" style={{ alignItems: "center", minWidth: 0 }}>
                      <Avatar name={handle} size={40} />
                      <div className="col" style={{ minWidth: 0 }}>
                        <span className="b6 t14" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          @{handle}
                        </span>
                        <span className="muted t12">Blocked</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: "none" }}
                      onClick={() => S.unblock(handle)}
                    >
                      Unblock
                    </button>
                  </div>
                  {i < handles.length - 1 && <hr className="divider" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
