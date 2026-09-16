import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { Avatar, Icon, Photo, SIZES, coverFor } from "@/lib/ui";
import { PostCard } from "@/components/post-card";

/**
 * The signed-in account's own profile — same header/avatar shape as
 * `/creator/:handle`, but there is no creator to subscribe to or tip here,
 * so those actions are swapped for editing and posting. Name and handle
 * come from the store (`S.profile`), same as the sidebar's account card in
 * `_shell.tsx` — editing here is what keeps both in sync.
 */
export default function ProfilePage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const { name, handle, avatarUrl, coverUrl } = S.profile;
  const subCount = Object.keys(S.subs).length;
  const followCount = Object.values(S.follows).filter(Boolean).length;

  return (
    <div>
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        {coverUrl ? (
          <img src={coverUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Photo sizes={SIZES.cover} src={coverFor(handle)} seed={handle} />
        )}
      </div>
      <div className="content" style={{ marginTop: -78 }}>
        <div style={{ width: 112, height: 112, boxSizing: "border-box", border: "4px solid var(--bg)", borderRadius: "50%", position: "relative" }}>
          <Avatar name={name} size={104} src={avatarUrl} />
        </div>
        <div className="row between wrap" style={{ alignItems: "flex-end", gap: 16, marginTop: 14 }}>
          <div className="col gap4">
            <div className="t24 b7 uname">{name}</div>
            <div className="muted">@{handle}</div>
            <div className="row gap16 muted t13" style={{ marginTop: 4 }}>
              <span><b>{S.myPosts.length}</b> posts</span>
              <span><b>{subCount}</b> subscriptions</span>
              <span><b>{followCount}</b> following</span>
            </div>
          </div>
          <div className="row gap10">
            <button className="btn btn-ghost" onClick={() => navigate("/profile/edit")}>
              <Icon n="gear" s={16} />Edit profile
            </button>
            <button className="btn btn-blue" onClick={() => S.openModal("compose")}>
              <Icon n="plus" s={15} />New post
            </button>
          </div>
        </div>

        <div className="up muted" style={{ margin: "26px 0 14px" }}>Your posts</div>

        <div className="col gap16" style={{ maxWidth: 620 }}>
          {S.myPosts.length === 0 ? (
            <div className="card col center gap10" style={{ padding: 48, textAlign: "center" }}>
              <div className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="doc" c="var(--muted)" /></div>
              <div className="b7">You haven&apos;t posted yet</div>
              <div className="muted t13">Share something with your fans to see it here.</div>
              <button className="btn btn-blue btn-sm" onClick={() => S.openModal("compose")}>Create a post</button>
            </div>
          ) : (
            S.myPosts.map((p) => <PostCard key={p.id} p={p} />)
          )}
        </div>
      </div>
    </div>
  );
}
