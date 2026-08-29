import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, subscribe, storage, DEMO } from "./api.js";
import "./App.css";

/* Error boundary: never show a blank/black screen, always show something. */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: "#f5f1e9", color: "#1f2b25" }}>
          <span className="font-display text-7xl" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            j<span style={{ color: "#d66b4b" }}>.</span>
          </span>
          <h1 className="mt-4 text-2xl font-semibold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Something slipped out of orbit</h1>
          <p className="mt-2 max-w-sm text-sm" style={{ color: "#64716a" }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#173f2c" }}
          >
            Reload Jupiter
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------- helpers ------------------------------- */

export function initials(name = "?") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => (w[0] || "").toUpperCase())
      .join("") || "?"
  );
}

export function timeAgo(ts, now = Date.now()) {
  const d = Math.max(0, now - ts);
  if (d < 45_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  if (d < 7 * 86_400_000) return `${Math.floor(d / 86_400_000)}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function clockTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function joinedLabel(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function greeting(now) {
  const h = new Date(now).getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* -------------------------------- icons -------------------------------- */

const Svg = ({ children, size = 20, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

const IcHome = (p) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </Svg>
);
const IcPeople = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.8 20c.7-3.2 3.2-5 6.2-5s5.5 1.8 6.2 5" />
    <path d="M15.4 5.2a3.4 3.4 0 0 1 0 5.9" />
    <path d="M17.6 15.3c1.9.7 3.2 2.2 3.6 4.7" />
  </Svg>
);
const IcChat = (p) => (
  <Svg {...p}>
    <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 21l1.6-5.3A8.5 8.5 0 1 1 21 12Z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.4" />
  </Svg>
);
const IcUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20.4c.8-3.6 3.7-5.6 7.2-5.6s6.4 2 7.2 5.6" />
  </Svg>
);
const IcHeart = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.4 4.7 13a4.8 4.8 0 0 1 0-6.8 4.7 4.7 0 0 1 6.7 0l.6.6.6-.6a4.7 4.7 0 0 1 6.7 0 4.8 4.8 0 0 1 0 6.8Z" />
  </Svg>
);
const IcComment = (p) => (
  <Svg {...p}>
    <path d="M4 5.5h16v11H9.5L5.5 20v-3.5H4Z" />
  </Svg>
);
const IcTrash = (p) => (
  <Svg {...p}>
    <path d="M4.5 6.5h15M9.5 6V4.5h5V6M7 6.5l.8 13h8.4l.8-13M10 10.5v5.5M14 10.5v5.5" />
  </Svg>
);
const IcSend = (p) => (
  <Svg {...p}>
    <path d="M20.5 3.5 3.5 10.8l6.4 2.4 2.5 6.3Z" />
    <path d="M20.5 3.5 9.9 13.2" />
  </Svg>
);
const IcSearch = (p) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m20 20-4.6-4.6" />
  </Svg>
);
const IcOut = (p) => (
  <Svg {...p}>
    <path d="M14 4.5H6v15h8M10.5 12H21M17.5 8.5 21 12l-3.5 3.5" />
  </Svg>
);
const IcPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const IcCheck = (p) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);
const IcX = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
const IcBack = (p) => (
  <Svg {...p}>
    <path d="M20 12H4M10.5 5.5 4 12l6.5 6.5" />
  </Svg>
);
const IcEdit = (p) => (
  <Svg {...p}>
    <path d="m14.5 5.5 4 4L8 20H4v-4Z" />
    <path d="m12.5 7.5 4 4" />
  </Svg>
);
const Spinner = ({ size = 18, light }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={light ? "rgba(245,241,233,.25)" : "rgba(23,63,44,.15)"} strokeWidth="3" fill="none" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke={light ? "#f5f1e9" : "#286149"} strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

/* ------------------------------ primitives ------------------------------ */

const AV_COLORS = {
  pine: "#173f2c",
  moss: "#286149",
  coral: "#d66b4b",
  gold: "#b8862b",
  clay: "#a4674d",
  slate: "#4c5f55",
};

export function Avatar({ name = "?", color = "pine", size = 40, online = false, className = "" }) {
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-semibold select-none"
        style={{ backgroundColor: AV_COLORS[color] || AV_COLORS.pine, color: "#f3efe6", fontSize: Math.max(10, size * 0.34) }}
      >
        {initials(name)}
      </div>
      {online && (
        <span
          className="online-dot absolute rounded-full border-2 border-white bg-moss-soft"
          style={{ width: Math.max(9, size * 0.28), height: Math.max(9, size * 0.28), right: -1, bottom: -1 }}
        />
      )}
    </div>
  );
}

export function Wordmark({ size = "text-3xl", light = false, className = "" }) {
  return (
    <span className={`wordmark ${size} ${className}`}>
      <span className={light ? "text-cream" : "text-pine"}>j</span>
      <span className="text-coral">.</span>
    </span>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-parch ${className}`} />;
}

function ToastStack({ toasts }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-[70] flex w-[calc(100%-2rem)] max-w-xs flex-col items-end gap-2 md:bottom-5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`anim-toast pointer-events-auto flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg ${
            t.kind === "err"
              ? "border-white/15 bg-coral-deep text-[#fff3ee]"
              : "border-white/10 bg-pine text-cream"
          }`}
        >
          <span className={t.kind === "err" ? "text-[#ffd9cc]" : "text-fern"}>
            {t.kind === "err" ? <IcX size={16} /> : <IcCheck size={16} />}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- auth --------------------------------- */

function OrbitArt() {
  return (
    <svg viewBox="0 0 320 320" className="h-44 w-44 opacity-90" aria-hidden="true">
      <g>
        <circle cx="160" cy="160" r="72" fill="none" stroke="rgba(169,195,178,.35)" strokeWidth="1" strokeDasharray="3 7" />
        <circle cx="160" cy="88" r="6" fill="#d66b4b" />
      </g>
      <g>
        <circle cx="160" cy="160" r="118" fill="none" stroke="rgba(169,195,178,.25)" strokeWidth="1" strokeDasharray="2 9" />
        <circle cx="278" cy="160" r="4.5" fill="#f5f1e9" />
        <circle cx="77" cy="243" r="3" fill="#a9c3b2" />
      </g>
      <circle cx="160" cy="160" r="30" fill="#286149" />
      <text x="160" y="172" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize="36" fill="#f5f1e9">
        j
      </text>
    </svg>
  );
}

