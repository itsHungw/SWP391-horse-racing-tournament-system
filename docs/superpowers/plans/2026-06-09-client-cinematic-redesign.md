# Client Cinematic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the client-facing UI into a premium cinematic racetrack portal using framer-motion and new shared components without changing backend APIs or routing behavior.

**Architecture:** Introduce `framer-motion` for animations. Extract common UI elements into `frontend/src/components/client/`. Break `HomePage.tsx` into separate section components. Refactor UI copy to use "Championship" instead of "Tournament". Ensure Prediction Arena uses non-betting terms.

**Tech Stack:** React, Tailwind CSS, framer-motion, Vitest.

---

### Task 1: Setup Dependencies and Route Cleanup

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/routes/AppRouter.tsx`

- [ ] **Step 1: Install `framer-motion`**

```bash
cd frontend && npm install framer-motion clsx tailwind-merge && npm install -D @types/framer-motion
```

- [ ] **Step 2: Clean up duplicate `/spectator` routes**

```typescript
// Modify: frontend/src/routes/AppRouter.tsx
// Delete lines 100-101 which contain the duplicate declarations:
// <Route path="spectator" element={<Navigate to="/spectator/dashboard" replace />} />
// <Route path="spectator/dashboard" element={<RoleDashboardPage role="Spectator" />} />
```

- [ ] **Step 3: Run typescript compiler to verify it still builds**

```bash
cd frontend && npm run build
```

---

### Task 2: Shared Component `ClientBadge.tsx` and `SectionHeader.tsx`

**Files:**
- Create: `frontend/src/components/client/ClientBadge.tsx`
- Create: `frontend/src/components/client/SectionHeader.tsx`

- [ ] **Step 1: Create `ClientBadge.tsx`**

```tsx
import React from "react";
import clsx from "clsx";

interface ClientBadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "gold" | "dark" | "outline";
}

