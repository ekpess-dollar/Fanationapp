import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { Avatar, Icon, Menu, Photo, SIZES, coverFor } from "@/lib/ui";

const GENDERS = ["Prefer not to say", "Female", "Male", "Non-binary"];

/** A file the browser just handed us, as a data URL — the only place an
    uploaded image can live with no storage endpoint behind it. */
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

/**
 * A full page rather than a modal — enough fields (name, handle, gender,
 * email, location, interest, bio, two photos) that a small popup would
 * either scroll awkwardly or get cramped. Cover, avatar and the save/menu
 * row live in one header block; everything else is a plain labelled list,
 * same `.input`/`.label` pieces every other form in this app already uses.
 */
export default function EditProfilePage() {
  const navigate = useNavigate();
  const S = useAppStore();
  const p = S.profile;

  const [fullName, setFullName] = useState(p.fullName);
  const [name, setName] = useState(p.name);
  const [handle, setHandle] = useState(p.handle);
  const [email, setEmail] = useState(p.email);
  const [gender, setGender] = useState(p.gender);
  const [location, setLocation] = useState(p.location);
  const [interest, setInterest] = useState(p.interest);
  const [bio, setBio] = useState(p.bio);
  const [avatarUrl, setAvatarUrl] = useState(p.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(p.coverUrl);

  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const nameErr = name.trim().length < 2 ? "Display name must be at least 2 characters" : null;
  const handleErr = !/^[A-Za-z0-9_]{3,}$/.test(handle)
    ? "3+ characters, letters, numbers and underscores only"
    : null;

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>, apply: (url: string) => void) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // clears the value so picking the same file twice still fires onChange
    if (file) apply(await readAsDataUrl(file));
  };

  const save = () => {
    if (nameErr || handleErr) return;
    S.updateProfile({
      fullName: fullName.trim(), name: name.trim(), handle: handle.trim(),
      email: email.trim(), gender, location: location.trim(), interest: interest.trim(), bio: bio.trim(),
      avatarUrl, coverUrl,
    });
    navigate("/profile");
  };

  return (
    <div className="content" style={{ maxWidth: 680 }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => navigate("/profile")}>
        <span className="row" style={{ transform: "rotate(180deg)" }}><Icon n="arrow" s={15} /></span>
        Back to profile
      </button>

      <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => pickImage(e, setCoverUrl)} />
      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => pickImage(e, setAvatarUrl)} />

      <div className="card" style={{ padding: 0, overflow: "visible", marginTop: 14, marginBottom: 56 }}>
        <div style={{ height: 140, borderRadius: "var(--r) var(--r) 0 0", overflow: "hidden", position: "relative", cursor: "pointer" }}
          onClick={() => coverInput.current?.click()}>
          {coverUrl ? (
            <img src={coverUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Photo sizes={SIZES.cover} src={coverFor(handle)} seed={handle} />
          )}
          <div className="row center gap6 onart" style={{ position: "absolute", right: 12, bottom: 12, padding: "6px 12px", borderRadius: 999 }}>
            <Icon n="camera" s={13} c="#fff" /><span className="t12 b6" style={{ color: "#fff" }}>Change cover</span>
          </div>
        </div>

        <div className="row center" style={{ marginTop: -48 }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => avatarInput.current?.click()}>
            <div style={{ width: 96, height: 96, boxSizing: "border-box", border: "4px solid var(--card)", borderRadius: "50%", position: "relative" }}>
              <Avatar name={name} size={88} src={avatarUrl} />
            </div>
            <div className="row center" style={{ position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: "50%", background: "var(--blue)", border: "2px solid var(--card)" }}>
              <Icon n="camera" s={13} c="#fff" />
            </div>
          </div>
        </div>

        <div className="row gap10" style={{ justifyContent: "flex-end", padding: "14px 18px 18px" }}>
          <button className="btn btn-blue btn-sm" disabled={!!nameErr || !!handleErr} onClick={save}>Save profile</button>
          <Menu
            align="right"
            trigger={<button className="btn btn-ghost btn-sm" style={{ padding: "8px 10px" }}><Icon n="more" s={16} /></button>}
            items={[
              { ic: "logout", t: "Log out", fn: () => S.openModal("logout") },
              { ic: "x", t: "Delete account", danger: true, fn: () => S.toast("Account deletion requires email confirmation — check your inbox", "err") },
            ]}
          />
        </div>
      </div>

      <div className="col gap16">
        <Field label="Full name" htmlFor="pe-fullname">
          <input id="pe-fullname" className="input" value={fullName} maxLength={60} onChange={(e) => setFullName(e.target.value)} />
        </Field>

        <Field label="Display name" htmlFor="pe-name">
          <input id="pe-name" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)}
            style={{ borderColor: nameErr ? "rgba(243,106,70,.5)" : undefined }} />
          {nameErr && <div className="coral t12" style={{ marginTop: 6 }}>{nameErr}</div>}
        </Field>

        <Field label="Username" htmlFor="pe-handle">
          <div className="row hair" style={{ padding: "0 14px", borderRadius: 14, borderColor: handleErr ? "rgba(243,106,70,.5)" : "var(--line)" }}>
            <span className="muted t14">@</span>
            <input id="pe-handle" className="input" style={{ border: "none", background: "none" }} value={handle} maxLength={24}
              onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))} />
          </div>
          {handleErr && <div className="coral t12" style={{ marginTop: 6 }}>{handleErr}</div>}
        </Field>

        <Field label="Gender" htmlFor="pe-gender">
          <select id="pe-gender" className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>

        <Field label="Email" htmlFor="pe-email">
          <input id="pe-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Location" htmlFor="pe-location">
          <input id="pe-location" className="input" value={location} maxLength={60} onChange={(e) => setLocation(e.target.value)} />
        </Field>

        <Field label="Interest" htmlFor="pe-interest">
          <input id="pe-interest" className="input" value={interest} maxLength={80} placeholder="Music, photography, gaming…"
            onChange={(e) => setInterest(e.target.value)} />
        </Field>

        <Field label="Bio" htmlFor="pe-bio">
          <textarea id="pe-bio" className="input" rows={4} maxLength={280} placeholder="Tell fans a little about yourself"
            value={bio} onChange={(e) => setBio(e.target.value)} style={{ resize: "none" }} />
        </Field>
      </div>
    </div>
  );
}