function Auth({ onAuth, toast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErr(null);
  };

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res =
        mode === "login"
          ? await api.login(form.email, form.password)
          : await api.register(form.name, form.email, form.password);
      toast(
        mode === "login"
          ? `Welcome back, ${res.user.name.split(" ")[0]}`
          : `Account created — welcome, ${res.user.name.split(" ")[0]}`
      );
      onAuth(res.token, res.user);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function useDemo() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await api.login(DEMO.email, DEMO.password);
      toast(`Welcome back, ${res.user.name.split(" ")[0]}`);
      onAuth(res.token, res.user);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-bg grain grain-soft relative flex min-h-screen">
      {/* Brand strip — matches the dashboard sidebar */}
      <div className="grain relative hidden w-64 shrink-0 flex-col overflow-hidden bg-pine text-cream lg:flex">
        <div className="watermark absolute -right-8 -bottom-12 text-[300px]">j</div>
        <div className="relative px-6 pt-7 pb-4">
          <Wordmark light size="text-4xl" />
          <p className="mt-1.5 text-[11.5px] font-medium tracking-wide text-fern/80">your personal solar system</p>
        </div>
        <div className="relative flex flex-1 items-center justify-center px-6">
          <OrbitArt />
        </div>
        <div className="relative px-6 pb-7">
          <p className="text-[12.5px] leading-relaxed text-fern/90">your gravity, your people.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center px-5 py-8 sm:px-10 lg:justify-center lg:py-12">
        <div className="mb-8 lg:hidden">
          <Wordmark size="text-4xl" />
          <p className="mt-2 text-sm text-ink-soft">your gravity, your people.</p>
        </div>

        <div className="w-full max-w-md">
          <p className="eyebrow">{mode === "login" ? "Sign in" : "Create account"}</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            {mode === "login" ? "Back in orbit" : "Join the orbit"}
            <span className="text-coral">.</span>
          </h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            {mode === "login" ? "Log in to catch up with your people." : "A minute to sign up, years of small talk."}
          </p>

          <div className="mt-7 rounded-xl border border-parch bg-white p-6 shadow-[0_18px_44px_-24px_rgba(23,63,44,0.25)] sm:p-7">
            <div className="mb-5 flex rounded-lg bg-cream p-1">
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErr(null); }}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                    mode === m ? "bg-white text-pine shadow-sm" : "text-ink-soft hover:text-pine"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="eyebrow mb-1.5 block" htmlFor="f-name">Full name</label>
                  <input id="f-name" className="field" placeholder="Yisrael Yisraeli" value={form.name} onChange={set("name")} autoComplete="name" />
                </div>
              )}
              <div>
                <label className="eyebrow mb-1.5 block" htmlFor="f-email">Email</label>
                <input id="f-email" className="field" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
              </div>
              <div>
                <label className="eyebrow mb-1.5 block" htmlFor="f-pass">Password</label>
                <input id="f-pass" className="field" type="password" placeholder={mode === "register" ? "At least 6 characters" : "Your password"} value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />
              </div>

              {err && (
                <p className="flex items-center gap-2 rounded-lg bg-coral/10 px-3 py-2 text-[13px] font-medium text-coral-deep">
                  <IcX size={14} /> {err}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn btn-primary w-full py-2.5 text-[15px]">
                {busy ? (mode === "login" ? "Signing in…" : "Creating account…") : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] font-semibold tracking-widest text-ink-soft/70 uppercase">
              <span className="h-px flex-1 bg-parch" /> or <span className="h-px flex-1 bg-parch" />
            </div>

            <button type="button" onClick={useDemo} disabled={busy} className="btn btn-ghost w-full py-2.5 text-[14px]">
              <span className="inline-block h-2 w-2 rounded-full bg-coral" />
              Try the demo
            </button>
            <p className="mt-3 text-center text-[12px] text-ink-soft">
              demo login: <span className="font-semibold text-moss">noa@example.com</span> · <span className="font-semibold text-moss">password</span>
            </p>
          </div>
        </div>

        <p className="mt-8 text-[12px] text-ink-soft/80">
          Jupiter · Jenny Gershengoren project — React, Express, Socket.IO &amp; JWT.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------- shell --------------------------------- */

const NAV = [
  { id: "feed", label: "Home", icon: IcHome },
  { id: "people", label: "People", icon: IcPeople },
  { id: "messages", label: "Messages", icon: IcChat },
  { id: "profile", label: "Profile", icon: IcUser },
];

function Badge({ n }) {
  if (!n) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-[#fff5f0]">
      {n > 9 ? "9+" : n}
    </span>
  );
}

function Sidebar({ view, setView, unread, user, onLogout }) {
  return (
    <aside className="grain fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-pine text-cream lg:flex">
      <div className="watermark absolute -right-8 -bottom-12 text-[300px]">j</div>
      <div className="relative px-6 pt-7 pb-4">
        <Wordmark light size="text-4xl" />
        <p className="mt-1.5 text-[11.5px] font-medium tracking-wide text-fern/80">your personal solar system</p>
      </div>
      <nav className="relative mt-5 flex-1 space-y-1 px-4">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setView(n.id)} className={`nav-item w-full ${view === n.id ? "active" : ""}`}>
            <n.icon size={19} />
            {n.label}
            {n.id === "messages" && <Badge n={unread} />}
          </button>
        ))}
      </nav>
      <div className="relative border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.color} size={40} online />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{user.name}</p>
            <p className="truncate text-[12px] text-fern/80">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="rounded-full p-2 text-fern transition-colors hover:bg-white/10 hover:text-coral"
          >
            <IcOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileChrome({ view, setView, unread, user, onLogout }) {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-pine px-4 text-cream shadow-md lg:hidden">
        <Wordmark light size="text-3xl" />
        <div className="flex items-center gap-2">
          <button onClick={onLogout} title="Log out" className="rounded-full p-2 text-fern transition-colors hover:bg-white/10 hover:text-coral">
            <IcOut size={17} />
          </button>
          <button onClick={() => setView("profile")} className="rounded-full transition-transform active:scale-95">
            <Avatar name={user.name} color={user.color} size={32} />
          </button>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-parch bg-white/95 backdrop-blur lg:hidden">
        {NAV.map((n) => {
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition-colors ${active ? "text-pine" : "text-ink-soft"}`}>
              <span className="relative">
                <n.icon size={21} />
                {n.id === "messages" && unread > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[9.5px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                )}
              </span>
              {n.label}
              <span className={`absolute bottom-0 h-0.5 w-8 rounded-full bg-coral transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
            </button>
          );
        })}
      </nav>
    </>
  );
}

