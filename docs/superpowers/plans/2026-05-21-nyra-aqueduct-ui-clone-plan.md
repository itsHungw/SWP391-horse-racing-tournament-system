# Clone UI NYRA Aqueduct Racetrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế mã nguồn hiện tại của file `HomePage.tsx` để hiển thị giao diện clone tĩnh giống 100% trang chủ NYRA Aqueduct Racetrack với phong cách premium.

**Architecture:** Sử dụng trực tiếp React, Tailwind CSS v4, và mã nguồn SVG vẽ lại tất cả các logo thương hiệu (Belmont at the Big A, NYRA Bets, NYRA Shield, Fox Sports). Ảnh nền và tin tức được nhúng từ các liên kết chính thức.

**Tech Stack:** React, Tailwind CSS v4, TypeScript.

---

### Task 1: Dựng cấu trúc và triển khai code Clone 100% cho HomePage.tsx

**Files:**
- Modify: `frontend/src/pages/public/HomePage.tsx`

- [ ] **Step 1: Thay thế toàn bộ nội dung file HomePage.tsx với mã nguồn clone hoàn chỉnh.**

```tsx
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function HomePage() {
  useDocumentTitle("Aqueduct Racetrack | Thoroughbred Horse Racing in NYC");

  return (
    <div className="bg-white font-sans text-gray-900 selection:bg-nyraGold selection:text-nyraDark">
      {/* 1. TOP HEADER */}
      <header
        aria-label="Horse Racing Tournament"
        className="bg-black text-[10px] font-bold uppercase tracking-widest text-white h-11"
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <nav className="flex h-full items-center space-x-6" data-purpose="site-navigation">
            {/* Belmont at the Big A Logo */}
            <a className="flex items-center" href="#" aria-label="Belmont at the Big A">
              <svg className="h-6 w-auto" viewBox="0 0 180 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4h12v4H16v6h6v4h-6v6h8v4H12V4zM28 4h4v20h8v4H28V4zM42 4h4l4 12 4-12h4v24h-4V10l-4 12h-2l-4-12v18h-4V4zM66 4c5 0 9 4 9 9s-4 9-9 9h-4v6h-4V4h8zm0 14c3 0 5-2 5-5s-2-5-5-5h-4v10h4zM86 4c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10zm0 16c3 0 6-2 6-6s-3-6-6-6-6 2-6 6 3 6 6 6zM102 4l8 12V4h4v24h-4l-8-12v12h-4V4h4zM122 8h-6V4h16v4h-6v20h-4V8z" fill="currentColor"/>
                <path d="M148 4l-4 12-4-12h-4l6 18v6h4v-6l6-18h-4zM158 4h8v4h-8v6h6v4h-6v6h8v4h-12V4z" fill="currentColor"/>
              </svg>
            </a>
            <div className="flex h-full items-center">
              <a className="bg-nyraLightGreen px-4 py-3 h-full flex items-center font-black text-white" href="#">
                Aqueduct
              </a>
              <a className="px-4 py-3 h-full flex items-center text-gray-400 hover:text-white transition-colors" href="#">
                Belmont Park
              </a>
              <a className="px-4 py-3 h-full flex items-center text-gray-400 hover:text-white transition-colors" href="#">
                Saratoga
              </a>
              <a className="px-4 py-3 h-full flex items-center text-gray-400 hover:text-white transition-colors" href="#">
                Belmont Stakes
              </a>
            </div>
          </nav>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              {/* NYRA BETS Logo */}
              <span className="text-sm font-black italic tracking-tighter text-white">
                NYRA <span className="text-nyraGold">BETS</span>
              </span>
              <a className="font-extrabold text-lime-400 hover:text-lime-300 transition-colors" href="#">
                BET NOW
              </a>
            </div>
            <span className="text-gray-600">|</span>
            <a className="text-gray-300 hover:text-white transition-colors" href="#">
              Log In
            </a>
          </div>
        </div>
      </header>

      {/* 2. STICKY MAIN NAVIGATION */}
      <nav
        aria-label="Primary"
        className="sticky top-0 z-50 bg-nyraGreen text-white shadow-md border-t border-white/5"
        data-purpose="main-nav"
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center space-x-8 text-sm font-bold">
              <span className="text-white font-medium">Racing returns May 22</span>
              <div className="hidden space-x-6 uppercase tracking-wider md:flex">
                <a className="hover:text-gray-300 transition-colors relative py-4 group" href="#">
                  Racing
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </a>
                <a className="hover:text-gray-300 transition-colors relative py-4 group" href="#">
                  Wagering
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </a>
                <a className="hover:text-gray-300 transition-colors relative py-4 group" href="#">
                  Expert Picks
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </a>
                <a className="hover:text-gray-300 transition-colors relative py-4 group" href="#">
                  News
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </a>
                <a className="hover:text-gray-300 transition-colors relative py-4 group" href="#">
                  Visit
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </a>
                <a className="hover:text-gray-300 transition-colors relative py-4 group" href="#">
                  Official Store
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </a>
              </div>
            </div>
            {/* Social media icons */}
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="X (Twitter)">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="TikTok">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.62 4.17.96 1.09 2.3 1.8 3.75 2.01v3.9c-1.5-.02-2.94-.48-4.16-1.36-.26-.2-.5-.42-.72-.66v6.24a7.71 7.71 0 01-2.95 6.07 8.01 8.01 0 01-10.22-.64A7.77 7.77 0 013 14.37a7.79 7.79 0 016.03-7.58c.95-.19 1.93-.19 2.87.01V11c-.81-.23-1.69-.14-2.43.27A3.86 3.86 0 007.49 14.4c.05 1.5 1.02 2.84 2.48 3.19A3.84 3.84 0 0014.28 15V.02z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="YouTube">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. HERO CAROUSEL SECTION */}
      <section className="relative h-[550px] overflow-hidden bg-nyraDark" data-purpose="hero-carousel">
        {/* Background Image */}
        <img
          alt="Horses racing at Aqueduct Racetrack"
          className="absolute inset-0 h-full w-full object-cover opacity-95 object-center"
          src="https://www.nyra.com/assets/images/header-aqu-bg.jpg"
        />
        {/* Left Gradient Overlay */}
        <div className="hero-gradient absolute inset-0" />
        
        <div className="mx-auto max-w-7xl relative h-full flex items-center px-4">
          <div className="max-w-2xl text-white">
            <h1 className="text-shadow mb-3 text-[56px] font-black uppercase tracking-tighter leading-none">
              Aqueduct Racetrack
            </h1>
            <p className="text-shadow mb-8 text-xl font-light text-gray-100">
              Live racing weekly at Aqueduct through June 2026.
            </p>
            <div className="flex items-center space-x-6">
              <a
                className="rounded-sm bg-nyraLightGreen px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-nyraGreen shadow-md"
                href="#"
              >
                View Calendar
              </a>
              <a
                className="flex items-center border-b-2 border-transparent py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:border-white"
                href="#"
              >
                VIEW STAKES <span className="ml-2 font-mono">→</span>
              </a>
            </div>
          </div>

          {/* Farewell Banner Overlay (Right) */}
          <div className="absolute bottom-24 right-4 hidden w-[360px] border-l-4 border-nyraLightGreen bg-black/65 p-4 backdrop-blur-sm lg:block">
            <div className="relative aspect-video w-full overflow-hidden mb-3">
              <img 
                alt="Farewell Aqueduct Event" 
                className="h-full w-full object-cover" 
                src="https://www.nyra.com/assets/images/header-bel-bg.jpg"
              />
              <div className="absolute top-2 left-2 bg-nyraLightGreen text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider text-white">
                Event
              </div>
            </div>
            <div className="text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white">
                It was a good run
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-lime-400 font-bold">
                Farewell Aqueduct | June 27 & 28
              </p>
              <p className="mt-2 text-xs text-gray-300">
                Giveaways, Souvenirs, Live Entertainment and more
              </p>
            </div>
          </div>
        </div>

        {/* Hero Footer Bar */}
        <div className="absolute bottom-0 w-full border-t border-white/10 bg-black/85 py-5 text-white">
          <div className="mx-auto max-w-7xl grid grid-cols-3 divide-x divide-white/10 px-4 text-center text-xs relative">
            <div className="relative group cursor-pointer">
              {/* Active Indicator Arrow */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-black/85"></div>
              <h4 className="font-black uppercase tracking-wider text-white">Live Racing in NYC</h4>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                Through June 2026
              </p>
            </div>
            <div className="cursor-pointer group">
              <h4 className="font-bold uppercase tracking-wider text-gray-300 group-hover:text-white transition-colors">Visit Aqueduct</h4>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                Free Admission
              </p>
            </div>
            <div className="cursor-pointer group">
              <h4 className="font-bold uppercase tracking-wider text-gray-300 group-hover:text-white transition-colors">Watch on FOX Sports</h4>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                America's Day at the Races
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. QUICK LINKS ROW */}
      <section className="bg-nyraGreen py-7 border-t border-white/5" data-purpose="quick-links">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-3 gap-6 text-center text-white md:grid-cols-6">
            {[
              ["Entries", "M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z"],
              ["Results", "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"],
              ["Scratches & Changes", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"],
              ["Stream Live", "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"],
              ["Expert Picks", "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"],
              ["Horsemen", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"],
            ].map(([label, path]) => (
              <a className="group flex flex-col items-center cursor-pointer" href="#" key={label}>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/10 group-hover:bg-black/25 group-hover:-translate-y-0.5 transition duration-300">
                  <svg className="h-6 w-6 text-lime-400 group-hover:text-white transition duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d={path} />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-200 group-hover:text-white transition-colors duration-300">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LATEST NEWS SECTION */}
      <section className="bg-white py-16" data-purpose="latest-news">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex items-end justify-between border-b border-gray-100 pb-5">
            <h2 className="text-3xl font-black uppercase tracking-tight text-nyraGreen">
              Latest Aqueduct News
            </h2>
            <a
              className="flex items-center text-xs font-bold uppercase tracking-widest text-nyraGreen hover:text-nyraLightGreen hover:underline transition-colors"
              href="#"
            >
              More NYRA News <span className="ml-2 font-mono">→</span>
            </a>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                category: "Stakes Advance",
                title: "Intricate Spirit returns to familiar site in $150K Paradise Creek",
                author: "Christian Abdo",
                date: "May 19, 2026",
                image: "https://www.nyra.com/assets/images/header-sara-bg.jpg"
              },
              {
                category: "Notes",
                title: "HOTY Sovereignty leads busy Saturday work tab at Saratoga",
                author: "NYRA Communications",
                date: "May 16, 2026",
                image: "https://www.nyra.com/assets/images/header-aqu-bg.jpg"
              },
              {
                category: "Headlines",
                title: "Pick 6 carryover of $14K on Saturday at Belmont at the Big A",
                author: "Robert Hines",
                date: "May 15, 2026",
                image: "https://www.nyra.com/assets/images/header-bel-bg.jpg"
              }
            ].map((article) => (
              <article className="group cursor-pointer flex flex-col h-full bg-gray-50 border border-gray-100 rounded-sm overflow-hidden hover:shadow-lg transition duration-300" key={article.title}>
                <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                  <img
                    alt={article.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    src={article.image}
                  />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] font-black uppercase tracking-widest text-nyraLightGreen">
                    {article.category}
                  </span>
                  <h3 className="mt-2 text-lg font-bold leading-snug text-nyraDark group-hover:text-nyraLightGreen transition-colors flex-grow">
                    {article.title}
                  </h3>
                  <div className="mt-5 border-t border-gray-200/60 pt-3 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span>{article.author}</span> <span className="mx-2 text-gray-300">•</span> <span>{article.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PREAKNESS PREVIEW (VIDEO SECTION) */}
      <section className="bg-nyraDark py-16 text-white border-t border-b border-white/5" data-purpose="preakness-preview">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center md:flex-row">
          <div className="mb-10 md:mb-0 md:w-1/2 md:pr-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">Featured Video</span>
            <h2 className="mb-4 mt-1 text-4xl font-black uppercase tracking-tight leading-tight">
              2026 Preakness Preview
            </h2>
            <p className="mb-8 text-base leading-relaxed text-gray-400">
              Expert handicappers from NYRA Bets provide full analysis, betting strategies, and top picks for the upcoming Saturday's Preakness Stakes.
            </p>
            <a
              className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-lime-400 hover:text-lime-300 hover:underline transition-colors"
              href="#"
            >
              GET PREAKNESS BONUS <span className="ml-2 font-mono">→</span>
            </a>
          </div>
          
          <div className="group relative w-full aspect-video md:w-1/2 overflow-hidden rounded border border-white/10 shadow-2xl cursor-pointer">
            <img 
              alt="Preakness Video Preview Thumbnail" 
              className="w-full h-full object-cover transition duration-500 group-hover:scale-102" 
              src="https://www.nyra.com/assets/images/header-sara-bg.jpg" 
            />
            {/* Video overlay decoration */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="absolute top-4 left-4 flex items-center space-x-3 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">NYRA Bets Studio</span>
            </div>
            
            {/* YouTube Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-red-700">
                <svg className="h-8 w-8 fill-current text-white ml-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. NYRA BETS PROMO SECTION */}
      <section className="bg-black py-20 text-white relative overflow-hidden" data-purpose="nyra-bets-promo">
        {/* Subtle background horse track lines */}
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
            <path d="M0 0 L100 100 M20 0 L120 100 M-20 0 L80 100" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between relative z-10">
          {/* Logo & Headline */}
          <div className="lg:w-5/12 space-y-6 text-center lg:text-left mb-10 lg:mb-0">
            <div className="inline-block">
              <span className="text-3xl font-black italic tracking-tighter text-white">
                NYRA <span className="text-nyraGold">BETS</span>
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none text-white">
              BET ANY TRACK.<br />ANYWHERE.<br />ANY TIME.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              The best of horse racing from around the world. Make deposits quickly, watch your horses live in the paddock, and easily place your bet before watching your race in HD.
            </p>
          </div>

          {/* Jockey Center Image */}
          <div className="hidden lg:block lg:w-3/12 relative aspect-[3/4] max-h-[300px]">
            <img 
              alt="Professional Jockey Portrait" 
              className="h-full w-full object-contain filter grayscale contrast-110" 
              src="https://www.nyra.com/assets/images/jockey-bg.png" 
              onError={(e) => {
                // Fallback in case the png is missing
                (e.target as HTMLImageElement).src = "https://www.nyra.com/assets/images/header-bel-bg.jpg";
              }}
            />
          </div>

          {/* Promotion Card & Actions */}
          <div className="lg:w-4/12 w-full flex flex-col items-center lg:items-end">
            <div className="w-full max-w-[340px] bg-gradient-to-br from-nyraGreen to-nyraDark p-6 rounded-sm border border-white/10 shadow-xl mb-6">
              <span className="bg-lime-400 text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-wider rounded-sm">New Players</span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-3 leading-none">SIGN UP BONUS</h3>
              <p className="text-3xl font-extrabold text-lime-400 mt-1 leading-none">$25 Free Bet</p>
              <p className="text-xs text-gray-400 mt-4 leading-normal">
                Sign up today and get your first $25 bet completely free. No deposit code required.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 w-full max-w-[340px]">
              <a 
                href="#" 
                className="flex-1 text-center border border-white/30 hover:border-white text-xs font-bold uppercase tracking-widest py-3 transition-colors"
              >
                Expert Picks
              </a>
              <a 
                href="#" 
                className="flex-1 text-center bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase tracking-widest py-3 transition-colors shadow-md"
              >
                Bet Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-nyraDark text-gray-400 py-16 border-t border-white/5" data-purpose="main-footer">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-4 mb-16">
            <div>
              {/* NYRA Shield Logo */}
              <div className="mb-6 flex items-center space-x-3">
                <div className="h-10 w-10 bg-nyraGreen rounded-sm flex items-center justify-center border border-white/10">
                  <span className="text-white font-black text-xs tracking-tighter">NYRA</span>
                </div>
                <span className="text-white font-black uppercase tracking-widest text-xs">New York Racing</span>
              </div>
              <div className="space-y-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">
                {["Contact NYRA", "Live Chat", "Sponsor with NYRA", "About NYRA", "Careers"].map((label) => (
                  <a className="block hover:text-white transition-colors" href="#" key={label}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="col-span-2 hidden md:block" />
            
            <div className="flex flex-col items-end justify-start">
              {/* Fox Sports Logo */}
              <div className="flex items-center space-x-2 border border-white/10 px-4 py-2.5 bg-black/20 rounded">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Official Partner</span>
                <span className="text-white font-black italic tracking-tighter text-sm">FOX SPORTS</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-between space-y-6 border-t border-white/10 pt-10 text-[9px] font-bold uppercase tracking-widest text-gray-500 md:flex-row md:space-y-0">
            <div className="max-w-xl text-left normal-case font-medium leading-relaxed">
              Gambling Problems? The New York Racing Association encourages responsible wagering. If gambling is a problem for you or someone you care about, help is available 24 hours a day. Call toll-free 1-877-8-HOPE-NY.
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {["Accessibility", "Do Not Sell My Information", "Responsible Gambling", "Privacy", "Ethics", "Terms & Conditions"].map((label) => (
                <a className="hover:text-white transition-colors" href="#" key={label}>
                  {label}
                </a>
              ))}
            </div>
          </div>
          
          <div className="mt-8 text-center text-[10px] text-gray-600 font-semibold tracking-wider uppercase">
            © 2026 The New York Racing Association, Inc. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Chạy kiểm thử hoặc build frontend để xác nhận không lỗi biên dịch.**

Run: `npm run build` hoặc kiểm tra lỗi static analysis
Expected: Không có lỗi Typescript và build thành công.

- [ ] **Step 3: Commit các thay đổi.**

```bash
git add frontend/src/pages/public/HomePage.tsx
git commit -m "feat: clone 100% UI homepage nyra aqueduct"
```