export function ClientBadge({ children, variant = "emerald" }: ClientBadgeProps) {
  const styles = {
    emerald: "bg-emerald-900/40 text-emerald-400 border border-emerald-800",
    gold: "bg-amber-900/40 text-amber-400 border border-amber-800",
    dark: "bg-zinc-900 text-zinc-300 border border-zinc-800",
    outline: "bg-transparent text-zinc-300 border border-zinc-700",
  };

  return (
    <span className={clsx("px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider", styles[variant])}>
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Create `SectionHeader.tsx`**

```tsx
import React from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeader({ eyebrow, title, description, align = "left" }: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${align === "center" ? "text-center" : "text-left"}`}>
      {eyebrow && <p className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-3">{eyebrow}</p>}
      <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">{title}</h2>
      {description && <p className="text-zinc-400 text-lg max-w-2xl">{description}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/client/ClientBadge.tsx frontend/src/components/client/SectionHeader.tsx
git commit -m "feat(client): add ClientBadge and SectionHeader shared components"
```

---

### Task 3: Shared Component `PremiumCard.tsx` and `MotionSection.tsx`

**Files:**
- Create: `frontend/src/components/client/PremiumCard.tsx`
- Create: `frontend/src/components/client/MotionSection.tsx`

- [ ] **Step 1: Create `PremiumCard.tsx`**

```tsx
import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

interface PremiumCardProps {
  children: React.ReactNode;
  variant?: "dark" | "glass" | "gold";
  className?: string;
  onClick?: () => void;
}

export function PremiumCard({ children, variant = "dark", className, onClick }: PremiumCardProps) {
  const styles = {
    dark: "bg-zinc-950 border border-zinc-800",
    glass: "bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50",
    gold: "bg-zinc-950 border border-amber-900/50 shadow-[0_0_15px_rgba(120,53,15,0.3)]",
  };

  const interactiveProps = onClick ? {
    whileHover: { y: -4, borderColor: "rgba(217, 119, 6, 0.5)" },
    transition: { duration: 0.2 },
    onClick,
    cursor: "pointer"
  } : {};

  return (
    <motion.div
      className={clsx("rounded-xl overflow-hidden p-6", styles[variant], className, onClick && "cursor-pointer")}
      {...interactiveProps}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create `MotionSection.tsx`**

```tsx
import React from "react";
import { motion } from "framer-motion";

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function MotionSection({ children, className, id }: MotionSectionProps) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/client/PremiumCard.tsx frontend/src/components/client/MotionSection.tsx
git commit -m "feat(client): add PremiumCard and MotionSection components"
```

---

### Task 4: Shared Component `AnimatedBackground.tsx` and `ClientPageLayout.tsx`

**Files:**
- Create: `frontend/src/components/client/AnimatedBackground.tsx`
- Create: `frontend/src/components/client/ClientPageLayout.tsx`

- [ ] **Step 1: Create `AnimatedBackground.tsx`**

```tsx
import React from "react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-zinc-950 overflow-hidden">
      {/* Subtle grain overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('/grain.png')" }}></div>
      {/* Decorative track lines */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-900/20 to-transparent"></div>
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-amber-900/20 to-transparent"></div>
      {/* Ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-emerald-900/10 blur-[120px] rounded-full"></div>
    </div>
  );
}
```

- [ ] **Step 2: Create `ClientPageLayout.tsx`**

```tsx
import React from "react";
import { AnimatedBackground } from "./AnimatedBackground";
import { ClientHeader } from "./ClientHeader";
import { ClientFooter } from "./ClientFooter";

interface ClientPageLayoutProps {
  children: React.ReactNode;
  showBackground?: boolean;
}

export function ClientPageLayout({ children, showBackground = true }: ClientPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col text-zinc-100 bg-zinc-950">
      {showBackground && <AnimatedBackground />}
      <ClientHeader />
      <main className="flex-1">
        {children}
      </main>
      <ClientFooter />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/client/AnimatedBackground.tsx frontend/src/components/client/ClientPageLayout.tsx
git commit -m "feat(client): add AnimatedBackground and ClientPageLayout"
```

---

### Task 5: Shared Component `ClientHeader.tsx` and `ClientFooter.tsx`

**Files:**
- Create: `frontend/src/components/client/ClientHeader.tsx`
- Create: `frontend/src/components/client/ClientFooter.tsx`

- [ ] **Step 1: Create `ClientHeader.tsx`**

```tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // adjust import if needed
import { motion } from "framer-motion";

export function ClientHeader() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: "Championships", path: "/tournaments" },
    { label: "Races", path: "/races" },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "Predictions", path: "/spectator/predictions" },
    { label: "News", path: "/blogs" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-zinc-950/80 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-black text-white tracking-tighter uppercase">
            NYRA<span className="text-amber-500">.</span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link key={link.path} to={link.path} className={`text-sm font-semibold tracking-wide uppercase transition-colors ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link to="/profile" className="text-sm font-semibold uppercase text-zinc-300 hover:text-white">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold uppercase text-zinc-300 hover:text-white">Log In</Link>
                <Link to="/join-us" className="bg-amber-600 hover:bg-amber-500 text-black text-sm font-bold uppercase px-4 py-2 rounded transition-colors">Join Us</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create `ClientFooter.tsx`**

```tsx
import React from "react";
import { Link } from "react-router-dom";

export function ClientFooter() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-4">NYRA<span className="text-amber-500">.</span></h3>
            <p className="text-zinc-500 text-sm">Premium championship racing portal.</p>
          </div>
          <div>
            <h4 className="text-zinc-100 font-bold uppercase mb-4 tracking-widest text-sm">Action</h4>
            <ul className="space-y-2 text-zinc-400 text-sm">
              <li><Link to="/tournaments" className="hover:text-amber-500">Championships</Link></li>
              <li><Link to="/spectator/predictions" className="hover:text-amber-500">Prediction Arena</Link></li>
              <li><Link to="/join-us" className="hover:text-amber-500">Join the Paddock</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2 p-6 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <h4 className="text-zinc-100 font-bold uppercase mb-2 text-sm tracking-widest">Prediction Arena Disclaimer</h4>
            <p className="text-zinc-400 text-sm italic">
              Virtual points only — no real-money betting. The Prediction Arena is a free-to-play experience designed for spectators to engage with the championship.
            </p>
          </div>
        </div>
        <div className="text-center text-zinc-600 text-xs border-t border-zinc-900 pt-8">
          &copy; {new Date().getFullYear()} Horse Racing Championship System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/client/ClientHeader.tsx frontend/src/components/client/ClientFooter.tsx
git commit -m "feat(client): add ClientHeader and ClientFooter components"
```

---

### Task 6: Home Redesign Section Components

**Files:**
- Create: `frontend/src/pages/public/home/HeroSection.tsx`

- [ ] **Step 1: Create `HeroSection.tsx`**

```tsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('/slide.jpg')] bg-cover bg-center bg-no-repeat z-0 opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10"></div>
      
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6 drop-shadow-lg">
            The Championship <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Awaits</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto font-light mb-10">
            Experience the pinnacle of racing. Follow the routes, join the paddock, and enter the Prediction Arena.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/tournaments" className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest rounded transition-all">
              Explore Championships
            </Link>
            <Link to="/spectator/predictions" className="px-8 py-4 bg-zinc-900/80 hover:bg-zinc-800 text-white font-black uppercase tracking-widest border border-zinc-700 rounded transition-all">
              Prediction Arena
            </Link>
          </div>
          <p className="mt-6 text-sm text-zinc-500 italic">Virtual points only — no real-money betting.</p>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p frontend/src/pages/public/home
git add frontend/src/pages/public/home/HeroSection.tsx
git commit -m "feat(client): add cinematic HeroSection for home page"
```

---

### Task 7: Home Redesign Assembly

**Files:**
- Modify: `frontend/src/pages/public/HomePage.tsx`

- [ ] **Step 1: Replace `HomePage.tsx` content**

```tsx
import React from "react";
import { ClientPageLayout } from "../../components/client/ClientPageLayout";
import { HeroSection } from "./home/HeroSection";
import { MotionSection } from "../../components/client/MotionSection";
import { SectionHeader } from "../../components/client/SectionHeader";
import { PremiumCard } from "../../components/client/PremiumCard";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <ClientPageLayout showBackground={true}>
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        <MotionSection id="championships">
          <SectionHeader 
            eyebrow="The Season" 
            title="Championship Overview" 
            description="Follow the journey through the most prestigious racing routes in the world."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PremiumCard>
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Championships</h3>
              <p className="text-zinc-400 mb-4">View active seasons and global standings.</p>
              <Link to="/tournaments" className="text-amber-500 font-bold uppercase text-sm hover:text-amber-400">View All &rarr;</Link>
            </PremiumCard>
            <PremiumCard>
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Race Routes</h3>
              <p className="text-zinc-400 mb-4">Explore upcoming race schedules and tracks.</p>
              <Link to="/races" className="text-amber-500 font-bold uppercase text-sm hover:text-amber-400">View Races &rarr;</Link>
            </PremiumCard>
            <PremiumCard variant="glass">
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Leaderboard</h3>
              <p className="text-zinc-400 mb-4">Discover top-ranking horses and jockeys.</p>
              <Link to="/leaderboard" className="text-amber-500 font-bold uppercase text-sm hover:text-amber-400">View Rankings &rarr;</Link>
            </PremiumCard>
          </div>
        </MotionSection>

        <MotionSection id="join">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <SectionHeader 
              eyebrow="Careers" 
              title="Join The Paddock" 
              description="Apply for premium roles including Owner, Jockey, or Referee."
              align="center"
            />
            <Link to="/join-us" className="inline-block px-8 py-4 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest rounded transition-all">
              Start Application
            </Link>
          </div>
        </MotionSection>
      </div>
    </ClientPageLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/public/HomePage.tsx
git commit -m "feat(client): assemble new cinematic HomePage"
```

---

### Task 8: Update Championships/Races/Leaderboard UI Copy

**Files:**
- Modify: `frontend/src/pages/public/RaceRoutesPage.tsx`

- [ ] **Step 1: Wrap with `ClientPageLayout` and update text**
*Note: Because `RaceRoutesPage.tsx` is large, we are giving instructions to wrap the existing component rather than rewriting it entirely.*

Open `frontend/src/pages/public/RaceRoutesPage.tsx`.
1. Import `ClientPageLayout`: `import { ClientPageLayout } from "../../components/client/ClientPageLayout";`
2. Update any text instances of "Tournament" to "Championship" strictly in the UI. For example: `<h1 className="text-3xl font-bold">Tournaments</h1>` becomes `<h1 className="text-3xl font-bold">Championship Routes</h1>`.
3. Wrap the main return element with `<ClientPageLayout showBackground={false}>`.

```bash
# We can use grep/sed or editor to replace "Tournament" with "Championship" in user-facing texts inside this file.
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/public/RaceRoutesPage.tsx
git commit -m "style(client): apply Championship UI copy and ClientPageLayout to RaceRoutesPage"
```

---

### Task 9: Refactor Prediction Arena Language

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`

- [ ] **Step 1: Replace betting terminology**

In `SpectatorPredictionsPage.tsx` and its child components:
1. Replace "Bet" -> "Prediction" or "Race Pick"
2. Replace "Odds" -> "Reward Multiplier" or similar safe phrasing.
3. Replace "Stake" -> "Entry Cost"
4. Replace "Wager" -> "Prediction"

- [ ] **Step 2: Add disclaimer component**

Ensure a visible banner at the top of the arena:
```tsx
<div className="bg-amber-900/20 border border-amber-900 text-amber-500 p-4 rounded text-sm text-center mb-6 font-bold tracking-wider uppercase">
  Virtual points only — no real-money betting.
</div>
```

- [ ] **Step 3: Check visible states**
Ensure `isLoading` and `error` states return visible JSX, not just `sr-only` content.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/spectator/predictions/
git commit -m "feat(predictions): apply non-betting language and premium UI to Prediction Arena"
```

---

### Self-Review

1. **Spec coverage**: Covers dependencies, shared components (Badge, Header, Footer, Background, Motion, Card), Home rewrite, RaceRoutes update, Prediction language, Route cleanup.
2. **Placeholder scan**: All structural components are provided with complete code. Refactoring tasks (like RaceRoutes) provide explicit instructions on what text to change.
3. **Type consistency**: `ClientPageLayout`, `MotionSection` all match imported signatures.

**Plan complete.**