function Shell({ token, user, setUser, onLogout, toast }) {
  const [view, setView] = useState("feed");
  const [chatTarget, setChatTarget] = useState(null);
  const [unread, setUnread] = useState(0);
  const now = useNow();

  const loadUnread = useCallback(() => {
    api.getConversations(token)
      .then((cs) => setUnread(cs.reduce((n, c) => n + c.unread, 0)))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadUnread();
    const a = subscribe("message", loadUnread);
    const b = subscribe("read", loadUnread);
    return () => { a(); b(); };
  }, [loadUnread]);

  const openChat = useCallback(
    async (userId) => {
      try {
        const convId = await api.startConversation(token, userId);
        setChatTarget(convId);
        setView("messages");
      } catch (e) {
        toast(e.message, "err");
      }
    },
    [token, toast]
  );

  return (
    <div className="app-bg grain grain-soft relative min-h-screen">
      <Sidebar view={view} setView={setView} unread={unread} user={user} onLogout={onLogout} />
      <MobileChrome view={view} setView={setView} unread={unread} user={user} onLogout={onLogout} />

      <main className="min-h-screen pt-14 pb-24 lg:pt-0 lg:pb-10 lg:pl-64">
        <div key={view} className="anim-fade mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-5">
          {view === "feed" && <FeedView token={token} me={user} toast={toast} now={now} openChat={openChat} setView={setView} />}
          {view === "people" && <PeopleView token={token} me={user} toast={toast} now={now} openChat={openChat} />}
          {view === "messages" && <MessagesView token={token} me={user} toast={toast} now={now} target={chatTarget} />}
          {view === "profile" && <ProfileView token={token} me={user} setUser={setUser} toast={toast} now={now} openChat={openChat} />}
        </div>
      </main>
    </div>
  );
}

/* --------------------------------- feed --------------------------------- */

