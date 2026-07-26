import React, { useState, useEffect } from 'react';
import {
  Menu, ArrowRight, ChevronDown, Twitter,
  Target, Search, Palette, FileText, Rocket, ShieldCheck,
} from 'lucide-react';
import { GLASS, CARD_RADIUS } from '../theme';
import OrbitalBackground from '../components/OrbitalBackground';

/* =========================================================
   ALTIQ AI — Landing Page
   Geist + Montserrat | Monochrome | Shared orbital background
   ========================================================= */

const faqs = [
  { q: 'What exactly is ALTIQ AI?', a: 'ALTIQ AI is an AI Builder Operating System built specifically for founders in the Stacks ecosystem and Zero Authority DAO. It helps you research, validate, brand, document, and discover the right opportunities so you can focus on building the product itself.' },
  { q: 'Who is ALTIQ AI for?', a: 'Builders, developers, and founders creating products within the Stacks ecosystem who want structured support for research, branding, documentation, and opportunity discovery without the noise of generic AI tools.' },
  { q: 'Does ALTIQ AI only work with Stacks and Zero Authority DAO?', a: 'Yes. This version is deliberately focused on the Stacks ecosystem and Zero Authority DAO. The architecture allows additional official ecosystems later without a rewrite, but nothing outside this scope is included.' },
  { q: 'How does the Opportunity Intelligence work?', a: 'ALTIQ AI reads official data from Zero Authority DAO (primary) and Stacks APIs (secondary). It matches grants, bounties, and programs against both your builder profile and your active project, then explains why each opportunity is relevant and what would improve your readiness.' },
  { q: 'Will ALTIQ AI invent grants or bounties?', a: 'Never. Opportunity data comes only from official sources. If a category is unavailable, it is simply not shown. The system never fabricates funding opportunities.' },
  { q: 'How does the AI remember my project?', a: 'Every conversation and generated artifact is scoped to a specific project. Changing core details such as the project name or description automatically updates related research, branding, documentation, and recommendations so nothing falls out of sync.' },
  { q: 'Do I still control the final output?', a: 'Yes. ALTIQ AI generates drafts, scores, and recommendations. You always review and edit before anything is submitted or published. Human judgment remains in the loop by design.' },
  { q: 'What can I export?', a: 'Documentation, whitepapers, research reports, brand assets, and project summaries can be exported as PDF, Markdown, or DOCX where appropriate.' },
  { q: 'Is my data private?', a: 'Your projects and conversations remain private to your account. External API calls are made server-side only. Credentials never leave the backend.' },
  { q: 'Do I need coding knowledge to use ALTIQ AI?', a: 'No. The interface is designed for founders. You describe your idea and goals in plain language. The system handles research structure, branding suggestions, documentation outlines, and opportunity matching.' },
  { q: 'How do I get started?', a: 'Click Get Started, create an account, complete your builder profile, and create your first project. ALTIQ AI will immediately begin generating a personalized workspace based on who you are and what you are building.' },
];

