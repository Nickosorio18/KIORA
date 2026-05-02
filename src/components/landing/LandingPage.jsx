import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PLANS } from "@/config/plans";

// Extrae el número de priceLocal.MX: "$499 MXN" → "499"
const mxNum = (plan) => plan.priceLocal.MX.match(/\$([\d,]+)/)?.[1] ?? plan.priceUSD;

const css = `
:root{--gold:#C8A96E;--gold-light:#E8D5A3;--gold-pale:#F0E6D3;--gold-glow:rgba(200,169,110,.12);--cream:#FAF8F5;--cream-dark:#F2EDE5;--charcoal:#1A1A1E;--charcoal-soft:#2A2A30;--text-dark:#1A1A2E;--text-muted:#6B6B80;--text-light:#9A9189;--white:#FFF;--green:#7A9E7E;--green-light:#EDF3EE;--font-display:'Playfair Display',Georgia,serif;--font-body:'Jost',system-ui,sans-serif}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}
.lp-wrap{font-family:var(--font-body);color:var(--text-dark);background:var(--cream);overflow-x:hidden;-webkit-font-smoothing:antialiased}

/* grain texture */
.lp-wrap::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.028;pointer-events:none;z-index:9998}

/* animations */
.reveal{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.4,0,.2,1),transform .8s cubic-bezier(.4,0,.2,1)}.reveal.visible{opacity:1;transform:translateY(0)}.reveal-d1{transition-delay:.12s}.reveal-d2{transition-delay:.24s}.reveal-d3{transition-delay:.36s}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes pulseGlow{0%,100%{opacity:.05}50%{opacity:.11}}
@keyframes scrollLine{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}

/* NAV */
.lp-nav{position:fixed;top:0;width:100%;z-index:1000;padding:1.5rem 5%;display:flex;justify-content:space-between;align-items:center;transition:all .5s cubic-bezier(.4,0,.2,1)}
.lp-nav.scrolled{background:rgba(250,248,245,.94);backdrop-filter:blur(20px);padding:1rem 5%;box-shadow:0 1px 0 rgba(200,169,110,.12)}
.lp-nav .nav-logo{color:rgba(255,255,255,.9)}.lp-nav.scrolled .nav-logo{color:var(--charcoal)}
.lp-nav.scrolled .nav-links a{color:var(--text-muted)}.lp-nav.scrolled .nav-links a:hover{color:var(--gold)}
.nav-logo{font-family:var(--font-display);font-size:1.5rem;font-weight:500;letter-spacing:.3em;text-decoration:none;transition:color .5s}
.nav-logo .ac{color:var(--gold);font-weight:700}
.nav-links{display:flex;gap:2.5rem;list-style:none;align-items:center}
.nav-links a{font-size:.7rem;font-weight:300;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.45);text-decoration:none;transition:color .3s}
.nav-links a:hover{color:var(--gold-light)}
.nav-cta{padding:.6rem 1.5rem;background:var(--gold);color:var(--charcoal)!important;border-radius:2px;font-size:.68rem!important;font-weight:500!important;letter-spacing:.1em!important;transition:all .3s!important}
.nav-cta:hover{background:var(--gold-light);transform:scale(1.03)}

/* HERO */
.hero{min-height:100vh;display:flex;align-items:center;padding:7rem 5% 5rem;position:relative;overflow:hidden;background:var(--charcoal)}
.hero-mesh{position:absolute;inset:0;background:radial-gradient(ellipse 55% 65% at 15% 50%,rgba(200,169,110,.07) 0%,transparent 60%),radial-gradient(ellipse 40% 50% at 85% 20%,rgba(123,166,138,.04) 0%,transparent 60%),radial-gradient(ellipse 45% 40% at 75% 85%,rgba(200,169,110,.04) 0%,transparent 60%);pointer-events:none}
.hero-vline{position:absolute;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,rgba(200,169,110,.06) 20%,rgba(200,169,110,.06) 80%,transparent);pointer-events:none}
.hero-container{max-width:1200px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center;position:relative;z-index:2}
.hero-label{display:inline-flex;align-items:center;gap:.8rem;margin-bottom:2.5rem;animation:fadeUp .8s .2s both}
.hero-label-line{width:28px;height:1px;background:rgba(200,169,110,.35)}
.hero-label-text{font-size:.62rem;font-weight:400;letter-spacing:.25em;text-transform:uppercase;color:rgba(200,169,110,.65)}
.hero h1{font-family:var(--font-display);font-size:clamp(2.8rem,5vw,4.2rem);font-weight:400;line-height:1.1;color:rgba(255,255,255,.88);margin-bottom:1.6rem;animation:fadeUp .8s .35s both}
.hero h1 em{font-style:italic;font-weight:500;background:linear-gradient(135deg,var(--gold),var(--gold-light),var(--gold));background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
.hero-sub{font-size:.95rem;font-weight:300;color:rgba(255,255,255,.38);line-height:1.75;max-width:440px;margin-bottom:2.5rem;animation:fadeUp .8s .5s both}
.hero-ctas{display:flex;gap:1rem;flex-wrap:wrap;animation:fadeUp .8s .65s both}
.btn-hp{padding:.85rem 2.4rem;background:var(--gold);color:var(--charcoal);border:none;border-radius:2px;font-family:var(--font-body);font-size:.72rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;cursor:pointer;text-decoration:none;transition:all .3s;display:inline-block}
.btn-hp:hover{background:var(--gold-light);transform:translateY(-2px);box-shadow:0 8px 30px rgba(200,169,110,.22)}
.btn-hg{padding:.85rem 2.4rem;background:transparent;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.55);border-radius:2px;font-family:var(--font-body);font-size:.72rem;font-weight:300;letter-spacing:.15em;text-transform:uppercase;cursor:pointer;text-decoration:none;transition:all .3s;display:inline-block}
.btn-hg:hover{border-color:rgba(200,169,110,.35);color:var(--gold-light)}

/* hero chat mockup */
.hero-right{animation:fadeUp .9s .45s both;display:flex;justify-content:center}
.hero-chat{background:rgba(255,255,255,.04);border:1px solid rgba(200,169,110,.14);border-radius:16px;width:100%;max-width:390px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.06);animation:float 6s ease-in-out infinite 1s}
.chat-hdr{padding:.9rem 1.2rem;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:.65rem}
.chat-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);opacity:.75;box-shadow:0 0 10px rgba(200,169,110,.45)}
.chat-name{font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.chat-online{margin-left:auto;font-size:.62rem;color:rgba(123,166,138,.65);display:flex;align-items:center;gap:.3rem}
.chat-online::before{content:'';width:5px;height:5px;border-radius:50%;background:rgba(123,166,138,.7);display:inline-block}
.chat-body{padding:1.1rem 1.1rem .8rem;display:flex;flex-direction:column;gap:.75rem}
.bubble{padding:.75rem 1rem;border-radius:10px;font-size:.8rem;line-height:1.55;max-width:90%}
.bubble.a{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.62);border-radius:2px 10px 10px 10px}
.bubble.u{background:rgba(200,169,110,.12);border:1px solid rgba(200,169,110,.18);color:rgba(255,255,255,.72);border-radius:10px 2px 10px 10px;margin-left:auto}
.chat-plan{background:rgba(200,169,110,.06);border:1px solid rgba(200,169,110,.14);border-radius:8px;padding:.85rem 1rem}
.chat-plan-lbl{font-size:.58rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(200,169,110,.7);margin-bottom:.55rem}
.chat-plan-row{display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.25rem}
.chat-plan-row span:first-child{color:rgba(255,255,255,.35);font-weight:300}
.chat-plan-row span:last-child{color:rgba(255,255,255,.65);font-weight:500}
.chat-plan-hr{height:1px;background:rgba(255,255,255,.05);margin:.55rem 0}
.chat-macros{display:flex;gap:.45rem}
.chat-macro{flex:1;background:rgba(255,255,255,.03);border-radius:6px;padding:.4rem;text-align:center}
.chat-macro-v{font-size:.78rem;font-weight:500;color:rgba(255,255,255,.65)}
.chat-macro-l{font-size:.58rem;color:rgba(255,255,255,.28);letter-spacing:.04em;margin-top:1px}
.chat-ftr{padding:.7rem 1.1rem;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:.55rem}
.chat-input-fake{flex:1;font-size:.76rem;color:rgba(255,255,255,.18);font-style:italic}
.chat-send{width:26px;height:26px;border-radius:50%;background:rgba(200,169,110,.14);border:1px solid rgba(200,169,110,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.chat-send svg{width:11px;height:11px;color:var(--gold);opacity:.7}

/* scroll cue */
.hero-scroll{position:absolute;bottom:3rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.6rem;z-index:2;animation:fadeUp 1s 1.3s both}
.hero-scroll-line{width:1px;height:40px;background:rgba(200,169,110,.12);position:relative;overflow:hidden}
.hero-scroll-line::after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:var(--gold);animation:scrollLine 2s ease-in-out infinite}
.hero-scroll-text{font-size:.58rem;font-weight:400;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.22)}

/* STATS */
.lp-stats{display:flex;justify-content:center;gap:4rem;flex-wrap:wrap;padding:3.5rem 5%;border-bottom:1px solid rgba(200,169,110,.08);background:var(--cream)}
.lp-stat{text-align:center}
.lp-stat-num{font-family:var(--font-display);font-size:1.8rem;font-weight:600;color:var(--gold)}
.lp-stat-label{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-light);margin-top:.2rem;font-weight:300}

/* section helpers */
.section-label{font-size:.62rem;font-weight:400;letter-spacing:.25em;text-transform:uppercase;color:var(--gold);margin-bottom:.8rem;display:flex;align-items:center;gap:.8rem}
.section-label::before,.section-label::after{content:'';width:24px;height:1px;background:rgba(200,169,110,.3)}
.section-label.left::before,.section-label.left::after{display:none}
.section-label.dim{color:rgba(200,169,110,.65)}
.section-label.dim::before,.section-label.dim::after{background:rgba(200,169,110,.15)}
.section-title{font-family:var(--font-display);font-size:clamp(2rem,4vw,2.8rem);font-weight:400;line-height:1.2;margin-bottom:.8rem;color:var(--charcoal)}
.section-title em{font-style:italic;color:var(--gold)}
.section-title.light{color:rgba(255,255,255,.88)}
.section-title.light em{color:var(--gold-light)}
.section-desc{font-size:.92rem;font-weight:300;color:var(--text-muted);line-height:1.7;max-width:520px}
.section-desc.dim{color:rgba(255,255,255,.35)}

/* FEATURES */
.features{background:var(--white);padding:7rem 5%}
.features-header{text-align:center;margin-bottom:4.5rem}
.features-header .section-label{justify-content:center}
.features-header .section-desc{margin:0 auto}
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;max-width:1100px;margin:0 auto}
.feat-card{padding:2.2rem 1.8rem;background:var(--cream);border:1px solid rgba(200,169,110,.05);border-radius:3px;position:relative;overflow:hidden;transition:border-color .4s,box-shadow .4s}
.feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.4,0,.2,1)}
.feat-card:hover::before{transform:scaleX(1)}
.feat-card:hover{border-color:rgba(200,169,110,.18);box-shadow:0 4px 20px rgba(200,169,110,.08)}
.feat-icon-wrap{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:1.4rem;background:var(--cream-dark);border:1px solid rgba(200,169,110,.07)}
.feat-icon-wrap svg{width:22px;height:22px}
.feat-icon-wrap.gold svg{color:var(--gold)}.feat-icon-wrap.green svg{color:var(--green)}.feat-icon-wrap.muted svg{color:var(--text-light)}
.feat-card h3{font-family:var(--font-display);font-size:1.25rem;font-weight:600;font-style:italic;color:var(--charcoal);margin-bottom:.5rem}
.feat-card p{font-size:.84rem;color:var(--text-muted);line-height:1.65;font-weight:300;margin-bottom:1rem}
.feat-list{list-style:none}
.feat-list li{font-size:.78rem;color:var(--text-light);padding:.22rem 0 .22rem 1rem;position:relative;font-weight:300}
.feat-list li::before{content:'';position:absolute;left:0;top:.52rem;width:4px;height:4px;border-radius:50%;background:var(--gold)}

/* PANTRY */
.pantry-wrap{padding:6rem 5%;background:var(--cream)}
.pantry-section{display:flex;align-items:center;gap:4rem;max-width:1100px;margin:0 auto}
.pantry-text{flex:1}
.pantry-visual{flex:1;display:flex;justify-content:center}
.pantry-mockup{background:var(--white);border:1px solid rgba(200,169,110,.1);border-radius:14px;padding:1.6rem;width:100%;max-width:370px;box-shadow:0 16px 60px rgba(26,26,46,.06)}
.pm-header{font-family:var(--font-display);font-size:1.1rem;font-weight:600;color:var(--charcoal);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.pm-loc{padding:.65rem .9rem;background:var(--cream);border-radius:6px;margin-bottom:.4rem;display:flex;align-items:center;justify-content:space-between}
.pm-loc-name{font-size:.78rem;font-weight:500;color:var(--charcoal)}
.pm-loc-count{font-size:.65rem;color:var(--text-light);font-weight:300}
.pm-chips{display:flex;flex-wrap:wrap;gap:4px;padding:.7rem .9rem;border-top:1px solid rgba(200,169,110,.05)}
.pm-chip{padding:3px 9px;background:var(--green-light);border-radius:20px;font-size:.68rem;color:var(--charcoal);border:1px solid rgba(122,158,126,.1)}

/* TESTIMONIALS */
.testimonials{background:var(--charcoal);padding:5rem 0;overflow:hidden;position:relative}
.testimonials::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,rgba(200,169,110,.15),transparent)}
.testimonials::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,rgba(200,169,110,.15),transparent)}
.testi-head{text-align:center;padding:0 5% 3rem}
.testi-head .section-label{justify-content:center}
.marquee-wrap{overflow:hidden;-webkit-mask:linear-gradient(to right,transparent,black 8%,black 92%,transparent);mask:linear-gradient(to right,transparent,black 8%,black 92%,transparent)}
.marquee-track{display:flex;gap:1.2rem;animation:marquee 38s linear infinite;width:max-content}
.marquee-track:hover{animation-play-state:paused}
.tcard{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:1.3rem 1.5rem;width:270px;flex-shrink:0;transition:background .3s,border-color .3s;cursor:default}
.tcard:hover{background:rgba(255,255,255,.06);border-color:rgba(200,169,110,.15)}
.tcard-stars{display:flex;gap:2px;margin-bottom:.65rem}
.tcard-stars span{font-size:.65rem;color:var(--gold);opacity:.7}
.tcard-text{font-size:.8rem;color:rgba(255,255,255,.48);line-height:1.6;font-weight:300;font-style:italic;margin-bottom:.85rem}
.tcard-author{font-size:.7rem;color:rgba(200,169,110,.55);font-weight:500;letter-spacing:.04em}

/* METHOD */
.method{background:var(--charcoal);padding:7rem 5%;position:relative;overflow:hidden}
.method-orb{position:absolute;border-radius:50%;pointer-events:none;animation:pulseGlow 7s ease-in-out infinite}
.method-orb-1{top:-120px;right:-120px;width:500px;height:500px;background:radial-gradient(circle,rgba(200,169,110,.06) 0%,transparent 70%)}
.method-orb-2{bottom:-150px;left:-100px;width:400px;height:400px;background:radial-gradient(circle,rgba(123,166,138,.04) 0%,transparent 70%);animation-delay:3.5s}
.method-header{text-align:center;margin-bottom:5rem;position:relative;z-index:1}
.method-header .section-desc{margin:0 auto}
.method-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;max-width:1100px;margin:0 auto;position:relative;z-index:1}
.method-card{background:rgba(255,255,255,.025);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(200,169,110,.1);border-radius:12px;padding:2rem 1.5rem;transition:all .4s cubic-bezier(.4,0,.2,1);cursor:default;position:relative;overflow:hidden}
.method-card::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at top left,rgba(200,169,110,.04) 0%,transparent 55%);opacity:0;transition:opacity .4s}
.method-card:hover{background:rgba(255,255,255,.05);border-color:rgba(200,169,110,.22);box-shadow:0 0 40px rgba(200,169,110,.04),inset 0 1px 0 rgba(255,255,255,.06);transform:translateY(-4px)}
.method-card:hover::after{opacity:1}
.method-num{font-family:var(--font-display);font-size:2.5rem;font-weight:400;color:rgba(200,169,110,.15);line-height:1;margin-bottom:1.2rem;transition:color .4s}
.method-card:hover .method-num{color:rgba(200,169,110,.45)}
.method-card h4{font-family:var(--font-display);font-size:1.08rem;font-weight:600;font-style:italic;color:var(--gold-light);margin-bottom:.5rem}
.method-card p{font-size:.79rem;color:rgba(255,255,255,.3);line-height:1.62;font-weight:300}

/* PRICING */
.pricing{background:var(--white);padding:7rem 5%}
.pricing-header{text-align:center;margin-bottom:4rem}
.pricing-header .section-label{justify-content:center}
.pricing-header .section-desc{margin:0 auto}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;max-width:1000px;margin:0 auto}
.price-card{padding:2.5rem 2rem;background:var(--cream);border:1px solid rgba(200,169,110,.05);border-radius:3px;position:relative;transition:box-shadow .4s}
.price-card:hover{box-shadow:0 8px 30px rgba(26,26,46,.08),0 0 0 1px rgba(200,169,110,.1)}
.price-card.featured{background:var(--charcoal);color:var(--white);border:1px solid rgba(200,169,110,.18);box-shadow:0 16px 60px rgba(26,26,46,.15);transform:scale(1.03)}
.price-card.featured:hover{transform:scale(1.05) translateY(-3px)}
.price-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);padding:.25rem .9rem;background:var(--gold);color:var(--charcoal);font-size:.58rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;border-radius:2px}
.price-name{font-family:var(--font-display);font-size:1.25rem;font-weight:600;margin-bottom:.3rem}
.price-card.featured .price-name{color:var(--gold-light)}
.price-desc{font-size:.76rem;color:var(--text-light);margin-bottom:1.5rem;font-weight:300}
.price-card.featured .price-desc{color:rgba(255,255,255,.28)}
.price-amount{font-family:var(--font-display);display:flex;align-items:baseline;gap:.2rem;margin-bottom:.2rem}
.price-currency{font-size:1.1rem;font-weight:400}
.price-number{font-size:2.8rem;font-weight:600;line-height:1}
.price-card.featured .price-number{color:var(--gold-light)}
.price-period{font-size:.68rem;color:var(--text-light);letter-spacing:.05em;margin-bottom:1.5rem;font-weight:300}
.price-card.featured .price-period{color:rgba(255,255,255,.22)}
.price-divider{height:1px;background:rgba(200,169,110,.06);margin-bottom:1.5rem}
.price-card.featured .price-divider{background:rgba(255,255,255,.05)}
.price-features{list-style:none;margin-bottom:2rem}
.price-features li{font-size:.8rem;font-weight:300;color:var(--text-muted);padding:.32rem 0 .32rem 1.2rem;position:relative}
.price-card.featured .price-features li{color:rgba(255,255,255,.42)}
.price-features li::before{content:'';position:absolute;left:0;top:.62rem;width:4px;height:4px;border-radius:50%;background:var(--gold)}
.price-btn{display:block;text-align:center;width:100%;padding:.75rem;border-radius:2px;font-family:var(--font-body);font-size:.7rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;transition:all .3s}
.price-card:not(.featured) .price-btn{background:transparent;border:1px solid rgba(200,169,110,.15);color:var(--text-dark)}
.price-card:not(.featured) .price-btn:hover{background:var(--gold-glow);border-color:var(--gold)}
.price-card.featured .price-btn{background:var(--gold);color:var(--charcoal);border:none}
.price-card.featured .price-btn:hover{background:var(--gold-light)}
.pricing-guarantee{display:flex;align-items:center;justify-content:center;gap:.6rem;margin-top:2.5rem;font-size:.72rem;font-weight:300;color:var(--text-light);letter-spacing:.04em}
.pricing-guarantee svg{flex-shrink:0;opacity:.55}

/* CTA */
.cta-section{text-align:center;padding:7rem 5%;background:var(--charcoal);position:relative;overflow:hidden}
.cta-orb{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:700px;background:radial-gradient(circle,rgba(200,169,110,.05) 0%,transparent 65%);pointer-events:none;animation:pulseGlow 6s ease-in-out infinite}
.cta-section h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);font-weight:400;color:rgba(255,255,255,.88);margin-bottom:.8rem;position:relative;z-index:1}
.cta-section h2 em{font-style:italic;color:var(--gold-light)}
.cta-section p{font-size:.92rem;color:rgba(255,255,255,.28);font-weight:300;margin-bottom:2.5rem;position:relative;z-index:1}
.btn-cta{padding:.88rem 2.6rem;background:var(--gold);color:var(--charcoal);border:none;border-radius:2px;font-family:var(--font-body);font-size:.72rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-decoration:none;transition:all .3s;display:inline-block;position:relative;z-index:1}
.btn-cta:hover{background:var(--gold-light);box-shadow:0 8px 40px rgba(200,169,110,.25);letter-spacing:.18em}
.cta-note{font-size:.65rem;color:rgba(255,255,255,.14);letter-spacing:.06em;margin-top:1rem;position:relative;z-index:1}

/* FOOTER */
.lp-footer{background:#111115;color:rgba(255,255,255,.5);padding:4rem 5% 2rem;border-top:1px solid rgba(255,255,255,.04)}
.footer-top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:2rem;margin-bottom:3rem}
.footer-brand{max-width:280px}
.footer-brand .nav-logo{color:var(--white);display:inline-block;margin-bottom:.8rem}
.footer-tagline{font-size:.8rem;line-height:1.6;color:rgba(255,255,255,.2);font-weight:300}
.footer-links h5{font-size:.62rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:rgba(200,169,110,.5);margin-bottom:.8rem}
.footer-links a{display:block;font-size:.78rem;color:rgba(255,255,255,.25);text-decoration:none;padding:.2rem 0;transition:color .3s;font-weight:300}
.footer-links a:hover{color:var(--gold-light)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.04);padding-top:1.5rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem;font-size:.65rem;color:rgba(255,255,255,.14);font-weight:300}

/* HAMBURGER */
.hamburger{display:none;background:none;border:none;cursor:pointer;padding:6px;z-index:1001}
.hamburger-line{display:block;width:22px;height:1.5px;margin:5px 0;background:rgba(255,255,255,.7);transition:all .4s cubic-bezier(.4,0,.2,1);transform-origin:center}
.lp-nav.scrolled .hamburger-line{background:var(--charcoal)}
.hamburger.open .hamburger-line:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
.hamburger.open .hamburger-line:nth-child(2){opacity:0;transform:scaleX(0)}
.hamburger.open .hamburger-line:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
.mobile-menu{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(26,26,30,.97);backdrop-filter:blur(24px);padding:5.5rem 2rem 2.5rem;z-index:999;transform:translateY(-100%);transition:transform .5s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column}
.mobile-menu.open{transform:translateY(0)}
.mobile-menu a{display:block;font-family:var(--font-body);font-size:.85rem;font-weight:300;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);text-decoration:none;padding:1.1rem 0;border-bottom:1px solid rgba(200,169,110,.08);transition:color .3s}
.mobile-menu a:hover{color:var(--gold-light)}
.mobile-menu .nav-cta{display:inline-block;margin-top:1.5rem;padding:.75rem 2rem;background:var(--gold);color:var(--charcoal)!important;border-radius:2px;font-weight:500;text-align:center;border-bottom:none}

/* RESPONSIVE */
@media(min-width:601px){.hamburger{display:none!important}.mobile-menu{display:none!important}}
@media(max-width:1024px){.hero-container{grid-template-columns:1fr}.hero-right{display:none}.hero-label{justify-content:center}.hero-sub{margin-left:auto;margin-right:auto;text-align:center}.hero-ctas{justify-content:center}.hero h1{text-align:center}}
@media(max-width:900px){.features-grid{grid-template-columns:1fr;gap:1rem}.method-grid{grid-template-columns:1fr 1fr}.pricing-grid{grid-template-columns:1fr;max-width:400px;margin:0 auto}.price-card.featured{transform:none}.pantry-section{flex-direction:column;gap:2rem}}
@media(max-width:600px){.hamburger{display:block}.nav-links{display:none}.hero h1{font-size:2.4rem}.method-grid{grid-template-columns:1fr}.lp-stats{gap:2rem}}

/* TRIAL BANNER */
.trial-banner{background:var(--cream-warm);border:1px solid rgba(200,169,110,.14);border-radius:6px;padding:1.4rem 2rem;max-width:1000px;margin:0 auto 2.5rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
.trial-badge-lbl{display:inline-block;padding:.22rem .75rem;background:var(--gold);color:var(--charcoal);font-size:.6rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;border-radius:2px;margin-bottom:.4rem}
.trial-banner-text p{font-size:.83rem;color:var(--text-muted);font-weight:300;line-height:1.5;margin:0}
.btn-trial{padding:.72rem 1.8rem;background:var(--charcoal);color:var(--white);border-radius:2px;font-family:var(--font-body);font-size:.68rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;transition:all .3s;white-space:nowrap;flex-shrink:0;display:inline-block}
.btn-trial:hover{background:var(--charcoal-soft);transform:translateY(-1px);box-shadow:0 4px 16px rgba(26,26,46,.15)}
@media(max-width:600px){.trial-banner{flex-direction:column;text-align:center}.btn-trial{width:100%;text-align:center}}
`;