function Composer({ token, me, toast }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function post() {
    if (busy || !text.trim()) return;
    setBusy(true);
    try {
      await api.createPost(token, text);
      setText("");
      toast("Posted to your orbit");
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setBusy(false);
    }
  }

  const over = text.length > 280;
  return (
    <div className="rounded-xl border border-parch bg-white p-4 shadow-[0_10px_30px_-22px_rgba(23,63,44,0.35)] sm:p-5">
      <div className="flex gap-3">
        <Avatar name={me.name} color={me.color} size={40} online />
        <textarea
          className="field resize-none leading-relaxed"
          rows={3}
          placeholder={`What's happening in your orbit, ${me.name.split(" ")[0]}?`}
          value={text}
          maxLength={320}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") post();
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between pl-[52px]">
        <span className={`text-[12px] font-semibold tabular-nums ${over ? "text-coral-deep" : "text-ink-soft/70"}`}>
          {text.length > 0 ? `${text.length}/280` : "280 characters"}
        </span>
        <button onClick={post} disabled={busy || !text.trim() || over} className="btn btn-primary px-5 py-2 text-sm">
          {busy ? <Spinner size={15} light /> : <IcSend size={15} />}
          Post
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, me, token, now, toast, openChat }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [burst, setBurst] = useState(0);
  const [data, setData] = useState(post);
  const [busyLike, setBusyLike] = useState(false);
  const busyComment = useRef(false);
  const mine = data.author && data.author.id === me.id;

  useEffect(() => setData(post), [post]);

  useEffect(() => {
    if (!confirmDel) return;
    const t = setTimeout(() => setConfirmDel(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDel]);

  async function like() {
    if (busyLike) return;
    setBusyLike(true);
    try {
      const res = await api.toggleLike(token, data.id);
      setData((d) => ({ ...d, likes: res.likes, likedByMe: res.likedByMe }));
      if (res.likedByMe) setBurst((b) => b + 1);
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setBusyLike(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (busyComment.current || !comment.trim()) return;
    busyComment.current = true;
    try {
      const updated = await api.addComment(token, data.id, comment);
      setData(updated);
      setComment("");
    } catch (ex) {
      toast(ex.message, "err");
    } finally {
      busyComment.current = false;
    }
  }

  async function del() {
    try {
      await api.deletePost(token, data.id);
      toast("Post deleted");
    } catch (e) {
      toast(e.message, "err");
    }
  }

  return (
    <article className="lift rounded-xl border border-parch bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar name={data.author?.name} color={data.author?.color} size={40} online={data.author?.online} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {mine ? (
              <span className="text-[15px] font-bold">{data.author?.name}</span>
            ) : (
              <button onClick={() => openChat(data.author.id)} title="Send a message" className="text-[15px] font-bold transition-colors hover:text-moss">
                {data.author?.name}
              </button>
            )}
            <span className="text-[12.5px] text-ink-soft">· {timeAgo(data.createdAt, now)}</span>
          </div>
          <p className="mt-1.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{data.text}</p>
        </div>
        {mine && (
          <div className="flex shrink-0 items-center gap-1.5">
            {confirmDel ? (
              <>
                <span className="text-[12px] font-semibold text-ink-soft">Delete?</span>
                <button onClick={del} className="btn btn-coral px-2.5 py-1 text-[12px]">Yes</button>
                <button onClick={() => setConfirmDel(false)} className="btn btn-ghost px-2.5 py-1 text-[12px]">No</button>
              </>
            ) : (
              <button onClick={() => setConfirmDel(true)} title="Delete post" className="rounded-full p-1.5 text-ink-soft/60 transition-colors hover:bg-coral/10 hover:text-coral-deep">
                <IcTrash size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center gap-2 border-t border-cream pt-3">
        <button
          onClick={like}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            data.likedByMe ? "bg-coral/12 text-coral-deep" : "text-ink-soft hover:bg-cream hover:text-coral-deep"
          }`}
        >
          <span key={burst} className={burst ? "anim-pop inline-flex" : "inline-flex"}>
            <IcHeart size={16} filled={data.likedByMe} />
          </span>
          {data.likes > 0 ? data.likes : "Like"}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            showComments ? "bg-moss/10 text-moss" : "text-ink-soft hover:bg-cream hover:text-moss"
          }`}
        >
          <IcComment size={16} />
          {data.comments.length > 0 ? data.comments.length : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className="anim-fade mt-3 space-y-2.5">
          {data.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.author?.name} color={c.author?.color} size={28} />
              <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-parch bg-cream/70 px-3 py-2">
                <p className="flex items-baseline gap-2">
                  <span className="text-[12.5px] font-bold">{c.author?.name}</span>
                  <span className="text-[11px] text-ink-soft">{timeAgo(c.createdAt, now)}</span>
                </p>
                <p className="mt-0.5 text-[13.5px] leading-snug break-words">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex items-center gap-2.5 pt-0.5">
            <Avatar name={me.name} color={me.color} size={28} />
            <input className="field py-2 text-[13.5px]" placeholder="Write a comment…" value={comment} maxLength={280} onChange={(e) => setComment(e.target.value)} />
            <button type="submit" disabled={!comment.trim()} className="btn btn-primary h-9 w-9 shrink-0 rounded-full p-0" title="Send comment">
              <IcSend size={14} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function FeedRail({ token, me, toast, openChat, setView, now }) {
  const [friends, setFriends] = useState(null);
  const [discover, setDiscover] = useState(null);
  const [adding, setAdding] = useState(null);

  const load = useCallback(() => {
    api.getFriends(token).then(setFriends).catch(() => {});
    api.searchUsers(token, "").then((us) => setDiscover(us.filter((u) => u.relation === "none"))).catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
    return subscribe("friends", load);
  }, [load]);

  async function add(u) {
    setAdding(u.id);
    try {
      await api.sendRequest(token, u.id);
      toast(`Request sent to ${u.name.split(" ")[0]}`);
      load();
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setAdding(null);
    }
  }

  const online = (friends || []).filter((f) => f.online);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-parch bg-white p-5">
        <p className="eyebrow">Online now</p>
        <div className="mt-3 space-y-1">
          {friends === null && <><Skeleton className="h-10" /><Skeleton className="mt-2 h-10" /></>}
          {friends && online.length === 0 && <p className="py-2 text-[13px] text-ink-soft">Nobody's around right now.</p>}
          {online.map((f) => (
            <button key={f.id} onClick={() => openChat(f.id)} className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-cream">
              <Avatar name={f.name} color={f.color} size={34} online />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold">{f.name}</span>
                <span className="block text-[11.5px] text-moss-soft">online</span>
              </span>
              <span className="text-ink-soft/40 transition-all group-hover:text-moss">
                <IcChat size={16} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-parch bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">People to meet</p>
          <button onClick={() => setView("people")} className="text-[12px] font-bold text-moss transition-colors hover:text-pine">See all</button>
        </div>
        <div className="mt-3 space-y-3">
          {discover === null && <><Skeleton className="h-12" /><Skeleton className="h-12" /></>}
          {discover && discover.length === 0 && <p className="py-1 text-[13px] text-ink-soft">You've met everyone. Impressive.</p>}
          {(discover || []).slice(0, 3).map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <Avatar name={u.name} color={u.color} size={38} online={u.online} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{u.name}</p>
                <p className="truncate text-[12px] text-ink-soft">{u.bio || "New to Jupiter"}</p>
              </div>
              <button onClick={() => add(u)} disabled={adding === u.id} className="btn btn-ghost px-3 py-1.5 text-[12.5px]">
                {adding === u.id ? <Spinner size={13} /> : <IcPlus size={13} />}
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-moss/30 bg-moss/5 p-5">
        <p className="font-display text-[17px] font-semibold text-pine">Tip of the day</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          Open this app in a second tab, log in as <span className="font-semibold text-moss">yoni@example.com</span> (password: <span className="font-semibold text-moss">password</span>) and message Noa — the chat is live.
        </p>
      </div>
    </div>
  );
}

function FeedView({ token, me, toast, now, openChat, setView }) {
  const [posts, setPosts] = useState(null);

  const load = useCallback(() => {
    api.getFeed(token).then(setPosts).catch((e) => toast(e.message, "err"));
  }, [token, toast]);

  useEffect(() => {
    load();
    return subscribe("feed", load);
  }, [load]);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <header className="mb-4">
          <p className="eyebrow">Home feed</p>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting(now)}, {me.name.split(" ")[0]}
            <span className="text-coral">.</span>
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">Here's what your orbit has been up to.</p>
        </header>

        <Composer token={token} me={me} toast={toast} />

        <div className="mt-4 space-y-4">
          {posts === null && (
            <>
              <div className="rounded-xl border border-parch bg-white p-5">
                <div className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-24" /></div></div>
                <Skeleton className="mt-4 h-14" />
              </div>
              <div className="rounded-xl border border-parch bg-white p-5">
                <div className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="mt-2 h-3 w-20" /></div></div>
                <Skeleton className="mt-4 h-20" />
              </div>
            </>
          )}
          {posts && posts.length === 0 && (
            <div className="rounded-xl border border-dashed border-moss/30 bg-white/70 p-10 text-center">
              <p className="font-display text-2xl font-semibold text-pine">Your orbit is quiet</p>
              <p className="mx-auto mt-2 max-w-xs text-[14px] text-ink-soft">Add a few people and their posts will land here — or say something yourself above.</p>
              <button onClick={() => setView("people")} className="btn btn-primary mx-auto mt-5 px-5 py-2 text-sm"><IcPeople size={15} /> Find people</button>
            </div>
          )}
          {(posts || []).map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 4) * 50}>
              <PostCard post={p} me={me} token={token} now={now} toast={toast} openChat={openChat} />
            </Reveal>
          ))}
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-9">
          <FeedRail token={token} me={me} toast={toast} openChat={openChat} setView={setView} now={now} />
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------- people -------------------------------- */

function RelationActions({ u, token, toast, onChange, openChat, compact = false }) {
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!confirmRemove) return;
    const t = setTimeout(() => setConfirmRemove(false), 2600);
    return () => clearTimeout(t);
  }, [confirmRemove]);

  async function run(fn, msg) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast(msg);
      onChange && onChange();
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setBusy(false);
      setConfirmRemove(false);
    }
  }

  const first = u.name.split(" ")[0];

  if (u.relation === "none")
    return (
      <button onClick={() => run(() => api.sendRequest(token, u.id), `Request sent to ${first}`)} disabled={busy} className="btn btn-primary px-3.5 py-1.5 text-[13px]">
        {busy ? <Spinner size={13} light /> : <IcPlus size={13} />} Add
      </button>
    );

  if (u.relation === "outgoing")
    return (
      <button onClick={() => run(() => api.cancelRequest(token, u.id), "Request cancelled")} disabled={busy} title="Click to cancel request" className="btn btn-ghost px-3.5 py-1.5 text-[13px]">
        {busy ? <Spinner size={13} /> : <IcCheck size={13} />} Requested
      </button>
    );

  if (u.relation === "incoming")
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={() => run(() => api.acceptRequest(token, u.id), `You and ${first} are now friends`)} disabled={busy} className="btn btn-primary px-3.5 py-1.5 text-[13px]">
          {busy ? <Spinner size={13} light /> : <IcCheck size={13} />} Accept
        </button>
        <button onClick={() => run(() => api.declineRequest(token, u.id), "Request declined")} disabled={busy} title="Decline" className="btn btn-danger-ghost h-[34px] w-[34px] rounded-full p-0">
          <IcX size={14} />
        </button>
      </div>
    );

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => openChat(u.id)} className="btn btn-ghost px-3.5 py-1.5 text-[13px]">
        <IcChat size={14} /> {compact ? "" : "Message"}
      </button>
      {confirmRemove ? (
        <button onClick={() => run(() => api.removeFriend(token, u.id), `Removed ${first} from friends`)} disabled={busy} className="btn btn-danger-ghost px-2.5 py-1.5 text-[12px]">
          Sure?
        </button>
      ) : (
        <button onClick={() => setConfirmRemove(true)} title="Unfriend" className="btn btn-ghost h-[34px] w-[34px] rounded-full p-0 text-ink-soft hover:border-coral hover:text-coral-deep">
          <IcX size={14} />
        </button>
      )}
    </div>
  );
}