const features = [
  { icon: Target, title: 'Idea Validation', desc: 'Market potential, strengths, weaknesses, and improvement paths grounded in real analysis.' },
  { icon: Search, title: 'Market Research', desc: 'Competitor tables, positioning, and opportunity analysis that would normally take days.' },
  { icon: Palette, title: 'Brand Studio', desc: 'Names, voice, palette direction, mission, vision, and prompt-ready logo concepts.' },
  { icon: FileText, title: 'Documentation', desc: 'README, whitepaper, roadmap, technical overview, and pitch outline — fully editable.' },
  { icon: Rocket, title: 'Opportunity Matching', desc: 'Grants and bounties scored against both your profile and your active project, with clear reasons.' },
  { icon: ShieldCheck, title: 'Submission Assistant', desc: 'Drafts application materials for specific opportunities. You always review before sending.' },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { label: 'Product', id: 'product' },
    { label: 'How it works', id: 'how-it-works' },
    { label: 'Ecosystem', id: 'ecosystem' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <div className="relative min-h-screen text-black overflow-x-hidden">
      <OrbitalBackground intensity={1} />

      {/* NAV — collapses to the compact menu at "lg" instead of "md" so mid-size
          windows never squeeze the links against the logo */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
        <div className="max-w-6xl mx-auto px-5">
          <nav
            className="flex items-center justify-between px-5 sm:px-6 py-3.5 transition-all duration-300"
            style={{ ...GLASS, borderRadius: '9999px' }}
            role="navigation"
            aria-label="Main"
          >
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full border border-ash/40 flex items-center justify-center" aria-hidden="true">
                <div className="w-3 h-3 rounded-full bg-black/70" />
              </div>
              <span className="font-heading font-bold tracking-wide text-lg whitespace-nowrap">ALTIQ AI</span>
            </div>

            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-dark-ash ml-6">
              {navLinks.map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="hover:text-black transition-colors duration-200 whitespace-nowrap"
                >
                  {l.label}
                </button>
              ))}
              <a href="/signup" className="ml-2 px-5 py-2.5 rounded-full font-semibold text-sm text-black bg-white hover:bg-charcoal hover:text-white transition-colors duration-200 whitespace-nowrap shrink-0">
                Get Started
              </a>
            </div>

            <button className="lg:hidden p-2 rounded-full hover:bg-black/5 transition shrink-0" onClick={() => setMobileOpen((o) => !o)} aria-label="Open menu">
              <Menu size={20} />
            </button>
          </nav>

          {/* Compact anchored dropdown — not a full-height edge-to-edge drawer.
              Sized to its content (roughly a quarter of the viewport height),
              floating just below the nav pill like a premium menu card. */}
          {mobileOpen && (
            <div className="lg:hidden absolute right-5 top-full mt-2 w-64 max-w-[78vw] z-50" role="dialog" aria-modal="true">
              <div className="p-4 flex flex-col gap-1" style={{ ...GLASS, ...CARD_RADIUS }}>
                {navLinks.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => scrollTo(l.id)}
                    className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal hover:bg-black/5 hover:text-black transition"
                  >
                    {l.label}
                  </button>
                ))}
                <a
                  href="/signup"
                  className="mt-1 px-3 py-2.5 rounded-xl bg-black text-white font-semibold text-sm text-center hover:bg-charcoal transition"
                >
                  Get Started
                </a>
              </div>
            </div>
          )}
        </div>
        {/* Invisible backdrop to catch outside taps and close the compact menu */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
        )}
      </header>

      {/* HERO */}
      <section className="relative z-10 pt-40 pb-32 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm tracking-[0.2em] text-dark-ash mb-8 font-medium uppercase">AI Builder Operating System</p>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-10">
            Build. Position. Win.
          </h1>
          <p className="text-lg sm:text-xl text-dark-ash max-w-xl mx-auto leading-relaxed mb-14">
            ALTIQ AI helps Stacks builders research, validate, brand, document, and discover the right opportunities — so you can stay focused on building the product itself, not the paperwork around it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full bg-black text-white font-semibold text-base hover:bg-charcoal transition-colors duration-200">
              Get Started <ArrowRight size={18} />
            </a>
            <button onClick={() => scrollTo('how-it-works')} className="inline-flex items-center justify-center px-9 py-4 rounded-full border border-ash/35 text-black font-medium hover:bg-black/5 transition-colors duration-200">
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="relative z-10 py-28 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-8">Building is hard enough.</h2>
          <p className="text-dark-ash text-lg leading-relaxed mb-5">
            Most founders lose days to research, branding decisions, documentation, and searching for the right grants or bounties — time that should have gone into the product itself. By the time a real opportunity shows up, half the week is already spent chasing information instead of building.
          </p>
          <p className="text-dark-ash text-lg leading-relaxed">
            ALTIQ AI was created so that work no longer sits on your shoulders alone. It reads your project the way a co-founder would, keeps every document and decision in sync as your idea evolves, and surfaces the opportunities that are actually worth your time — so building stays the hard part, not everything around it.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-5">How it works</h2>
            <p className="text-dark-ash max-w-md mx-auto">A clear path from first idea to prepared submission.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create your profile & project', text: 'Tell ALTIQ who you are and what you are building. The system immediately understands your skills, goals, and project context.' },
              { step: '02', title: 'Research, brand & document', text: 'Generate structured research, brand direction, and professional documentation — all editable and exportable.' },
              { step: '03', title: 'Discover & prepare opportunities', text: 'Receive matched grants and bounties with clear reasoning, readiness scores, and submission drafts you can refine.' },
            ].map((item) => (
              <div key={item.step} className="p-9 transition-transform duration-300 hover:-translate-y-1" style={{ ...GLASS, ...CARD_RADIUS }}>
                <div className="text-sm font-heading font-bold text-ash mb-5">{item.step}</div>
                <h3 className="font-heading text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-dark-ash text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section id="product" className="relative z-10 py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-5">Everything surrounding the build</h2>
            <p className="text-dark-ash max-w-md mx-auto">One continuous workspace instead of disconnected tools.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-8 transition-transform duration-300 hover:-translate-y-1" style={{ ...GLASS, ...CARD_RADIUS }}>
                <div className="w-11 h-11 rounded-2xl bg-black/5 border border-ash/30 flex items-center justify-center mb-5">
                  <f.icon size={19} strokeWidth={1.75} className="text-black" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-dark-ash text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section id="ecosystem" className="relative z-10 py-28 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-8">Built for Stacks & Zero Authority DAO</h2>
          <p className="text-dark-ash text-lg leading-relaxed mb-10">
            Opportunity data comes only from official sources. Zero Authority DAO is the primary feed. Official Stacks APIs are the secondary source. Nothing is scraped from unofficial sites and nothing is invented.
          </p>
          <div className="inline-block px-7 py-3.5 text-sm text-dark-ash" style={{ ...GLASS, ...CARD_RADIUS }}>
            Server-side only · Cached · Never fabricated
          </div>
        </div>
      </section>

      {/* MISSION / VISION */}
      <section className="relative z-10 py-28 px-5">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-10" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h3 className="font-heading text-sm tracking-[0.15em] text-ash mb-5 uppercase">Mission</h3>
            <p className="text-lg leading-relaxed text-black">To simplify the journey from idea to opportunity, giving builders in the Stacks ecosystem the tools and direction to create with confidence.</p>
          </div>
          <div className="p-10" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h3 className="font-heading text-sm tracking-[0.15em] text-ash mb-5 uppercase">Vision</h3>
            <p className="text-lg leading-relaxed text-black">To make world-class product building accessible to every builder in the ecosystem — helping great ideas reach the funding they deserve.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-28 px-5">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-16">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <div key={i} className="overflow-hidden transition-all duration-300" style={{ ...GLASS, ...CARD_RADIUS }}>
                <button
                  className="w-full flex items-center justify-between p-6 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-heading font-medium pr-4">{item.q}</span>
                  <ChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6 text-dark-ash text-sm leading-relaxed">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-36 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-8">Ready to build with clarity?</h2>
          <p className="text-dark-ash text-lg mb-12 max-w-md mx-auto">Create your account, complete your profile, and let ALTIQ AI start working alongside you.</p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2.5 px-14 py-5 rounded-full bg-black text-white font-bold text-xl shadow-lg hover:bg-charcoal hover:shadow-xl transition-all duration-200"
          >
            Get Started <ArrowRight size={22} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-ash/25 py-14 px-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border border-ash/40 flex items-center justify-center" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-full bg-black/70" />
            </div>
            <span className="font-heading font-bold">ALTIQ AI</span>
          </div>
          <div className="flex gap-8 text-sm text-dark-ash">
            <a
              href="https://x.com/Altiq_AI"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ALTIQ AI on X (Twitter)"
              className="hover:text-black transition-colors"
            >
              <Twitter size={19} />
            </a>
          </div>
          <p className="text-sm text-dark-ash">© 2026 ALTIQ AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
