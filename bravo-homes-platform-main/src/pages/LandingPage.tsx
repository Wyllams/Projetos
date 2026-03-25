import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { motion } from 'framer-motion';
import './LandingPage.css';

export default function LandingPage() {
  const { city } = useParams();
  const rawCity = city || 'Atlanta';
  // capitalize first letters
  const cityTitle = rawCity.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const [scrolled, setScrolled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "Hi! 👋 How can we help with your bathroom remodel?", type: 'agent' },
    { text: "We're happy to answer questions in English or Spanish — Hablamos Español! 🌎", type: 'agent' }
  ]);
  const [formSuccess, setFormSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Update SEO Title dynamically
  useEffect(() => {
    document.title = `Bathroom Remodel ${cityTitle} GA — Free Estimate`;
  }, [cityTitle]);

  const handleFaqClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const item = btn.closest('.faq-item');
    if (!item) return;
    
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) {
      item.classList.add('open');
    }
    btn.setAttribute('aria-expanded', String(!isOpen));
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { text: chatInput, type: 'user' }]);
    setChatInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Thanks for your message! Our team will get back to you soon.", type: 'agent' }]);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!captchaToken) {
      alert("Please complete the security check.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      service_type: formData.get('service_type') as string,
      city: cityTitle,
      source: `lp-bathroom-${rawCity.toLowerCase()}`,
      status: 'new',
      urgency: formData.get('timeline') === 'asap' ? 'hot' : 'warm',
      notes: `Zip: ${formData.get('zip_code')} | Size: ${formData.get('bathroom_size')} | Timeline: ${formData.get('timeline')} | Msg: ${formData.get('message')}`,
      captchaToken
    };

    try {
      // Calls the Edge Function to handle insertion securely based on Turnstile validation
      const { data: resData, error } = await supabase.functions.invoke('submit-lead', {
        body: data
      });

      if (error || !resData?.success) {
        console.error('Submission error:', error || resData?.error);
        alert('There was an issue submitting your request. Please try again.');
      } else {
        setFormSuccess(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
      turnstileRef.current?.reset();
    }
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ===== STICKY HEADER ===== */}
      <header id="header" className={scrolled ? 'scrolled' : ''}>
        <div className="header-inner">
          <div className="logo">
            Bravo Homes Group
            <span>Bathroom Remodeling Specialists</span>
          </div>
          <div className="header-right">
            <a href="tel:7705550100" className="header-phone">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"/></svg>
              (770) 555-0100
            </a>
            <a href="#form-section" className="btn-gold">Free Quote</a>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section id="hero">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-eyebrow">Bathroom Remodel {cityTitle} GA — Free Estimate</div>
              <h1>Home Remodeling in <span className="gold">{cityTitle}, GA</span></h1>
              <p className="hero-sub">Georgia's most trusted bathroom remodeling team. Serving {cityTitle} &amp; surrounding areas. Licensed. Insured. Bilingual.</p>
              <div className="hero-cta">
                <a href="#form-section" className="btn-gold" style={{ fontSize: '1.08rem', padding: '16px 32px' }}>
                  Get Your Free Estimate Today →
                </a>
                <a href="tel:7705550100" className="btn-outline">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"/></svg>
                  Call Now
                </a>
              </div>
              <div className="trust-badges">
                <div className="trust-badge"><span className="trust-badge-icon">🛡️</span> Licensed &amp; Insured</div>
                <div className="trust-badge"><span className="trust-badge-icon">⭐</span> 5-Star Rated</div>
                <div className="trust-badge"><span className="trust-badge-icon">⚡</span> 48h Response</div>
                <div className="trust-badge"><span className="trust-badge-icon">✅</span> 100% Satisfaction</div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-visual-inner">
                <span className="hero-visual-emoji">🛁</span>
                <div className="hero-visual-text">Your Dream Bathroom Awaits</div>
              </div>
              <div className="hero-badge-pill">
                <div>
                  <div className="hero-badge-stars">★★★★★</div>
                </div>
                <div className="hero-badge-text">
                  <strong>342 Families Served</strong>
                  <span>{cityTitle} &amp; Metro Atlanta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF BAR ===== */}
      <div id="social-bar">
        <div className="social-bar-inner">
          <div className="sbar-item"><span className="sbar-num">342</span> Families Transformed</div>
          <div className="sbar-dot"></div>
          <div className="sbar-item"><span className="sbar-num">$31k</span> Avg Project Value</div>
          <div className="sbar-dot"></div>
          <div className="sbar-item"><span className="sbar-num">5.0</span> ⭐ Average Rating</div>
          <div className="sbar-dot"></div>
          <div className="sbar-item">Serving Georgia <span className="sbar-num">Since 2018</span></div>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section id="process" className="section">
        <div className="container">
          <div className="section-label">Our Process</div>
          <h2 className="section-title">Simple. Transparent. <span className="gold">Stress-Free.</span></h2>
          <p className="section-sub">From first call to final walkthrough — we handle everything so you don't have to.</p>
          <div className="steps-grid">
            <motion.div className="step-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }}>
              <div className="step-num">01</div>
              <div className="step-icon">🏠</div>
              <div className="step-title">Free In-Home Estimate</div>
              <p className="step-desc">We come to you — no strings attached. Our estimator walks your bathroom, listens to your vision, and gives you an honest price on the spot. No surprises, no pressure.</p>
            </motion.div>
            <motion.div className="step-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="step-num">02</div>
              <div className="step-icon">📐</div>
              <div className="step-title">Custom Design &amp; Proposal</div>
              <p className="step-desc">We craft a detailed proposal with material selections, timelines, and fixed pricing. You'll know exactly what you're getting — in English or Spanish — before signing anything.</p>
            </motion.div>
            <motion.div className="step-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="step-num">03</div>
              <div className="step-icon">🔨</div>
              <div className="step-title">Professional Installation</div>
              <p className="step-desc">Our licensed crew gets to work on your schedule. Daily updates, clean job site, and zero surprises. We don't leave until you love your new bathroom — guaranteed.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== BEFORE/AFTER GALLERY ===== */}
      <section id="gallery" className="section">
        <div className="container">
          <div className="section-label">Our Work</div>
          <h2 className="section-title">Real Transformations, <span className="gold">Real Results</span></h2>
          <p className="section-sub">Every project is unique. Here's a glimpse at what we've done for families just like yours across Metro Atlanta.</p>
          <div className="gallery-grid">
            <motion.div className="ba-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }}>
              <div className="ba-images">
                <div className="ba-before">🛁<span className="ba-label">BEFORE</span></div>
                <div className="ba-after">✨🚿<span className="ba-label">AFTER</span></div>
              </div>
              <div className="ba-info">
                <div className="ba-title">Marietta Master Bath <span className="ba-price">$18,400</span></div>
                <div className="ba-meta">Full shower replacement · Tile · Vanity · Fixtures</div>
              </div>
            </motion.div>
            <motion.div className="ba-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="ba-images">
                <div className="ba-before">🛁<span className="ba-label">BEFORE</span></div>
                <div className="ba-after">✨🛁<span className="ba-label">AFTER</span></div>
              </div>
              <div className="ba-info">
                <div className="ba-title">Alpharetta Guest Bath <span className="ba-price">$12,200</span></div>
                <div className="ba-meta">Tub-to-shower conversion · New flooring · Lighting</div>
              </div>
            </motion.div>
            <motion.div className="ba-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="ba-images">
                <div className="ba-before">🪞<span className="ba-label">BEFORE</span></div>
                <div className="ba-after">✨🪞<span className="ba-label">AFTER</span></div>
              </div>
              <div className="ba-info">
                <div className="ba-title">Roswell Hall Bath <span className="ba-price">$8,750</span></div>
                <div className="ba-meta">Vanity · Mirror · Tile walls · Fixtures update</div>
              </div>
            </motion.div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <a href="#form-section" className="btn-gold">Start Your Transformation →</a>
          </div>
        </div>
      </section>

      {/* ===== WHY BRAVO ===== */}
      <section id="why" className="section">
        <div className="container">
          <div className="section-label">Why Choose Us</div>
          <h2 className="section-title">The Bravo Homes <span className="gold">Difference</span></h2>
          <p className="section-sub">We're not just contractors — we're your neighbors. Here's what sets us apart from every other remodeler in Georgia.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
            <div className="why-grid">
              <motion.div className="why-item" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }}>
                <div className="why-icon">🛡️</div>
                <div className="why-content">
                  <h3>Licensed &amp; Insured in Georgia</h3>
                  <p>Fully licensed, bonded, and insured. You're protected every step of the way — no unlicensed subs, ever.</p>
                </div>
              </motion.div>
              <motion.div className="why-item" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="why-icon">🌎</div>
                <div className="why-content">
                  <h3>Hablamos Español — Bilingual Team</h3>
                  <p>Our entire team is fluent in Spanish and English. No miscommunications, no middlemen. We speak your language.</p>
                </div>
              </motion.div>
              <motion.div className="why-item" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.2 }}>
                <div className="why-icon">📋</div>
                <div className="why-content">
                  <h3>5-Year Workmanship Warranty</h3>
                  <p>Every project comes with a full 5-year warranty on our labor. If anything isn't right, we fix it — no questions asked.</p>
                </div>
              </motion.div>
              <motion.div className="why-item" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.3 }}>
                <div className="why-icon">💰</div>
                <div className="why-content">
                  <h3>Upfront Transparent Pricing</h3>
                  <p>No bait-and-switch. No hidden fees. Your quote is your price — period. We put everything in writing before we start.</p>
                </div>
              </motion.div>
              <motion.div className="why-item" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.4 }}>
                <div className="why-icon">🎯</div>
                <div className="why-content">
                  <h3>Managed Start to Finish</h3>
                  <p>One dedicated project manager. One point of contact. We coordinate everything so you never have to chase anyone down.</p>
                </div>
              </motion.div>
              <motion.div className="why-item" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.5 }}>
                <div className="why-icon">📱</div>
                <div className="why-content">
                  <h3>Online Project Tracking Portal</h3>
                  <p>Log in anytime to see photos, progress updates, and timelines. You're always in the loop — even from work.</p>
                </div>
              </motion.div>
            </div>
            <motion.div className="why-visual" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6 }}>
              <div className="why-visual-inner">
                <span className="why-big-emoji">🏆</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Georgia's Choice for<br/>Bathroom Remodeling</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--t2)', marginBottom: '20px', lineHeight: 1.7 }}>Voted Best Contractor in Cobb County 2023 &amp; 2024 by local homeowners.</p>
                <div className="why-bilingual">🇺🇸 English · 🇲🇽 Español · We Speak Your Language</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== LEAD CAPTURE FORM ===== */}
      <section id="form-section" className="section">
        <div className="container">
          <div className="form-wrapper">
            <div className="form-side-info">
              <div className="section-label">Free Estimate</div>
              <h2 className="form-side-title">Get Your Free Bathroom <span className="gold">Estimate Today</span></h2>
              <p className="form-side-sub">Fill out the form and we'll reach out within 24 hours to schedule your free in-home consultation. No obligation, no pressure — just honest answers and a fair price.</p>
              <div className="form-guarantees">
                <div className="form-guarantee"><div className="form-guarantee-check">✓</div> Free in-home estimate — zero cost to you</div>
                <div className="form-guarantee"><div className="form-guarantee-check">✓</div> Response within 24 hours guaranteed</div>
                <div className="form-guarantee"><div className="form-guarantee-check">✓</div> Written quote — no verbal promises</div>
                <div className="form-guarantee"><div className="form-guarantee-check">✓</div> Licensed &amp; insured crew — always</div>
                <div className="form-guarantee"><div className="form-guarantee-check">✓</div> Bilingual consultation available</div>
                <div className="form-guarantee"><div className="form-guarantee-check">✓</div> 5-year workmanship warranty included</div>
              </div>
              <div style={{ marginTop: '32px', padding: '20px', background: 'var(--gd)', border: '1px solid rgba(201,148,58,0.25)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Limited Availability</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>We only take on <strong style={{ color: 'var(--text)' }}>8–10 projects per month</strong> to ensure quality. Spots fill up fast — secure yours today.</div>
              </div>
            </div>

            <div className="form-card">
              {!formSuccess ? (
                <>
                  <div className="form-card-title">Get Your Free Bathroom Estimate in {cityTitle}</div>
                  <p className="form-card-sub">Takes less than 60 seconds. No spam. No pressure.</p>
                  <div id="lead-form-container">
                    <form id="lead-form" onSubmit={handleSubmit} noValidate>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Full Name <span className="req">*</span></label>
                          <input type="text" name="full_name" placeholder="Maria Garcia" autoComplete="name" required />
                        </div>
                        <div className="form-group">
                          <label>Phone <span className="req">*</span></label>
                          <input type="tel" name="phone" placeholder="(770) 555-0000" autoComplete="tel" required />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Email <span className="req">*</span></label>
                          <input type="email" name="email" placeholder="maria@email.com" autoComplete="email" required />
                        </div>
                        <div className="form-group">
                          <label>Zip Code <span className="req">*</span></label>
                          <input type="text" name="zip_code" placeholder="30060" maxLength={5} required />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Bathroom Size <span className="req">*</span></label>
                          <select name="bathroom_size" required>
                            <option value="" disabled>-- Selecione --</option>
                            <option value="small">Small (&lt;50 sqft)</option>
                            <option value="medium">Medium (50–80 sqft)</option>
                            <option value="large">Large (80+ sqft)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Service Type <span className="req">*</span></label>
                          <select name="service_type" required>
                            <option value="" disabled>-- Selecione --</option>
                            <option value="full_remodel">Full Remodel</option>
                            <option value="tile_flooring">Tile &amp; Flooring</option>
                            <option value="shower_tub">Shower/Tub Replacement</option>
                            <option value="vanity">Vanity Update</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>When are you looking to start? <span className="req">*</span></label>
                        <select name="timeline" required>
                          <option value="" disabled>-- Selecione --</option>
                          <option value="asap">ASAP — I'm ready now</option>
                          <option value="1_3mo">1–3 months</option>
                          <option value="3_6mo">3–6 months</option>
                          <option value="exploring">Just exploring options</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Anything else you'd like us to know? <span style={{ color: 'var(--t3)' }}>(Optional)</span></label>
                        <textarea name="message" placeholder="Tell us about your bathroom..."></textarea>
                      </div>
                      <div className="form-group" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <Turnstile
                          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} // Testing key by default
                          onSuccess={(token) => setCaptchaToken(token)}
                          onError={() => setCaptchaToken(null)}
                          onExpire={() => setCaptchaToken(null)}
                          ref={turnstileRef}
                        />
                      </div>
                      <button type="submit" className="btn-gold btn-submit" disabled={submitting || !captchaToken}>
                        <span>{submitting ? 'Submitting...' : 'Request My Free Estimate →'}</span>
                      </button>
                      <p className="form-disclaimer">By submitting, you agree to be contacted by Bravo Homes Group. We never sell your information. 100% spam-free.</p>
                    </form>
                  </div>
                </>
              ) : (
                <div id="form-success" className="visible">
                  <div className="success-icon">🎉</div>
                  <div className="success-title">You're All Set!</div>
                  <p className="success-sub">We'll contact you within <strong>24 hours</strong> to schedule your free in-home estimate.<br/><br/>In the meantime, feel free to call us directly at <strong>(770) 555-0100</strong> — we're ready to talk!</p>
                  <div style={{ marginTop: '24px' }}>
                    <a href="tel:7705550100" className="btn-gold" style={{ justifyContent: 'center', width: '100%' }}>
                      📞 Call Now: (770) 555-0100
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="section">
        <div className="container">
          <div className="section-label">Client Reviews</div>
          <h2 className="section-title">Families Love <span className="gold">Bravo Homes</span></h2>
          <p className="section-sub">Don't take our word for it — here's what our customers say about their experience.</p>
          <div className="testi-grid">
            <motion.div className="testi-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }}>
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">Bravo Homes completamente transformó nuestro baño. Todo el equipo fue profesional, limpio y puntual. El resultado superó todas nuestras expectativas. ¡Los recomiendo al 100%!</p>
              <div className="testi-author">
                <div className="testi-avatar">MR</div>
                <div>
                  <div className="testi-name">María Rodríguez</div>
                  <div className="testi-location">Marietta, GA · Full Remodel · March 2025</div>
                </div>
              </div>
            </motion.div>
            <motion.div className="testi-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">I was nervous about the whole process, but the Bravo team made it so easy. They explained everything in Spanish, kept me updated daily, and finished two days ahead of schedule. Incredible work!</p>
              <div className="testi-author">
                <div className="testi-avatar">CL</div>
                <div>
                  <div className="testi-name">Carlos &amp; Lucia Mendez</div>
                  <div className="testi-location">Alpharetta, GA · Shower Replacement · Jan 2025</div>
                </div>
              </div>
            </motion.div>
            <motion.div className="testi-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">Best investment we made in our home. The pricing was transparent — what they quoted is exactly what we paid. No surprises. Our bathroom looks like something out of a magazine. Absolutely worth every penny.</p>
              <div className="testi-author">
                <div className="testi-avatar">AV</div>
                <div>
                  <div className="testi-name">Ana &amp; Roberto Vargas</div>
                  <div className="testi-location">Roswell, GA · Tile &amp; Vanity · Nov 2024</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="section">
        <div className="container">
          <div className="section-label">FAQ</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Common Questions <span className="gold">Answered</span></h2>
          <p className="section-sub" style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Everything you need to know before getting started with your bathroom remodel.</p>
          <div className="faq-list">
            <div className="faq-item">
              <button className="faq-q" onClick={handleFaqClick} aria-expanded="false">
                How much does a bathroom remodel cost in {cityTitle}?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">Bathroom remodel costs in {cityTitle} vary based on scope and materials. A basic refresh runs $3,000–$8,000. A mid-range remodel costs $10,000–$20,000. A full luxury renovation can run $25,000–$50,000+. We provide free in-home estimates so you get an accurate price.</div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" onClick={handleFaqClick} aria-expanded="false">
                How long does a bathroom remodel take?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">Timeline depends on project size. A simple refresh takes 3–5 days. A standard remodel (new shower, tile, vanity) usually takes 1–2 weeks. A full gut-and-rebuild takes 2–4 weeks.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">Bravo Homes Group</div>
              <p className="footer-desc">Georgia's most trusted bathroom remodeling specialists. Licensed, insured, and bilingual. Serving {cityTitle} &amp; Metro Atlanta since 2018.</p>
            </div>
            <div>
              <div className="footer-col-title">Services</div>
              <div className="footer-links">
                <a href="#form-section">Full Bathroom Remodel</a>
                <a href="#form-section">Tile &amp; Flooring</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Service Areas</div>
              <div className="footer-links">
                <a href="#form-section">Marietta, GA</a>
                <a href="#form-section">Alpharetta, GA</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 Bravo Homes Group LLC. All rights reserved. Georgia License #CONTR-2018-0842</div>
            <div className="footer-bottom-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== CHAT WIDGET ===== */}
      <button id="chat-btn" aria-label="Open chat" onClick={() => setChatOpen(!chatOpen)}>💬</button>
      <div id="chat-panel" role="dialog" aria-label="Chat with Bravo Homes" className={chatOpen ? 'open' : ''}>
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">🏠</div>
            <div>
              <div className="chat-name">Bravo Homes Support</div>
              <div className="chat-status">● Online now</div>
            </div>
          </div>
          <button className="chat-close" onClick={() => setChatOpen(false)} aria-label="Close chat">✕</button>
        </div>
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-msg ${m.type}`}>{m.text}</div>
          ))}
        </div>
        <div className="chat-input-row">
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Type your message..." 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
          />
          <button id="chat-send" onClick={handleChatSend}>Send</button>
        </div>
      </div>

    </div>
  );
}
