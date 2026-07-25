import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { GLASS, CARD_RADIUS, PANEL_RADIUS } from '../theme';

/* =========================================================
   ALTIQ AI — Phase 1 Landing Page (Refined)
   Geist + Montserrat | Exact monochrome | Improved orbital
   ========================================================= */

function OrbitalBackground({ intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let orbits = [];
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particleCount = Math.floor(55 * intensity);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.25,
        alpha: Math.random() * 0.4 + 0.1,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 3; i++) {
      orbits.push({
        cx: canvas.width * (0.25 + i * 0.25),
        cy: canvas.height * (0.35 + i * 0.15),
        radius: 90 + i * 70,
        angle: Math.random() * Math.PI * 2,
        speed: 0.0004 + i * 0.0002,
      });
    }

    const draw = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbits.forEach((o) => {
        o.angle += o.speed;
        ctx.beginPath();
        ctx.arc(o.cx, o.cy, o.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(167, 167, 167, ${0.15 * intensity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const ox = o.cx + Math.cos(o.angle) * o.radius;
        const oy = o.cy + Math.sin(o.angle) * o.radius;
        ctx.beginPath();
        ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(35, 35, 35, ${0.5 * intensity})`;
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.twinkle)) * intensity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(17, 17, 17, ${a})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
      aria-hidden="true"
    />
  );
}

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
  { q: 'How is this different from ChatGPT or other AI chat tools?', a: 'ALTIQ AI is not a general chatbot. It is a persistent workspace that understands your builder profile, your active project, and the Stacks / Zero Authority landscape. Modules share context so the experience feels like one continuous operating system.' },
  { q: 'What happens if an external API is temporarily unavailable?', a: 'The system shows the last synchronized data with a clear timestamp, continues working with what it has, and retries in the background. Your drafts and project data are never lost.' },
  { q: 'Can I use ALTIQ AI for multiple projects?', a: 'Yes. Each project is an isolated workspace. Context, AI memory, documents, and recommendations stay separate so work on one project never mixes with another.' },
  { q: 'Is there a mobile experience?', a: 'Yes. The entire product is fully responsive. On mobile the navigation becomes a smooth sliding drawer. The same design language and functionality are available across phone, tablet, laptop, and desktop.' },
  { q: 'How do I get started?', a: 'Click Get Started, create an account, complete your builder profile, and create your first project. ALTIQ AI will immediately begin generating a personalized workspace based on who you are and what you are building.' },
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

  return (
    <div className="relative min-h-screen text-black overflow-x-hidden">
      <OrbitalBackground intensity={1} />

      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
        <div className="max-w-6xl mx-auto px-5">
          <nav
            className="flex items-center justify-between px-6 py-3.5 transition-all duration-300"
            style={{ ...GLASS, borderRadius: '9999px' }}
            role="navigation"
            aria-label="Main"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-ash/40 flex items-center justify-center" aria-hidden="true">
                <div className="w-3 h-3 rounded-full bg-black/70" />
              </div>
              <span className="font-heading font-bold tracking-wide text-lg">ALTIQ AI</span>
            </div>

            <div className="hidden md:flex items-center gap-10 text-sm font-medium text-light-ash">
              <button onClick={() => scrollTo('product')} className="hover:text-black transition-colors duration-200">Product</button>
              <button onClick={() => scrollTo('how-it-works')} className="hover:text-black transition-colors duration-200">How it works</button>
              <button onClick={() => scrollTo('ecosystem')} className="hover:text-black transition-colors duration-200">Ecosystem</button>
              <button onClick={() => scrollTo('faq')} className="hover:text-black transition-colors duration-200">FAQ</button>
              <a href="/signup" className="ml-2 px-5 py-2.5 rounded-full font-semibold text-sm text-black bg-white hover:bg-charcoal transition-colors duration-200">
                Get Started
              </a>
            </div>

            <button className="md:hidden p-2 rounded-full hover:bg-white/10 transition" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute top-0 right-0 h-full w-[80%] max-w-xs p-8 flex flex-col" style={{ ...GLASS, borderRadius: '0 0 0 22px' }} role="dialog" aria-modal="true">
            <div className="flex justify-between items-center mb-14">
              <span className="font-heading font-bold text-lg">ALTIQ AI</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={22} /></button>
            </div>
            <nav className="flex flex-col gap-7 text-lg font-medium">
              <button onClick={() => scrollTo('product')} className="text-left hover:text-light-ash transition">Product</button>
              <button onClick={() => scrollTo('how-it-works')} className="text-left hover:text-light-ash transition">How it works</button>
              <button onClick={() => scrollTo('ecosystem')} className="text-left hover:text-light-ash transition">Ecosystem</button>
              <button onClick={() => scrollTo('faq')} className="text-left hover:text-light-ash transition">FAQ</button>
              <a href="/signup" className="mt-8 px-6 py-3.5 rounded-full bg-black text-white font-semibold text-center">Get Started</a>
            </nav>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative z-10 pt-40 pb-32 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm tracking-[0.2em] text-ash mb-8 font-medium uppercase">AI Builder Operating System</p>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-10">
            Build. Position. Win.
          </h1>
          <p className="text-lg sm:text-xl text-light-ash max-w-xl mx-auto leading-relaxed mb-14">
            ALTIQ AI helps Stacks builders research, validate, brand, document, and discover the right opportunities — so you can stay focused on building the product itself.
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
          <p className="text-light-ash text-lg leading-relaxed">
            Most founders lose days to research, branding decisions, documentation, and searching for the right grants or bounties. ALTIQ AI was created so that work no longer sits on your shoulders alone.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-5">How it works</h2>
            <p className="text-ash max-w-md mx-auto">A clear path from first idea to prepared submission.</p>
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
                <p className="text-light-ash text-sm leading-relaxed">{item.text}</p>
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
            <p className="text-ash max-w-md mx-auto">One continuous workspace instead of disconnected tools.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Idea Validation', desc: 'Market potential, strengths, weaknesses, and improvement paths grounded in real analysis.' },
              { title: 'Market Research', desc: 'Competitor tables, positioning, and opportunity analysis that would normally take days.' },
              { title: 'Brand Studio', desc: 'Names, voice, palette direction, mission, vision, and prompt-ready logo concepts.' },
              { title: 'Documentation', desc: 'README, whitepaper, roadmap, technical overview, and pitch outline — fully editable.' },
              { title: 'Opportunity Matching', desc: 'Grants and bounties scored against both your profile and your active project, with clear reasons.' },
              { title: 'Submission Assistant', desc: 'Drafts application materials for specific opportunities. You always review before sending.' },
            ].map((f) => (
              <div key={f.title} className="p-8 transition-transform duration-300 hover:-translate-y-1" style={{ ...GLASS, ...CARD_RADIUS }}>
                <h3 className="font-heading text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-light-ash text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section id="ecosystem" className="relative z-10 py-28 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-8">Built for Stacks & Zero Authority DAO</h2>
          <p className="text-light-ash text-lg leading-relaxed mb-10">
            Opportunity data comes only from official sources. Zero Authority DAO is the primary feed. Official Stacks APIs are the secondary source. Nothing is scraped from unofficial sites and nothing is invented.
          </p>
          <div className="inline-block px-7 py-3.5 text-sm text-ash" style={{ ...GLASS, ...CARD_RADIUS }}>
            Server-side only · Cached · Never fabricated
          </div>
        </div>
      </section>

      {/* MISSION / VISION */}
      <section className="relative z-10 py-28 px-5">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-10" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h3 className="font-heading text-sm tracking-[0.15em] text-ash mb-5 uppercase">Mission</h3>
            <p className="text-lg leading-relaxed">To simplify the journey from idea to opportunity, giving builders in the Stacks ecosystem the tools and direction to create with confidence.</p>
          </div>
          <div className="p-10" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h3 className="font-heading text-sm tracking-[0.15em] text-ash mb-5 uppercase">Vision</h3>
            <p className="text-lg leading-relaxed">To make world-class product building accessible to every builder in the ecosystem — helping great ideas reach the funding they deserve.</p>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="relative z-10 py-28 px-5">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-16">Product roadmap</h2>
          <div className="space-y-5">
            {[
              { phase: 'Now', title: 'Core workspace', items: 'Profile, projects, AI chat, research, branding, documentation, and readiness scoring.' },
              { phase: 'Next', title: 'Opportunity engine', items: 'Live grants & bounties, intelligent matching, per-opportunity pages, and submission drafting.' },
              { phase: 'Later', title: 'Growth & depth', items: 'Learning center, deeper ecosystem monitoring, file manager, and advanced export options.' },
            ].map((r) => (
              <div key={r.phase} className="flex gap-6 p-7" style={{ ...GLASS, ...CARD_RADIUS }}>
                <div className="font-heading font-bold text-ash w-16 shrink-0 pt-0.5">{r.phase}</div>
                <div>
                  <h3 className="font-heading font-semibold mb-1.5">{r.title}</h3>
                  <p className="text-light-ash text-sm leading-relaxed">{r.items}</p>
                </div>
              </div>
            ))}
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
                  <div className="px-6 pb-6 text-light-ash text-sm leading-relaxed">{item.a}</div>
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
          <p className="text-light-ash text-lg mb-12 max-w-md mx-auto">Create your account, complete your profile, and let ALTIQ AI start working alongside you.</p>
          <a href="/signup" className="inline-flex items-center gap-2 px-11 py-4.5 rounded-full bg-black text-white font-semibold text-lg hover:bg-charcoal transition-colors duration-200">
            Get Started <ArrowRight size={20} />
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
          <div className="flex gap-8 text-sm text-ash">
            <a href="https://x.com/Altiq_AI" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">X</a>
          </div>
          <p className="text-sm text-ash">© 2026 ALTIQ AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