const TESTIMONIALS = [
  { text: "Nunca antes había mantenido una dieta más de dos semanas. Con KYŌRA ya llevo 6 meses y no lo siento como dieta.", author: "Martín V. — Monterrey" },
  { text: "Bajé 8 kg en 3 meses siguiendo el plan de KYŌRA. Nunca pensé que fuera tan fácil mantener la constancia.", author: "Valeria M. — Ciudad de México" },
  { text: "Como madre de familia necesitaba algo que se adaptara a MI tiempo y MI cocina. KYŌRA lo entendió.", author: "Sofía H. — Guadalajara" },
  { text: "Las recetas con lo que tengo en casa me cambiaron la vida. Sin desperdicios, sin excusas, sin estrés.", author: "Ana P. — Bogotá" },
  { text: "Logré mi objetivo de masa muscular en 4 meses. El plan de ejercicios es increíblemente personalizado.", author: "Diego L. — Miami" },
  { text: "Por primera vez, una app de nutrición entiende mis restricciones alimentarias sin que tenga que explicarlas cada vez.", author: "Carlos R. — Buenos Aires" },
];

export default function LandingPage() {
  const navRef = useRef(null);
  const wrapRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => navRef.current?.classList.toggle("scrolled", window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = wrapRef.current?.querySelectorAll(".reveal");
    if (!els?.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <>
      <style>{css}</style>
      <div className="lp-wrap" ref={wrapRef}>

        {/* ── NAV ── */}
        <nav className="lp-nav" ref={navRef}>
          <a href="#" className="nav-logo">KY<span className="ac">Ō</span>RA</a>
          <ul className="nav-links">
            <li><a href="#features">Servicios</a></li>
            <li><a href="#method">Método</a></li>
            <li><a href="#pricing">Planes</a></li>
            <li><Link to="/app/login">Iniciar sesión</Link></li>
            <li><Link to="/app/login" className="nav-cta">Empezar gratis</Link></li>
          </ul>
          <button className={`hamburger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menú" aria-expanded={menuOpen}>
            <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
          </button>
        </nav>
        <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Servicios</a>
          <a href="#method" onClick={() => setMenuOpen(false)}>Método</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Planes</a>
          <Link to="/app/login" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
          <Link to="/app/login" className="nav-cta" onClick={() => setMenuOpen(false)}>Empezar gratis</Link>
        </div>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-mesh" />
          <div className="hero-vline" style={{ left: "5%" }} />
          <div className="hero-vline" style={{ right: "5%" }} />
          <div className="hero-container">
            <div className="hero-left">
              <div className="hero-label">
                <span className="hero-label-line" />
                <span className="hero-label-text">Nutrición potenciada por IA</span>
                <span className="hero-label-line" />
              </div>
              <h1>Nutrición que<br /><em>entiende quién eres</em></h1>
              <p className="hero-sub">Tu agente de IA crea planes de nutrición y ejercicio adaptados a tu perfil real — y los ajusta cada semana según cómo avanza tu cuerpo.</p>
              <div className="hero-ctas">
                <Link to="/app/login" className="btn-hp">Empezar gratis · 7 días</Link>
                <a href="#method" className="btn-hg">Ver cómo funciona</a>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-chat">
                <div className="chat-hdr">
                  <div className="chat-dot" />
                  <span className="chat-name">KYŌRA</span>
                  <span className="chat-online">en línea</span>
                </div>
                <div className="chat-body">
                  <div className="bubble a">¡Hola! Soy tu agente nutricional personalizado. ¿Cuál es tu objetivo principal?</div>
                  <div className="bubble u">Quiero perder peso y mejorar mi energía</div>
                  <div style={{ padding: "0 0 0 0" }}>
                    <div className="bubble a" style={{ marginBottom: ".6rem" }}>Perfecto. Con tu perfil diseñé tu plan inicial:</div>
                    <div className="chat-plan">
                      <div className="chat-plan-lbl">Plan diseñado para ti</div>
                      <div className="chat-plan-row"><span>Objetivo</span><span>−5 kg / 10 semanas</span></div>
                      <div className="chat-plan-row"><span>Calorías diarias</span><span>1,650 kcal</span></div>
                      <div className="chat-plan-hr" />
                      <div className="chat-macros">
                        <div className="chat-macro"><div className="chat-macro-v">130g</div><div className="chat-macro-l">Proteína</div></div>
                        <div className="chat-macro"><div className="chat-macro-v">165g</div><div className="chat-macro-l">Carbos</div></div>
                        <div className="chat-macro"><div className="chat-macro-v">55g</div><div className="chat-macro-l">Grasas</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chat-ftr">
                  <span className="chat-input-fake">Pregúntame lo que quieras...</span>
                  <div className="chat-send">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-scroll">
            <div className="hero-scroll-line" />
            <span className="hero-scroll-text">Explorar</span>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="lp-stats reveal">
          <div className="lp-stat"><div className="lp-stat-num">24/7</div><div className="lp-stat-label">Tu coach, siempre disponible</div></div>
          <div className="lp-stat"><div className="lp-stat-num">&lt;2min</div><div className="lp-stat-label">De tu perfil a tu primer plan</div></div>
          <div className="lp-stat"><div className="lp-stat-num">7 días</div><div className="lp-stat-label">De prueba gratis — cancela y no pagas</div></div>
          <div className="lp-stat"><div className="lp-stat-num">$0</div><div className="lp-stat-label">Cobrado si cancelas antes del día 8</div></div>
        </div>

        {/* ── FEATURES ── */}
        <section className="features" id="features">
          <div className="features-header">
            <div className="section-label reveal">Lo que KYŌRA hace por ti</div>
            <h2 className="section-title reveal">Tres cosas que ninguna app<br />de dieta <em>hace</em></h2>
            <p className="section-desc reveal">Un agente que conoce tu cocina, calcula tus macros y se ajusta cuando tu cuerpo avanza. Todo sin que tengas que pensar demasiado.</p>
          </div>
          <div className="features-grid">
            <div className="feat-card reveal">
              <div className="feat-icon-wrap gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75"/></svg>
              </div>
              <h3>Tu plan, recalculado cada semana</h3>
              <p>Planes alimenticios adaptados a tu metabolismo, preferencias y objetivos. Actualizados en tiempo real según tu progreso.</p>
              <ul className="feat-list"><li>Plan de comidas personalizado semanal</li><li>Ajuste dinámico de macronutrientes</li><li>Recetas adaptadas a tus gustos</li><li>Soporte para alergias y restricciones</li></ul>
            </div>
            <div className="feat-card reveal reveal-d1">
              <div className="feat-icon-wrap green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h3>Rutinas que van contigo</h3>
              <p>Rutinas de ejercicio diseñadas para complementar tu plan nutricional y maximizar tus resultados de forma segura.</p>
              <ul className="feat-list"><li>Rutinas para casa o gimnasio</li><li>Progresión inteligente de cargas</li><li>Adaptación según energía y recuperación</li><li>Sincronizado con tu plan nutricional</li></ul>
            </div>
            <div className="feat-card reveal reveal-d2">
              <div className="feat-icon-wrap muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </div>
              <h3>Tu agente no te pierde de vista</h3>
              <p>Tu agente de IA monitorea tu progreso 24/7 y ajusta tu plan para que cada semana sea mejor que la anterior.</p>
              <ul className="feat-list"><li>Dashboard personal de progreso</li><li>Check-ins semanales con tu agente</li><li>Alertas inteligentes y motivación</li><li>Reportes mensuales detallados</li></ul>
            </div>
          </div>
        </section>

        {/* ── PANTRY ── */}
        <section className="pantry-wrap">
          <div className="pantry-section reveal">
            <div className="pantry-text">
              <div className="section-label left">Función exclusiva</div>
              <h2 className="section-title">Tu despensa,<br />nuestro <em>ingrediente secreto</em></h2>
              <p className="section-desc" style={{ marginBottom: "1.5rem" }}>Abre tu refrigerador. Eso es suficiente. KYŌRA convierte lo que ya tienes en recetas balanceadas — sin tener que salir al súper.</p>
              <p className="section-desc" style={{ fontSize: ".84rem" }}>
                <span style={{ color: "var(--green)" }}>✓</span> Organiza por ubicación — alacena, refrigerador, congelador<br />
                <span style={{ color: "var(--green)" }}>✓</span> Agrega ingredientes en segundos<br />
                <span style={{ color: "var(--green)" }}>✓</span> Recetas que priorizan lo que ya tienes<br />
                <span style={{ color: "var(--green)" }}>✓</span> Lista de compras inteligente para lo que te falta
              </p>
            </div>
            <div className="pantry-visual">
              <div className="pantry-mockup">
                <div className="pm-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                  Mi Despensa
                </div>
                {[["Alacena","12 ingredientes"],["Refrigerador","7 ingredientes"],["Congelador","4 ingredientes"],["Frutas y Verduras","8 ingredientes"]].map(([name, count]) => (
                  <div key={name} className="pm-loc">
                    <span className="pm-loc-name">{name}</span>
                    <span className="pm-loc-count">{count}</span>
                  </div>
                ))}
                <div className="pm-chips">
                  {["Aguacate","Quinoa","Pollo","Espinaca","Huevos","Limón","Salmón","Avena"].map(i => (
                    <span key={i} className="pm-chip">{i}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="testimonials">
          <div className="testi-head">
            <div className="section-label dim reveal">Lo que dicen nuestros usuarios</div>
            <h2 className="section-title light reveal">Resultados que <em>hablan</em></h2>
          </div>
          <div className="marquee-wrap">
            <div className="marquee-track">
              {doubled.map((t, i) => (
                <div key={i} className="tcard">
                  <div className="tcard-stars">{"★★★★★".split("").map((s, j) => <span key={j}>{s}</span>)}</div>
                  <p className="tcard-text">"{t.text}"</p>
                  <div className="tcard-author">{t.author}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── METHOD ── */}
        <section className="method" id="method">
          <div className="method-orb method-orb-1" />
          <div className="method-orb method-orb-2" />
          <div className="method-header">
            <div className="section-label dim reveal">Nuestro Método</div>
            <h2 className="section-title light reveal">De tu perfil a un plan real<br /><em>en minutos</em></h2>
            <p className="section-desc dim reveal">Cuatro pasos. Del "no sé por dónde empezar" a un plan que ya funciona hoy.</p>
          </div>
          <div className="method-grid">
            {[
              ["I",  "Evaluación", "Completas un análisis integral: hábitos, objetivos, historial médico y preferencias alimentarias."],
              ["II", "Diseño",     "Tu agente de IA crea un plan personalizado de nutrición y ejercicio basado en tu perfil único."],
              ["III","Acción",     "Sigues tu plan con guía constante, recetas detalladas y rutinas claras cada día."],
              ["IV", "Evolución",  "Tu plan se mueve cuando tú te mueves. Lo que funcionó la semana pasada se ajusta para que esta semana sea mejor."],
            ].map(([num, title, desc], i) => (
              <div key={num} className={`method-card reveal${i > 0 ? ` reveal-d${i}` : ""}`}>
                <div className="method-num">{num}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="pricing" id="pricing">
          <div className="pricing-header">
            <div className="section-label reveal">Planes</div>
            <h2 className="section-title reveal">Una inversión en ti.<br /><em>Que se nota desde el día uno.</em></h2>
            <p className="section-desc reveal">7 días de prueba para empezar. Después, desde $499 MXN/mes. Cancela cuando quieras.</p>
          </div>
          {/* Trial Banner */}
          <div className="trial-banner reveal">
            <div className="trial-banner-text">
              <div className="trial-badge-lbl">7 días gratis</div>
              <p>Acceso completo al plan Esencial. Se requiere tarjeta — cancela antes del día 8 y no se cobra nada.</p>
            </div>
            <Link to="/app/login" className="btn-trial">Comenzar gratis ahora</Link>
          </div>

          <div className="pricing-grid">
            <div className="price-card reveal">
              <div className="price-name">Esencial</div>
              <div className="price-desc">Todo lo que necesitas para transformar tu alimentación</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-number">{mxNum(PLANS[0])}</span></div>
              <div className="price-period">MXN / mes</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>Coach KYŌRA disponible 24/7</li><li>Plan semanal personalizado con macros</li><li>Lista de compras automática</li><li>Descarga tu plan en PDF</li><li>Análisis semanal de tu progreso</li><li>Mi Despensa — cocina con lo que tienes</li>
              </ul>
              <Link to="/app/login" className="price-btn">Crear mi plan</Link>
            </div>
            <div className="price-card featured reveal reveal-d1">
              <div className="price-badge">Más popular</div>
              <div className="price-name">Premium</div>
              <div className="price-desc">Nutrición, entrenamiento y familia — todo en un solo plan</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-number">{mxNum(PLANS[1])}</span></div>
              <div className="price-period">MXN / mes</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>Todo lo del Esencial</li><li>Rutina de entrenamiento semanal adaptada a tu plan</li><li>Historial de tus últimas 8 semanas de planes</li><li>Plan familiar — hasta 2 perfiles adicionales</li><li>Acceso prioritario a nuevas funciones</li>
              </ul>
              <Link to="/app/login" className="price-btn">Empezar mi transformación</Link>
            </div>
            <div className="price-card reveal reveal-d2">
              <div className="price-name">Élite</div>
              <div className="price-desc">La precisión de la IA con respaldo humano certificado</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-number">{mxNum(PLANS[2])}</span></div>
              <div className="price-period">MXN / mes</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>Todo lo del Premium</li><li>Videollamada mensual con nutriólogo certificado</li><li>Plan ajustado por un experto cada mes</li><li>Ideal si tienes condiciones de salud específicas</li><li>Atención prioritaria</li>
              </ul>
              <Link to="/app/login" className="price-btn">Acceder a Élite</Link>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section" id="start">
          <div className="cta-orb" />
          <h2 className="reveal">Tu mejor versión empieza<br />en tu <em>cocina</em></h2>
          <p className="reveal">7 días gratis para comprobar lo que KYŌRA puede hacer por ti. Cancela antes del día 8 y no pagas nada.</p>
          <Link to="/app/login" className="btn-cta reveal">Empezar gratis · 7 días</Link>
          <p className="cta-note reveal">Se requiere tarjeta. Cancela antes del día 8 y no se cobra nada.</p>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="#" className="nav-logo">KY<span className="ac">Ō</span>RA</a>
              <p className="footer-tagline">Nutrición inteligente para una vida extraordinaria. Potenciado por IA, respaldado por ciencia.</p>
            </div>
            <div className="footer-links"><h5>Compañía</h5><a href="#">Sobre nosotros</a><a href="#">Ciencia</a><a href="#">Blog</a><a href="#">Carreras</a></div>
            <div className="footer-links"><h5>Soporte</h5><a href="#">Centro de ayuda</a><a href="#">Contacto</a><a href="#">Privacidad</a><a href="#">Términos</a></div>
            <div className="footer-links"><h5>Síguenos</h5><a href="#">Instagram</a><a href="#">LinkedIn</a><a href="#">Twitter / X</a></div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 KYŌRA. Todos los derechos reservados.</span>
            <span>KYŌRA no reemplaza asesoría médica profesional.</span>
          </div>
        </footer>

      </div>
    </>
  );
}