function UserRow({ u, token, toast, onChange, openChat, now }) {
  return (
    <div className="lift flex items-center gap-3.5 rounded-xl border border-parch bg-white p-4">
      <Avatar name={u.name} color={u.color} size={44} online={u.online} />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="truncate text-[15px] font-bold">{u.name}</span>
          {u.online && <span className="text-[11px] font-semibold text-moss-soft">online</span>}
        </p>
        <p className="truncate text-[13px] text-ink-soft">{u.bio || "No bio yet"}</p>
      </div>
      <RelationActions u={u} token={token} toast={toast} onChange={onChange} openChat={openChat} />
    </div>
  );
}

function PeopleView({ token, me, toast, now, openChat }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [friends, setFriends] = useState(null);
  const [reqs, setReqs] = useState(null);
  const [discover, setDiscover] = useState(null);

  const loadAll = useCallback(() => {
    api.getFriends(token).then(setFriends).catch(() => {});
    api.getRequests(token).then(setReqs).catch(() => {});
    api.searchUsers(token, "").then((us) => setDiscover(us.filter((u) => u.relation === "none"))).catch(() => {});
  }, [token]);

  useEffect(() => {
    loadAll();
    return subscribe("friends", loadAll);
  }, [loadAll]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setResults(null);
    const t = setTimeout(() => {
      api.searchUsers(token, query).then(setResults).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query, token]);

  const loading = friends === null || reqs === null || discover === null;
  const searching = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="eyebrow">Your circle</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          People<span className="text-coral">.</span>
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">Answer requests, keep up with friends, meet someone new.</p>
      </header>

      <div className="mb-7">
        <input
          className="field py-3 text-[15px] shadow-[0_10px_30px_-24px_rgba(23,63,44,0.4)]"
          placeholder="Search people by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {searching ? (
        <section>
          <p className="eyebrow mb-3">Results {results ? `· ${results.length}` : ""}</p>
          {results === null ? (
            <Skeleton className="h-[76px]" />
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-moss/30 bg-white/70 p-8 text-center">
              <p className="font-display text-xl font-semibold text-pine">No one matches "{query.trim()}"</p>
              <p className="mt-1 text-[13.5px] text-ink-soft">Try a shorter name, or an email address.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((u) => (
                <Reveal key={u.id}><UserRow u={u} token={token} toast={toast} onChange={loadAll} openChat={openChat} now={now} /></Reveal>
              ))}
            </div>
          )}
        </section>
      ) : loading ? (
        <div className="space-y-3"><Skeleton className="h-[76px]" /><Skeleton className="h-[76px]" /><Skeleton className="h-[76px]" /></div>
      ) : (
        <div className="space-y-8">
          {reqs.incoming.length > 0 && (
            <section>
              <p className="eyebrow mb-3">Requests · {reqs.incoming.length} waiting</p>
              <div className="space-y-3">
                {reqs.incoming.map((u) => (
                  <Reveal key={u.id}><UserRow u={u} token={token} toast={toast} onChange={loadAll} openChat={openChat} now={now} /></Reveal>
                ))}
              </div>
            </section>
          )}

          {reqs.outgoing.length > 0 && (
            <section>
              <p className="eyebrow mb-3">Sent requests</p>
              <div className="space-y-3">
                {reqs.outgoing.map((u) => (
                  <Reveal key={u.id}><UserRow u={u} token={token} toast={toast} onChange={loadAll} openChat={openChat} now={now} /></Reveal>
                ))}
              </div>
            </section>
          )}

          <section>
            <p className="eyebrow mb-3">Your friends · {friends.length}</p>
            {friends.length === 0 ? (
              <div className="rounded-xl border border-dashed border-moss/30 bg-white/70 p-8 text-center">
                <p className="font-display text-xl font-semibold text-pine">No friends yet</p>
                <p className="mt-1 text-[13.5px] text-ink-soft">Search above, or add someone from Discover below.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {friends.map((u, i) => (
                  <Reveal key={u.id} delay={Math.min(i, 4) * 40}>
                    <UserRow u={u} token={token} toast={toast} onChange={loadAll} openChat={openChat} now={now} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          {discover.length > 0 && (
            <section>
              <p className="eyebrow mb-3">Discover</p>
              <div className="space-y-3">
                {discover.map((u) => (
                  <Reveal key={u.id}><UserRow u={u} token={token} toast={toast} onChange={loadAll} openChat={openChat} now={now} /></Reveal>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- messages ------------------------------- */

function TypingDots() {
  return (
    <span className="flex items-center gap-1 px-1 py-0.5">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-soft" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-soft" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-soft" />
    </span>
  );
}

function ChatPane({ conv, token, me, toast, onBack, now }) {
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const firstLoad = useRef(true);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const pending = useRef(new Map()); // tempId -> true (optimistic sends awaiting the wire)
  const other = conv.user;

  useEffect(() => {
    let alive = true;
    api.getMessages(token, conv.id)
      .then((ms) => alive && setMsgs(ms))
      .catch((e) => toast(e.message, "err"));
    api.markRead(token, conv.id);
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  useEffect(() => {
    const offMsg = subscribe("message", ({ conversationId, message }) => {
      if (conversationId !== conv.id) return;
      setMsgs((prev) => {
        if (!prev) return [message];
        // Check if we already have this exact message (by id)
        if (prev.some((m) => m.id === message.id)) return prev;
        // own message arriving back from the wire — swap it with the optimistic temp bubble
        if (message.senderId === me.id) {
          const tempId = [...pending.current.keys()].find((t) => prev.some((m) => m.id === t));
          if (tempId) {
            pending.current.delete(tempId);
            return prev.map((m) => (m.id === tempId ? message : m));
          }
          // If no pending temp but we already have a message with same content from ourselves, skip
          if (prev.some((m) => m.senderId === me.id && m.text === message.text && Math.abs(m.createdAt - message.createdAt) < 1000)) {
            return prev;
          }
        }
        return [...prev, message];
      });
      api.markRead(token, conv.id);
    });
    const offTyp = subscribe("typing", ({ conversationId, userId }) => {
      if (conversationId !== conv.id || userId === me.id) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 1700);
    });
    return () => { offMsg(); offTyp(); clearTimeout(typingTimer.current); };
  }, [conv.id, me.id, token]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = firstLoad.current ? el.scrollHeight : el.scrollHeight;
    firstLoad.current = false;
  }, [msgs, typing]);

  function onText(v) {
    setText(v);
    const t = Date.now();
    if (t - lastTypingSent.current > 1300) {
      lastTypingSent.current = t;
      api.emitTyping(token, conv.id).catch(() => {});
    }
  }

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimistic = { id: tempId, conversationId: conv.id, senderId: me.id, text: body, createdAt: Date.now() };
    pending.current.set(tempId, true);
    setMsgs((prev) => [...(prev || []), optimistic]);
    setText("");
    try {
      const real = await api.sendMessage(token, conv.id, body);
      pending.current.delete(tempId);
      setMsgs((prev) => (prev ? prev.map((m) => (m.id === tempId ? real : m)) : prev));
    } catch (ex) {
      pending.current.delete(tempId);
      setMsgs((prev) => (prev ? prev.filter((m) => m.id !== tempId) : prev));
      setText(body);
      toast(ex.message, "err");
    } finally {
      setBusy(false);
    }
  }

  const rows = [];
  (msgs || []).forEach((m, i) => {
    const prev = msgs[i - 1];
    const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
    if (newDay) rows.push({ type: "day", key: `d_${m.id}`, label: dayLabel(m.createdAt) });
    const sameSender = prev && prev.senderId === m.senderId && !newDay;
    rows.push({ type: "msg", key: m.id, m, mine: m.senderId === me.id, tight: !!sameSender });
  });

  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-parch bg-white px-4 py-3">
        <button onClick={onBack} className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-cream hover:text-pine md:hidden">
          <IcBack size={18} />
        </button>
        <Avatar name={other?.name} color={other?.color} size={38} online={other?.online} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-bold">{other?.name}</p>
          <p className={`text-[12px] font-medium ${typing ? "text-coral-deep" : other?.online ? "text-moss-soft" : "text-ink-soft"}`}>
            {typing ? "typing…" : other?.online ? "Online" : "Away"}
          </p>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="slim-scroll min-h-0 flex-1 space-y-1 overflow-y-auto bg-cream/60 px-4 py-4">
        {msgs === null && (
          <div className="space-y-2 pt-4">
            <Skeleton className="ml-auto h-10 w-48 rounded-2xl" />
            <Skeleton className="h-10 w-40 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-36 rounded-2xl" />
          </div>
        )}
        {msgs && msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Avatar name={other?.name} color={other?.color} size={56} online={other?.online} />
            <p className="mt-3 font-display text-xl font-semibold text-pine">Say hi to {other?.name.split(" ")[0]}</p>
            <p className="mt-1 max-w-[240px] text-[13px] text-ink-soft">This is the very beginning of your conversation. Messages are delivered in real time.</p>
          </div>
        )}
        {rows.map((r) =>
          r.type === "day" ? (
            <div key={r.key} className="flex items-center justify-center py-3">
              <span className="rounded-full bg-parch px-3 py-1 text-[11px] font-bold tracking-wide text-ink-soft">{r.label}</span>
            </div>
          ) : (
            <div key={r.key} className={`bubble-in flex ${r.mine ? "justify-end" : "justify-start"} ${r.tight ? "mt-0.5" : "mt-2.5"}`}>
              <div className={`max-w-[80%] px-3.5 py-2 sm:max-w-[70%] ${r.mine ? "bubble-me bg-pine text-cream" : "bubble-them border border-parch bg-white text-ink"}`}>
                <p className="text-[14.5px] leading-snug break-words whitespace-pre-wrap">{r.m.text}</p>
                <p className={`mt-0.5 text-right text-[10px] ${r.mine ? "text-fern/80" : "text-ink-soft/70"}`}>{clockTime(r.m.createdAt)}</p>
              </div>
            </div>
          )
        )}
        {typing && (
          <div className="bubble-in mt-2.5 flex justify-start">
            <div className="bubble-them border border-parch bg-white px-3.5 py-2.5">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* input */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-parch bg-white p-3">
        <input
          className="field flex-1"
          placeholder={`Message ${other?.name.split(" ")[0]}…`}
          value={text}
          maxLength={500}
          onChange={(e) => onText(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!text.trim() || busy} className="btn btn-primary h-10 w-10 shrink-0 rounded-full p-0" title="Send">
          {busy ? <Spinner size={15} light /> : <IcSend size={16} />}
        </button>
      </form>
    </div>
  );
}

function MessagesView({ token, me, toast, now, target }) {
  const [convs, setConvs] = useState(null);
  const [active, setActive] = useState(target);

  const load = useCallback(() => {
    api.getConversations(token).then(setConvs).catch((e) => toast(e.message, "err"));
  }, [token, toast]);

  useEffect(() => {
    load();
    const a = subscribe("message", load);
    const b = subscribe("read", load);
    return () => { a(); b(); };
  }, [load]);

  useEffect(() => {
    if (target) setActive(target);
  }, [target]);

  const activeConv = (convs || []).find((c) => c.id === active) || null;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5 hidden md:block">
        <p className="eyebrow">Real-time</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Messages<span className="text-coral">.</span>
        </h1>
      </header>

      <div className="grid h-[calc(100dvh-11.5rem)] overflow-hidden rounded-xl border border-parch bg-white shadow-[0_20px_50px_-30px_rgba(23,63,44,0.4)] md:h-[calc(100dvh-9.5rem)] md:grid-cols-[300px_minmax(0,1fr)]">
        {/* conversation list */}
        <div className={`min-h-0 flex-col border-parch md:flex md:border-r ${active ? "hidden" : "flex"}`}>
          <div className="flex items-baseline justify-between border-b border-parch px-4 py-3.5">
            <p className="font-display text-lg font-semibold text-pine">Chats</p>
            <span className="text-[11.5px] font-semibold text-ink-soft">{convs ? `${convs.length}` : "…"}</span>
          </div>
          <div className="slim-scroll min-h-0 flex-1 overflow-y-auto">
            {convs === null && <div className="space-y-2 p-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
            {convs && convs.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] text-ink-soft">No conversations yet. Message a friend from the People page.</p>
            )}
            {(convs || []).map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active === c.id ? "bg-cream" : "hover:bg-cream/60"}`}
              >
                <Avatar name={c.user?.name} color={c.user?.color} size={42} online={c.user?.online} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-[14px] ${c.unread ? "font-extrabold" : "font-semibold"}`}>{c.user?.name}</span>
                    {c.lastMessage && <span className="shrink-0 text-[10.5px] font-medium text-ink-soft">{timeAgo(c.lastMessage.createdAt, now)}</span>}
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className={`truncate text-[12.5px] ${c.unread ? "font-semibold text-ink" : "text-ink-soft"}`}>
                      {c.lastMessage ? `${c.lastMessage.senderId === me.id ? "You: " : ""}${c.lastMessage.text}` : "Start the conversation"}
                    </span>
                    {c.unread > 0 && <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-[#fff5f0]">{c.unread}</span>}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* chat pane */}
        {activeConv ? (
          <ChatPane key={activeConv.id} conv={activeConv} token={token} me={me} toast={toast} onBack={() => setActive(null)} now={now} />
        ) : (
          <div className="relative hidden flex-col items-center justify-center bg-cream/50 p-8 text-center md:flex">
            <span className="wordmark text-[110px] leading-none text-parch select-none">j.</span>
            <p className="mt-2 font-display text-2xl font-semibold text-pine">Pick a conversation</p>
            <p className="mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-ink-soft">
              Messages sync live over the wire — open a second tab as another user and watch them land instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- profile ------------------------------- */

function ProfileView({ token, me, setUser, toast, now, openChat }) {
  const [posts, setPosts] = useState(null);
  const [friends, setFriends] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(me.bio || "");
  const [name, setName] = useState(me.name);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.getFeed(token).then(setPosts).catch(() => {});
    api.getFriends(token).then(setFriends).catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
    const a = subscribe("feed", load);
    const b = subscribe("friends", load);
    return () => { a(); b(); };
  }, [load]);

  const myPosts = useMemo(() => (posts || []).filter((p) => p.author && p.author.id === me.id), [posts, me.id]);
  const likesReceived = myPosts.reduce((n, p) => n + p.likes, 0);

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await api.updateProfile(token, { name, bio });
      setUser(updated);
      setEditing(false);
      toast("Profile updated");
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* header card */}
      <div className="overflow-hidden rounded-xl border border-parch bg-white shadow-[0_20px_50px_-30px_rgba(23,63,44,0.4)]">
        <div className="grain relative h-32 bg-pine sm:h-36">
          <svg className="absolute top-0 right-0 h-full opacity-40" viewBox="0 0 300 150" aria-hidden="true">
            <circle cx="240" cy="75" r="52" fill="none" stroke="rgba(245,241,233,.28)" strokeWidth="1" strokeDasharray="3 7" />
            <circle cx="240" cy="75" r="88" fill="none" stroke="rgba(214,107,75,.4)" strokeWidth="1" strokeDasharray="2 9" />
            <circle cx="188" cy="75" r="4" fill="#d66b4b" />
          </svg>
          <span className="watermark absolute -bottom-8 left-4 text-[150px]">j</span>
        </div>
        <div className="px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar name={me.name} color={me.color} size={88} online className="rounded-full ring-4 ring-white" />
            <button onClick={() => { setName(me.name); setBio(me.bio || ""); setEditing((e) => !e); }} className={`btn mb-1 px-4 py-1.5 text-[13px] ${editing ? "btn-ghost" : "btn-primary"}`}>
              <IcEdit size={14} /> {editing ? "Cancel" : "Edit profile"}
            </button>
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {me.name}<span className="text-coral">.</span>
          </h1>
          <p className="mt-0.5 text-[13.5px] text-ink-soft">{me.email} · joined {joinedLabel(me.joined)}</p>

          <div className="mt-4 flex divide-x divide-parch">
            {[
              { n: myPosts.length, l: "Posts" },
              { n: friends ? friends.length : "–", l: "Friends" },
              { n: likesReceived, l: "Likes received" },
            ].map((s) => (
              <div key={s.l} className="px-5 first:pl-0">
                <p className="font-display text-2xl font-semibold text-pine tabular-nums">{s.n}</p>
                <p className="eyebrow mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* bio */}
      <div className="rounded-xl border border-parch bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">About</p>
          {!editing && <span className="text-[11.5px] text-ink-soft/70">{(me.bio || "").length}/160</span>}
        </div>
        {editing ? (
          <div className="mt-3 space-y-3">
            <div>
              <label className="eyebrow mb-1.5 block">Name</label>
              <input className="field" value={name} maxLength={48} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="eyebrow mb-1.5 block">Bio</label>
              <textarea className="field resize-none" rows={3} maxLength={160} placeholder="Tell your orbit who you are…" value={bio} onChange={(e) => setBio(e.target.value)} />
              <p className={`mt-1 text-right text-[11.5px] font-semibold tabular-nums ${bio.length >= 160 ? "text-coral-deep" : "text-ink-soft/70"}`}>{bio.length}/160</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="btn btn-ghost px-4 py-2 text-sm">Cancel</button>
              <button onClick={save} disabled={busy || !name.trim()} className="btn btn-primary px-5 py-2 text-sm">
                {busy ? <Spinner size={14} light /> : <IcCheck size={14} />} Save
              </button>
            </div>
          </div>
        ) : (
          <p className={`mt-2.5 text-[15px] leading-relaxed ${me.bio ? "" : "text-ink-soft italic"}`}>
            {me.bio || "No bio yet — hit Edit profile and tell people who you are."}
          </p>
        )}
      </div>

      {/* my posts */}
      <div>
        <p className="eyebrow mb-3">Your posts {posts ? `· ${myPosts.length}` : ""}</p>
        <div className="space-y-4">
          {posts === null && <div className="rounded-xl border border-parch bg-white p-5"><Skeleton className="h-16" /></div>}
          {posts && myPosts.length === 0 && (
            <div className="rounded-xl border border-dashed border-moss/30 bg-white/70 p-8 text-center">
              <p className="font-display text-xl font-semibold text-pine">Nothing posted yet</p>
              <p className="mt-1 text-[13.5px] text-ink-soft">Your posts will show up here — go say something on the feed.</p>
            </div>
          )}
          {myPosts.map((p) => (
            <PostCard key={p.id} post={p} me={me} token={token} now={now} toast={toast} openChat={openChat} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- app ---------------------------------- */

function Splash() {
  return (
    <div className="app-bg flex min-h-screen flex-col items-center justify-center">
      <Wordmark size="text-8xl" className="anim-rise" />
      <div className="anim-fade mt-5 flex items-center gap-2.5 text-[13.5px] font-medium text-ink-soft" style={{ animationDelay: "0.2s" }}>
        <Spinner size={15} /> warming up your orbit…
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => storage.get("jupiter-token"));
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => !!storage.get("jupiter-token"));
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, kind = "ok") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }
    let alive = true;
    api.me(token)
      .then((u) => alive && setUser(u))
      .catch((e) => {
        storage.del("jupiter-token");
        setToken(null);
        setUser(null);
        if (alive && e.status === 401) toast(e.message, "err");
      })
      .finally(() => alive && setBooting(false));
    return () => { alive = false; };
  }, [token, toast]);

  function onAuth(t, u) {
    storage.set("jupiter-token", t);
    setToken(t);
    setUser(u);
  }

  function onLogout() {
    storage.del("jupiter-token");
    setToken(null);
    setUser(null);
    toast("Logged out — see you in orbit");
  }

  return (
    <ErrorBoundary>
      {booting ? <Splash /> : !token || !user ? <Auth onAuth={onAuth} toast={toast} /> : (
        <Shell token={token} user={user} setUser={setUser} onLogout={onLogout} toast={toast} />
      )}
      <ToastStack toasts={toasts} />
    </ErrorBoundary>
  );
}
