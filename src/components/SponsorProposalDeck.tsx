import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  TrendingUp,
  Users,
  ShieldCheck,
  CheckCircle2,
  Award,
  Globe,
  Wallet,
  Coins,
  ArrowRight,
  Printer,
  Sparkles,
  Download,
  Share2,
  Lock,
  Layers,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Mail,
  FileText,
  BadgeCheck,
  Zap,
  Target,
  BarChart4,
  ExternalLink,
  X,
  Car,
  Home,
  Tv,
  Smartphone,
  Gift,
  HelpCircle,
  FileDown,
} from 'lucide-react';

interface SponsorProposalDeckProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSponsorName?: string;
}

export const SponsorProposalDeck: React.FC<SponsorProposalDeckProps> = ({
  isOpen,
  onClose,
  defaultSponsorName = 'Strategic Corporate Partner',
}) => {
  const [lang, setLang] = useState<'en' | 'am'>('am'); // Default to authentic Amharic for Ethiopian corporations
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sponsorName, setSponsorName] = useState<string>(defaultSponsorName);
  const [viewMode, setViewMode] = useState<'paginated' | 'full'>('paginated');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Direct client-side PDF / Standalone Document Downloader
  const handleDirectDownloadPdf = () => {
    setIsExporting(true);
    try {
      const activeLanguageTitle = lang === 'am' ? 'የስፖንሰርሺፕ_እና_የቢዝነስ_አጋርነት_ይፋዊ_ጥሪ' : 'MiniBid_Executive_Sponsorship_Proposal';
      const cleanSponsor = sponsorName.replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, '_');
      const filename = `${activeLanguageTitle}_${cleanSponsor}.html`;

      const pages = document.querySelectorAll('.proposal-page-content');
      let combinedPagesHtml = '';
      pages.forEach(p => {
        combinedPagesHtml += `<div class="printable-sheet">${p.innerHTML}</div><div class="page-break"></div>`;
      });

      const fullHtmlDocument = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${lang === 'am' ? 'ሚኒቢድ - ይፋዊ የስፖንሰርሺፕ እና የቢዝነስ አጋርነት ጥሪ' : 'MiniBid - Strategic Sponsorship & Showcase Proposal'} - ${sponsorName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Ethiopic:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 1.2cm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Noto Sans Ethiopic', 'Plus Jakarta Sans', sans-serif; background: #0A1128; color: #111827; margin: 0; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { font-family: 'Cinzel', 'Noto Sans Ethiopic', serif; }
    .printable-sheet { padding: 36px 40px; margin-bottom: 30px; border: 2px solid #D4AF37; border-radius: 16px; background: #ffffff; color: #0F172A; box-shadow: 0 10px 30px rgba(0,0,0,0.15); position: relative; }
    .gold-header-bar { height: 6px; background: linear-gradient(90deg, #D4AF37, #F3C34F, #B38F26); border-radius: 4px; margin-bottom: 24px; }
    .navy-badge { display: inline-block; padding: 4px 12px; background: #0A1128; color: #D4AF37; font-size: 11px; font-weight: 800; border-radius: 6px; border: 1px solid #D4AF37; text-transform: uppercase; letter-spacing: 1px; }
    .highlight-card { background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 8px; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #CBD5E1; padding: 10px 14px; font-size: 12px; text-align: left; }
    th { background: #0A1128; color: #D4AF37; font-weight: 700; }
    .page-break { page-break-after: always; break-after: page; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .printable-sheet { border: 1px solid #D4AF37; padding: 24px; margin-bottom: 0; border-radius: 0; box-shadow: none; page-break-after: always; break-after: page; }
      .page-break { page-break-after: always; break-after: page; height: 0; }
    }
  </style>
</head>
<body onload="window.print()">
  ${combinedPagesHtml}
</body>
</html>`;

      const blob = new Blob([fullHtmlDocument], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(fullHtmlDocument);
        printWindow.document.close();
      }
    } catch {
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:overflow-visible">
      <div className="relative w-full max-w-5xl bg-[#080d1a] border-2 border-[#D4AF37]/60 rounded-3xl shadow-2xl flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full print:bg-white text-zinc-100 print:text-black">
        
        {/* Top Control Bar (Super Admin Only) */}
        <header className="px-5 py-4 border-b border-[#D4AF37]/30 bg-[#0B132B] rounded-t-3xl flex flex-wrap items-center justify-between gap-3 print:hidden shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#F3C34F] to-[#997920] p-0.5 flex items-center justify-center shadow-lg shadow-amber-950/40">
              <div className="w-full h-full bg-[#0A1128] rounded-[14px] flex items-center justify-center font-serif font-black text-[#D4AF37] text-base">
                MB
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-white text-base tracking-wide">
                  {lang === 'am' ? 'ሚኒቢድ ኢትዮጵያ' : 'MiniBid Ethiopia'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-mono font-bold text-[10px] uppercase tracking-wider border border-[#D4AF37]/50">
                  {lang === 'am' ? 'የቦርድ ይፋዊ ጥሪ' : 'Boardroom Prospectus'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-amber-200/80 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40">
                  <Lock className="w-3 h-3 text-[#D4AF37]" />
                  {lang === 'am' ? 'ሱፐር አድሚን ብቻ • ሚስጥራዊ' : 'Super Admin Only • Confidential'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">
                {lang === 'am'
                  ? 'የስፖንሰርሺፕ እና የባለ 1-ምርት ሎተሪ አጋርነት ይፋዊ ሰነድ (4 ገጾች)'
                  : 'Executive 1-Product Showcase Lottery Sponsorship Proposal (4 Pages)'}
              </p>
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Switcher (Amharic / English) */}
            <div className="bg-[#0A1128] p-1 rounded-xl border border-[#D4AF37]/40 flex items-center text-xs font-mono shadow-inner">
              <button
                type="button"
                onClick={() => setLang('am')}
                className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                  lang === 'am'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                አማርኛ (Amharic)
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                  lang === 'en'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-[#0A1128] p-1 rounded-xl border border-[#D4AF37]/30 hidden sm:flex items-center text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('paginated')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  viewMode === 'paginated'
                    ? 'bg-[#1E293B] text-[#D4AF37] font-bold border border-[#D4AF37]/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'am' ? 'ገጽ በገጽ' : 'Paged'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  viewMode === 'full'
                    ? 'bg-[#1E293B] text-[#D4AF37] font-bold border border-[#D4AF37]/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'am' ? 'ሙሉ 4 ገጽ' : 'Full (4 Pages)'}
              </button>
            </div>

            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDirectDownloadPdf}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#B38F26] hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50"
              title="Download standalone PDF document file"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{lang === 'am' ? 'PDF አውርድ' : 'Download PDF'}</span>
            </button>

            {/* Native Print Dialog */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-[#0A1128] hover:bg-[#1E293B] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-[#D4AF37]/40"
              title="Print document or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden xs:inline">{lang === 'am' ? 'አትም' : 'Print'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sponsor Customization & Sector Presets Ribbon */}
        <div className="px-5 py-3 bg-gradient-to-r from-[#0A1128] via-[#0F1B3B] to-[#0A1128] border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#D4AF37] font-mono font-bold">
              {lang === 'am' ? 'የዒላማ ኩባንያ / ስፖንሰር ስም፦' : 'Target Partner Organization:'}
            </span>
            <input
              type="text"
              value={sponsorName}
              onChange={e => setSponsorName(e.target.value)}
              placeholder="e.g. Belayab, Noah, Samsung, Telebirr, CBE..."
              className="bg-[#060A17] border border-[#D4AF37]/60 focus:border-[#D4AF37] rounded-lg px-3 py-1.5 text-xs text-amber-200 font-bold focus:outline-none w-56 sm:w-72 shadow-inner"
            />
          </div>

          {/* Ethiopian Industry Presets */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 flex-wrap">
            <span className="text-[#D4AF37] font-semibold">{lang === 'am' ? 'የዘርፍ ምሳሌዎች፦' : 'Sector Presets:'}</span>
            <button
              type="button"
              onClick={() => {
                setSponsorName(lang === 'am' ? 'በላይአብ ሞተርስ / የኤሌክትሪክ ተሽከርካሪ አምራቾች' : 'Belayab Motors / EV Assemblers');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0F1B3B] hover:bg-[#1A2C5B] text-zinc-200 border border-[#D4AF37]/30 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Car className="w-3 h-3 text-[#D4AF37]" />
              <span>{lang === 'am' ? 'መኪና' : 'Auto/EV'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSponsorName(lang === 'am' ? 'ኖህ ሪል እስቴት አልሚ ኩባንያ' : 'Noah Real Estate Developers');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0F1B3B] hover:bg-[#1A2C5B] text-zinc-200 border border-[#D4AF37]/30 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Home className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'am' ? 'ሪል እስቴት' : 'Real Estate'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSponsorName(lang === 'am' ? 'ሳምሰንግ ኢትዮጵያ ኤሌክትሮኒክስ' : 'Samsung Ethiopia Electronics');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0F1B3B] hover:bg-[#1A2C5B] text-zinc-200 border border-[#D4AF37]/30 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Tv className="w-3 h-3 text-blue-400" />
              <span>{lang === 'am' ? 'ኤሌክትሮኒክስ' : 'Electronics'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSponsorName(lang === 'am' ? 'ኢትዮ ቴሌኮም እና ቴሌብር' : 'Ethio Telecom & Telebirr');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0F1B3B] hover:bg-[#1A2C5B] text-zinc-200 border border-[#D4AF37]/30 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Smartphone className="w-3 h-3 text-purple-400" />
              <span>{lang === 'am' ? 'ቴሌብር' : 'Telebirr'}</span>
            </button>
          </div>
        </div>

        {/* Paginated Navigation Tabs (Screen Only) */}
        {viewMode === 'paginated' && (
          <div className="px-5 py-2.5 bg-[#060A17] border-b border-[#D4AF37]/20 flex items-center justify-between gap-2 overflow-x-auto print:hidden">
            <div className="flex items-center gap-2">
              {[
                { num: 1, label: lang === 'am' ? 'ገጽ 1፦ ራዕይ፣ የገበያ ዕድል እና ብሔራዊ ኢኮኖሚ' : 'Page 1: The Vision & National Economic Alignment' },
                { num: 2, label: lang === 'am' ? 'ገጽ 2፦ የጎልማሶች የስራ ዕድል ፈጠራ (500+ ስራ)' : 'Page 2: Adult Employment & Jobs Creation' },
                { num: 3, label: lang === 'am' ? 'ገጽ 3፦ የባለ 1-ምርት ስፖንሰርሺፕ ሞዴል እና 20x ትርፍ' : 'Page 3: 1-Product Showcase Lottery Deal & ROI' },
                { num: 4, label: lang === 'am' ? 'ገጽ 4፦ የአጋርነት ደረጃዎች፣ ህጋዊ አሰራር እና ፊርማ' : 'Page 4: Partnership Tiers, Governance & Signing' },
              ].map(tab => (
                <button
                  key={tab.num}
                  type="button"
                  onClick={() => setCurrentPage(tab.num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    currentPage === tab.num
                      ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-extrabold shadow-md'
                      : 'bg-[#0B132B] text-zinc-400 hover:text-white border border-[#D4AF37]/30'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-mono">
                    {tab.num}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-[#D4AF37]/30 bg-[#0B132B] text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-[#D4AF37] px-2 font-bold">
                {lang === 'am' ? `ገጽ ${currentPage} ከ 4` : `Page ${currentPage} of 4`}
              </span>
              <button
                type="button"
                disabled={currentPage === 4}
                onClick={() => setCurrentPage(prev => Math.min(4, prev + 1))}
                className="p-1.5 rounded-lg border border-[#D4AF37]/30 bg-[#0B132B] text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Proposal Document Body (Boardroom Luxury Gold & Navy Aesthetic) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 space-y-12 print:overflow-visible print:p-0 print:space-y-0">
          
          {/* =========================================================================
              PAGE 1: THE VISION, MARKET OPPORTUNITY & NATIONAL ECONOMIC ALIGNMENT
              ========================================================================= */}
          {(viewMode === 'full' || currentPage === 1) && (
            <section className="proposal-page p-6 sm:p-10 rounded-2xl bg-[#0A1128] border-2 border-[#D4AF37]/70 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-8 print:break-after-page">
              <div className="proposal-page-content">
                {/* Boardroom Header Letterhead */}
                <div className="border-b-2 border-[#D4AF37] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37] font-black flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>{lang === 'am' ? 'ይፋዊ የስትራቴጂክ ሽርክና ጥሪ • ሚስጥራዊ' : 'STRATEGIC PARTNERSHIP PROSPECTUS • CONFIDENTIAL'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white print:text-[#0A1128] tracking-tight">
                      {lang === 'am'
                        ? 'የተጠቃሚዎችን ፍላጎት የሚያስተዋውቅ ዘመናዊ የዲጂታል ግብይት እና የስፖንሰርሺፕ ጥሪ'
                        : 'Next-Generation Dynamic Micro-Commerce & Product Showcase Partnership'}
                    </h1>
                    <p className="text-xs text-zinc-300 print:text-zinc-600 mt-1.5 font-mono">
                      {lang === 'am' ? 'የቀረበው ለተከበሩ ዋና ስራ አስፈጻሚ እና የስራ አመራር ቦርድ አባላት፦ ' : 'Presented Exclusively to the CEO & Executive Leadership at: '}
                      <strong className="text-[#D4AF37] print:text-[#0A1128] text-sm">{sponsorName}</strong>
                    </p>
                  </div>
                  <div className="text-right sm:border-l sm:border-[#D4AF37]/40 sm:pl-6 shrink-0">
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 uppercase font-semibold">
                      {lang === 'am' ? 'የሰነድ ማጣቀሻ ቁጥር' : 'Dossier Reference'}
                    </div>
                    <div className="font-mono text-xs font-bold text-[#D4AF37] print:text-[#0A1128]">MINIBID-SPON-2026</div>
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 mt-0.5">
                      {new Date().toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* 1.1 Executive Address & Market Opportunity */}
                <div className="mt-8">
                  <h2 className="text-lg font-serif font-bold text-[#D4AF37] print:text-[#0A1128] flex items-center gap-2 border-b border-[#D4AF37]/30 pb-2">
                    <Award className="w-5 h-5 text-[#D4AF37]" />
                    <span>{lang === 'am' ? '1.0 የገበያው ሁኔታ እና ትልቁ የቢዝነስ ዕድል' : '1.0 The Market Reality & The Unlocked Opportunity'}</span>
                  </h2>
                  <p className="text-sm text-zinc-200 print:text-zinc-800 mt-3.5 leading-relaxed">
                    {lang === 'am'
                      ? 'ክቡር/ት ዋና ስራ አስፈጻሚ፤ በኢትዮጵያ ከ45 ሚሊዮን በላይ የሞባይል ገንዘብ ተጠቃሚዎች እና በርካታ ወጣት ስማርት ስልክ ተጠቃሚዎች ባሉበት በአሁኑ ወቅት፣ ባህላዊው የንግድ ዘይቤ ከፍተኛ እንቅፋት ገጥሞታል። አብዛኛው የህብረተሰብ ክፍል እንደ መኪና፣ ዘመናዊ ስልኮች፣ የቤት እቃዎች እና የመኖሪያ ቤቶች የመሳሰሉ ከፍተኛ ዋጋ ያላቸውን ምርቶች በአንድ ጊዜ በጥሬ ገንዘብ መግዛት አይችልም።'
                      : 'Dear Chief Executive & Leadership Team; Ethiopia’s consumer retail market has arrived at a structural turning point. While mobile money adoption has crossed 45 million active accounts, traditional commerce remains constrained by lump-sum purchasing power. Millions of aspiring consumers admire your flagship vehicles, residential homes, and electronics, but cannot mobilize hundreds of thousands of Birr upfront.'}
                  </p>
                  <p className="text-sm text-zinc-200 print:text-zinc-800 mt-2.5 leading-relaxed">
                    {lang === 'am'
                      ? 'ሚኒቢድ (MiniBid) ዘመናዊ እና ግልጽ የቴክኖሎጂ አሰራርን በመጠቀም ተጠቃሚዎች በትንሽ ተሳትፎ (ከ10 እስከ 50 ብር) ከፍተኛ ዋጋ ያላቸውን ምርቶች በፍትሃዊ መንገድ እንዲያገኙ የሚያስችል የፈጠራ ስራ ነው። ይህም ለስፖንሰር አድራጊ ኩባንያዎች ምርቶቻቸውን በመላው ሀገሪቱ በሚገኙ በመቶ ሺዎች በሚቆጠሩ ንቁ ደንበኞች ፊት በከፍተኛ ድምቀት እንዲተዋወቁ እና ተደራሽ እንዲሆኑ ያደርጋል።'
                      : 'MiniBid introduces a proprietary Dynamic Micro-Commerce marketplace. Through accessible micro-participation tiers (e.g. 10 to 50 ETB), everyday citizens actively compete for luxury and essential assets, while generating massive daily digital transaction turnover for our partner brands.'}
                  </p>
                </div>

                {/* 1.2 Protected Intellectual Property Guarantee */}
                <div className="mt-6 p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-100 border border-[#D4AF37]/50 print:border-slate-300">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] print:text-amber-800 uppercase font-black mb-1.5">
                    <Lock className="w-4 h-4" />
                    <span>{lang === 'am' ? 'የተጠበቀ የቴክኖሎጂ እና የአሰራር ምስጢር (IP Safeguarded)' : 'Proprietary Sealed Architecture (IP Safeguarded)'}</span>
                  </div>
                  <p className="text-xs text-zinc-300 print:text-zinc-700 leading-relaxed">
                    {lang === 'am'
                      ? 'የሚኒቢድ የውስጥ የሂሳብ ቀመር እና የስርዓት አሰራር በልዩ ጥበቃ የተደረገለት የፈጠራ ውጤት (Black-Box Intellectual Property) ነው። ይኸውም ተፎካካሪዎች አሰራሩን እንዳይገለብጡት ሙሉ በሙሉ የተጠበቀ ሲሆን፣ በተመሳሳይ ጊዜ በብሔራዊ የባንክ ስርዓት የታገዘ ግልጽ እና ፍትሃዊ የዲጂታል ግብይት ዋስትና ይሰጣል።'
                      : 'Our core algorithmic distribution engine is a cryptographically sealed trade secret. It prevents platform replication while delivering mathematical fairness and institutional compliance backed by automated bank receipt verification.'}
                  </p>
                </div>

                {/* 1.3 National Macro-Economic Impact */}
                <div className="mt-8">
                  <h2 className="text-lg font-serif font-bold text-[#D4AF37] print:text-[#0A1128] flex items-center gap-2 border-b border-[#D4AF37]/30 pb-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <span>{lang === 'am' ? '1.1 ለሀገራችን ኢኮኖሚ ያለው ዘርፈ-ብዙ ጥቅም (ዲጂታል ኢትዮጵያ 2025)' : '1.1 National Macro-Economic Alignment (Digital Ethiopia 2025)'}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-2">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                        {lang === 'am' ? 'ጥሬ ገንዘብ አልባ ግብይት' : 'Cashless Society Push'}
                      </h3>
                      <p className="text-xs text-zinc-300 print:text-zinc-600 mt-1 leading-relaxed">
                        {lang === 'am'
                          ? 'የወረቀት ገንዘብ አጠቃቀምን በማስቀረት በቴሌብር፣ በኢትዮጵያ ንግድ ባንክ እና በአዋሽ ባንክ በኩል በየቀኑ በሚሊዮን የሚቆጠር የዲጂታል ክፍያ ፍሰትን ያፋጥናል።'
                          : 'Accelerates the national shift toward digital mobile payments through Telebirr and National Bank of Ethiopia rails.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-2">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                        {lang === 'am' ? 'ግልጽ እና ህጋዊ የታክስ ገቢ' : 'Transparent Taxable Flow'}
                      </h3>
                      <p className="text-xs text-zinc-300 print:text-zinc-600 mt-1 leading-relaxed">
                        {lang === 'am'
                          ? 'እያንዳንዱ እንቅስቃሴ በኤሌክትሮኒክ የሂሳብ መዝገብ የተመዘገበ በመሆኑ መንግስት ተገቢውን የግብር ገቢ እንዲያገኝ እና ህጋዊ የዲጂታል ንግድ እንዲሰፋ ያደርጋል።'
                          : 'Every micro-payment generates an auditable 1:1 financial ledger entry, supporting tax-compliant digital commerce.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-2">
                        <Coins className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                        {lang === 'am' ? 'የፋይናንስ ተደራሽነት ማስፋፋት' : 'Financial Inclusion'}
                      </h3>
                      <p className="text-xs text-zinc-300 print:text-zinc-600 mt-1 leading-relaxed">
                        {lang === 'am'
                          ? 'በተለያዩ የሀገሪቱ ክፍሎች የሚገኙ ዜጎችን ወደ ዘመናዊው የባንክ እና የዲጂታል ክፍያ አውታር በማስገባት የፋይናንስ ተጠቃሚነታቸውን ያረጋግጣል።'
                          : 'Brings previously unbanked citizens into active digital banking through aspirational product access.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Page Footer */}
                <div className="mt-8 pt-4 border-t border-[#D4AF37]/40 flex items-center justify-between text-[11px] font-mono text-zinc-400 print:text-zinc-500">
                  <span className="text-[#D4AF37] font-semibold">{lang === 'am' ? 'ሚኒቢድ ይፋዊ የስፖንሰርሺፕ ሰነድ • ሚስጥራዊ' : 'MiniBid Strategic Partnership Proposal • Confidential'}</span>
                  <span>{lang === 'am' ? 'ገጽ 1 ከ 4' : 'Page 1 of 4'}</span>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================================
              PAGE 2: ADULT EMPLOYMENT CREATION & DECENTRALIZED WORKFORCE IMPACT
              ========================================================================= */}
          {(viewMode === 'full' || currentPage === 2) && (
            <section className="proposal-page p-6 sm:p-10 rounded-2xl bg-[#0A1128] border-2 border-[#D4AF37]/70 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-8 print:break-after-page">
              <div className="proposal-page-content">
                {/* Header Letterhead */}
                <div className="border-b-2 border-[#D4AF37] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37] font-black flex items-center gap-1.5 mb-1.5">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <span>{lang === 'am' ? 'የስራ ዕድል ፈጠራ እና ማህበራዊ ኃላፊነት' : 'WORKFORCE CREATION & SOCIAL IMPACT DIRECTIVE'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white print:text-[#0A1128] tracking-tight">
                      {lang === 'am'
                        ? 'ለጎልማሶች እና ለወጣቶች የሚፈጠሩ ሰፋፊ የስራ ዕድሎች'
                        : 'Adult Employment Generation & Decentralized Digital Work'}
                    </h1>
                    <p className="text-xs text-zinc-300 print:text-zinc-600 mt-1.5 font-mono">
                      {lang === 'am'
                        ? 'የዩኒቨርሲቲ ተመራቂዎችን እና የቴክኖሎጂ ባለሙያዎችን በቋሚነት የስራ ባለቤት የሚያደርግ ስርዓት'
                        : 'Empowering Adult Graduates, Skilled Operators, and Regional Coordinators Across Ethiopia'}
                    </p>
                  </div>
                  <div className="text-right sm:border-l sm:border-[#D4AF37]/40 sm:pl-6 shrink-0">
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 uppercase font-semibold">{lang === 'am' ? 'የታለመ የስራ ዕድል' : 'Target Employment'}</div>
                    <div className="font-mono text-sm font-bold text-emerald-400 print:text-emerald-800">500+ {lang === 'am' ? 'ቀጥተኛ ስራዎች' : 'Direct Jobs'}</div>
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 mt-0.5">{lang === 'am' ? 'በመጀመሪያው አመት' : 'In Year 1'}</div>
                  </div>
                </div>

                {/* 2.1 The Employment Mandate */}
                <div className="mt-8">
                  <h2 className="text-lg font-serif font-bold text-[#D4AF37] print:text-[#0A1128] flex items-center gap-2 border-b border-[#D4AF37]/30 pb-2">
                    <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                    <span>{lang === 'am' ? '2.0 የስራ ዕድል ፈጠራ ማዕቀፍ፦ ለጎልማሶች ክብር ያለው የስራ ዕድል' : '2.0 The Employment Mandate: Dignified Adult Opportunities'}</span>
                  </h2>
                  <p className="text-sm text-zinc-200 print:text-zinc-800 mt-3.5 leading-relaxed">
                    {lang === 'am'
                      ? 'በአሁኑ ወቅት በሀገራችን በርካታ የተማሩ ጎልማሶች እና ወጣቶች ተገቢውን የስራ ዕድል ባለማግኘታቸው ይቸገራሉ። ሚኒቢድ የቴክኖሎጂ መተግበሪያ ብቻ ሳይሆን በመቶዎች ለሚቆጠሩ ዜጎች ቋሚ እና አስተማማኝ ገቢ የሚያስገኝ ሰፊ የስራ ዕድል ፈጣሪ አውታር ነው።'
                      : 'Graduate underemployment is one of Ethiopia’s most pressing challenges. MiniBid is architected as an active decentralized labor engine, creating hundreds of dignified, well-paying digital operations jobs.'}
                  </p>
                </div>

                {/* 2.2 4 Direct Job Categories */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Job 1 */}
                  <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold uppercase">
                          {lang === 'am' ? 'ኦፕሬሽን ዴስክ' : 'Operations Tier'}
                        </span>
                        <span className="text-xs font-mono text-zinc-300">120+ {lang === 'am' ? 'ባለሙያዎች' : 'Positions'}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                        {lang === 'am' ? '1. የክፍያ ማረጋገጫ እና ቁጥጥር አስተዳዳሪዎች' : '1. Operations Verification Desk Administrators'}
                      </h3>
                      <p className="text-xs text-zinc-300 print:text-zinc-600 mt-2 leading-relaxed">
                        {lang === 'am'
                          ? 'የተጠቃሚዎችን የባንክ እና የቴሌብር ደረሰኞች የሚያረጋግጡ፣ የ15 ደቂቃ የማረጋገጫ ጊዜን የሚጠብቁ እና የፋይናንስ ደህንነትን የሚቆጣጠሩ የሙሉ ጊዜ ጎልማሳ ሰራተኞች።'
                          : 'Adult staff reconciling bank receipts and Telebirr transactions within strict 15-minute verification SLAs, preventing fraud.'}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/30 text-[11px] font-mono text-emerald-400 print:text-emerald-700 font-semibold">
                      ✓ {lang === 'am' ? 'ቋሚ ወርሃዊ ደሞዝ + የአፈጻጸም ቦነስ' : 'Full-time salary + performance incentives'}
                    </div>
                  </div>

                  {/* Job 2 */}
                  <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                          {lang === 'am' ? 'የክልል ወኪሎች' : 'Regional Hubs'}
                        </span>
                        <span className="text-xs font-mono text-zinc-300">200+ {lang === 'am' ? 'ወኪሎች' : 'Regional Agents'}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                        {lang === 'am' ? '2. የክልል የፈሳሽ ገንዘብ እና የርክክብ ወኪሎች' : '2. Decentralized Regional Liquidity & Escrow Agents'}
                      </h3>
                      <p className="text-xs text-zinc-300 print:text-zinc-600 mt-2 leading-relaxed">
                        {lang === 'am'
                          ? 'በአዲስ አበባ፣ ሀዋሳ፣ አዳማ፣ ድሬዳዋ፣ ባህርዳር እና መቀሌ የሚገኙ ህጋዊ ወኪሎች ሆነው አሸናፊዎችን የሚያረጋግጡ እና ሽልማቶችን የሚያስረክቡ።'
                          : 'Local agents in major hubs (Addis Ababa, Hawassa, Adama, Dire Dawa, Bahir Dar) managing float and physical prize handovers.'}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/30 text-[11px] font-mono text-emerald-400 print:text-emerald-700 font-semibold">
                      ✓ {lang === 'am' ? 'የኮሚሽን ገቢ እና ወርሃዊ ውክልና' : 'Commission on disbursements & retainer'}
                    </div>
                  </div>

                  {/* Job 3 */}
                  <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase">
                          {lang === 'am' ? 'የደንበኞች እንክብካቤ' : 'Customer Care'}
                        </span>
                        <span className="text-xs font-mono text-zinc-300">80+ {lang === 'am' ? 'ባለሙያዎች' : 'Specialists'}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                        {lang === 'am' ? '3. የ24/7 የብዙ ቋንቋ የደንበኞች አገልጋዮች' : '3. Multilingual Customer Concierge Specialists'}
                      </h3>
                      <p className="text-xs text-zinc-300 print:text-zinc-600 mt-2 leading-relaxed">
                        {lang === 'am'
                          ? 'በአማርኛ፣ አፋን ኦሮሞ፣ ትግርኛ እና እንግሊዝኛ ቋንቋዎች ደንበኞችን የሚረዱ፣ ስለ ዲጂታል ደህንነት የሚያስተምሩ የጥሪ ማዕከል ባለሙያዎች።'
                          : 'Dedicated support specialists providing live assistance in Amharic, Afaan Oromoo, Tigrinya, and English.'}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/30 text-[11px] font-mono text-emerald-400 print:text-emerald-700 font-semibold">
                      ✓ {lang === 'am' ? 'ምቹ የስራ ሁኔታ እና የሙያ ስልጠና' : 'Modern office setup & digital certification'}
                    </div>
                  </div>

                  {/* Job 4 */}
                  <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold uppercase">
                          {lang === 'am' ? 'ሎጂስቲክስ እና ጥራት' : 'Supply & Logistics'}
                        </span>
                        <span className="text-xs font-mono text-zinc-300">50+ {lang === 'am' ? 'ኢንስፔክተሮች' : 'Officers'}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                        {lang === 'am' ? '4. የምርት ጥራት ኢንስፔክተሮች እና የሎጂስቲክስ መኮንኖች' : '4. Asset Quality Inspection & Logistics Officers'}
                      </h3>
                      <p className="text-xs text-zinc-300 print:text-zinc-600 mt-2 leading-relaxed">
                        {lang === 'am'
                          ? 'መኪኖችን፣ የኤሌክትሮኒክስ እቃዎችን እና ሌሎች ሽልማቶችን ጥራት ከመረከባቸው በፊት የሚፈትሹ መካኒኮች እና የትራንስፖርት ባለሙያዎች።'
                          : 'Automotive mechanics and logistics specialists verifying showroom assets and ensuring secure transit.'}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/30 text-[11px] font-mono text-emerald-400 print:text-emerald-700 font-semibold">
                      ✓ {lang === 'am' ? 'የቴክኒክ ውል ክፍያ እና የትራንስፖርት ገቢ' : 'Technical inspection fees & transit retainers'}
                    </div>
                  </div>
                </div>

                {/* CSR Impact Box */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-[#0F1B3B] border border-emerald-500/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 print:text-emerald-900 mb-1">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'am' ? 'የኩባንያዎ ማህበራዊ ኃላፊነት (CSR) ትልቅ ድል' : 'Corporate Social Responsibility (CSR) Anchor'}</span>
                  </div>
                  <p className="text-xs text-zinc-300 print:text-zinc-700 leading-relaxed">
                    {lang === 'am'
                      ? `የ${sponsorName} ስፖንሰርሺፕ እነዚህን በመቶዎች የሚቆጠሩ ኢትዮጵያውያን ጎልማሶች ስራ እንዲያገኙ በቀጥታ የሚደግፍ በመሆኑ፣ በሀገር አቀፍ ደረጃ በቴሌቪዥን እና በጋዜጦች ላይ የላቀ የህዝብ ግንኙነት (PR) እና የክብር እውቅና ያስገኝልዎታል።`
                      : `Your sponsorship directly funds this adult workforce expansion. This milestone can be co-branded as ${sponsorName}'s flagship CSR job-creation legacy, earning nationwide media acclaim.`}
                  </p>
                </div>

                {/* Page Footer */}
                <div className="mt-8 pt-4 border-t border-[#D4AF37]/40 flex items-center justify-between text-[11px] font-mono text-zinc-400 print:text-zinc-500">
                  <span className="text-[#D4AF37] font-semibold">{lang === 'am' ? 'ሚኒቢድ ይፋዊ የስፖንሰርሺፕ ሰነድ • ሚስጥራዊ' : 'MiniBid Strategic Partnership Proposal • Confidential'}</span>
                  <span>{lang === 'am' ? 'ገጽ 2 ከ 4' : 'Page 2 of 4'}</span>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================================
              PAGE 3: THE "1-PRODUCT SHOWCASE LOTTERY" DEAL MODEL & 20X MARKETING ROI
              ========================================================================= */}
          {(viewMode === 'full' || currentPage === 3) && (
            <section className="proposal-page p-6 sm:p-10 rounded-2xl bg-[#0A1128] border-2 border-[#D4AF37]/70 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-8 print:break-after-page">
              <div className="proposal-page-content">
                {/* Header Letterhead */}
                <div className="border-b-2 border-[#D4AF37] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37] font-black flex items-center gap-1.5 mb-1.5">
                      <Gift className="w-4 h-4 text-[#D4AF37]" />
                      <span>{lang === 'am' ? 'የባለ 1-ምርት ስፖንሰርሺፕ ስምምነት ሞዴል' : 'THE 1-PRODUCT SHOWCASE SPONSORSHIP MODEL'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white print:text-[#0A1128] tracking-tight">
                      {lang === 'am'
                        ? '1 ምርት ለሽልማት በማቅረብ የሚገኝ እጅግ የላቀ ሀገር አቀፍ ማስታወቂያ እና ትርፍ'
                        : 'Commit 1 Asset: Unlock Massive Nationwide Brand Visibility & 20x ROI'}
                    </h1>
                    <p className="text-xs text-zinc-300 print:text-zinc-600 mt-1.5 font-mono">
                      {lang === 'am'
                        ? 'የስፖንሰርሺፕ አሰራር ቀመር፦ አንድ ምርት ለስፖንሰርሺፕ ዕጣ በማቅረብ በመቶ ሺዎች የሚቆጠሩ ደንበኞችን ማፍራት'
                        : 'How Sponsoring 1 Showcase Asset Outperforms Millions Spent on Passive Traditional Advertising'}
                    </p>
                  </div>
                  <div className="text-right sm:border-l sm:border-[#D4AF37]/40 sm:pl-6 shrink-0">
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 uppercase font-semibold">{lang === 'am' ? 'የማስታወቂያ ተመጣጣኝ ዋጋ' : 'Ad Value Multiplier'}</div>
                    <div className="font-mono text-sm font-bold text-[#D4AF37] print:text-amber-800">20x {lang === 'am' ? 'የተረጋገጠ ተደራሽነት' : 'ROI Multiplier'}</div>
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 mt-0.5">{lang === 'am' ? 'ከባህላዊ ማስታወቂያ አንጻር' : 'vs. Traditional Billboards'}</div>
                  </div>
                </div>

                {/* 3.1 The Deal Formula */}
                <div className="mt-8">
                  <h2 className="text-lg font-serif font-bold text-[#D4AF37] print:text-[#0A1128] flex items-center gap-2 border-b border-[#D4AF37]/30 pb-2">
                    <Zap className="w-5 h-5 text-[#D4AF37]" />
                    <span>{lang === 'am' ? '3.0 የስፖንሰርሺፕ ስምምነቱ ዋና ይዘት (The Win-Win Equation)' : '3.0 The Core Sponsorship Deal Structure'}</span>
                  </h2>
                  <div className="mt-4 p-5 rounded-2xl bg-[#0F1B3B] print:bg-slate-100 border-2 border-[#D4AF37]/70 shadow-lg">
                    <div className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider mb-2">
                      {lang === 'am' ? '📌 የስምምነቱ ቀመር ባጭሩ፦' : '📌 THE CORE WIN-WIN EQUATION:'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-zinc-200 print:text-zinc-800">
                      <div className="p-3.5 rounded-xl bg-[#060A17] print:bg-white border border-[#D4AF37]/40">
                        <div className="font-bold text-[#D4AF37] text-sm mb-1">
                          {lang === 'am' ? '1. ከስፖንሰር አድራጊው ኩባንያ የሚጠበቀው፦' : '1. What Your Company Commits:'}
                        </div>
                        <p>
                          {lang === 'am'
                            ? `የ${sponsorName} ኩባንያ ለዚህ ታላቅ አገራዊ መድረክ 1 (አንድ) የራሱን ዋና ምርት (ለምሳሌ፦ 1 መኪና፣ ወይም 1 አፓርታማ/መኖሪያ ቤት፣ ወይም 1 የኤሌክትሮኒክስ ጥቅል፣ ወይም 1 የንግድ ማሽን) ለስፖንሰርሺፕ ዕጣ ያቀርባል።`
                            : `${sponsorName} provides 1 single signature product or asset (e.g. 1 Electric Vehicle/Car, 1 Studio Apartment, 1 Electronics/Smartphone Bundle, or 1 Commercial Equipment) as the showcase grand prize.`}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#060A17] print:bg-white border border-blue-500/40">
                        <div className="font-bold text-blue-400 text-sm mb-1">
                          {lang === 'am' ? '2. ከሚኒቢድ በምላሹ የሚሰጠው ታላቅ ጥቅም፦' : '2. What MiniBid Delivers in Return:'}
                        </div>
                        <p>
                          {lang === 'am'
                            ? 'ሚኒቢድ የኩባንያዎን ምርት እና አርማ በዋናው ገፅ ላይ፣ በቴሌግራም ቻናሎች፣ በቲክቶክ እና በኢንተርኔት በመቶ ሺዎች ለሚቆጠሩ ዜጎች ለሳምንታት በሰፊው ያስተዋውቃል፤ ደንበኞች ምርትዎን በጉጉት እንዲያዩት እና እንዲያውቁት በማድረግ የሽያጭ ደንበኞችን ያፈራልዎታል።'
                            : 'MiniBid mounts an aggressive nationwide marketing blitz: billboard positioning, viral social media campaigns, in-app countdown buzz, and verified consumer foot-traffic straight to your showrooms.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.2 Sector by Sector Breakdown */}
                <div className="mt-8">
                  <h3 className="font-serif font-bold text-white print:text-[#0A1128] text-sm mb-3">
                    {lang === 'am' ? 'የተለያዩ ዘርፎች የሚያገኙት ተጨባጭ ትርፍ (Multi-Sector Impact):' : 'Sector-by-Sector Value & Product Match:'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    
                    {/* Auto */}
                    <div className="p-3.5 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30">
                      <div className="flex items-center gap-2 font-bold text-[#D4AF37] mb-1.5">
                        <Car className="w-4 h-4" />
                        <span>{lang === 'am' ? 'የመኪና እና EV አምራቾች' : 'Automotive / EV'}</span>
                      </div>
                      <div className="text-zinc-300 print:text-zinc-700 leading-relaxed text-[11px]">
                        <strong>{lang === 'am' ? 'የሚያቀርቡት፦' : 'Asset:'}</strong> {lang === 'am' ? '1 አዲስ መኪና ወይም ኤሌክትሪክ ተሽከርካሪ።' : '1 City Car or EV.'}
                        <br />
                        <strong>{lang === 'am' ? 'የሚያገኙት፦' : 'Return:'}</strong> {lang === 'am' ? 'በመላው ሀገሪቱ የመኪናውን ቴክኖሎጂ በሰፊው ማስተዋወቅ፣ በሺዎች የሚቆጠሩ የቴስት ድራይቭ እና የገዢዎች ምዝገባ።' : 'Massive buzz, test-drive registrations, and nationwide prestige.'}
                      </div>
                    </div>

                    {/* Real Estate */}
                    <div className="p-3.5 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30">
                      <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1.5">
                        <Home className="w-4 h-4" />
                        <span>{lang === 'am' ? 'የሪል እስቴት አልሚዎች' : 'Real Estate Developers'}</span>
                      </div>
                      <div className="text-zinc-300 print:text-zinc-700 leading-relaxed text-[11px]">
                        <strong>{lang === 'am' ? 'የሚያቀርቡት፦' : 'Asset:'}</strong> {lang === 'am' ? '1 ስቱዲዮ አፓርታማ ወይም የመኖሪያ ቦታ።' : '1 Studio Apartment.'}
                        <br />
                        <strong>{lang === 'am' ? 'የሚያገኙት፦' : 'Return:'}</strong> {lang === 'am' ? 'የሳይት ጎብኝዎችን መጨመር፣ የዲያስፖራ እና የአገር ውስጥ እምቅ የቤት ገዢዎች ዳታቤዝ መፍጠር።' : 'Viral buyer interest, diaspora outreach, and qualified homebuyer database.'}
                      </div>
                    </div>

                    {/* Electronics */}
                    <div className="p-3.5 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-[#D4AF37]/30">
                      <div className="flex items-center gap-2 font-bold text-blue-400 mb-1.5">
                        <Tv className="w-4 h-4" />
                        <span>{lang === 'am' ? 'ኤሌክትሮኒክስ እና እቃዎች' : 'Electronics & Appliances'}</span>
                      </div>
                      <div className="text-zinc-300 print:text-zinc-700 leading-relaxed text-[11px]">
                        <strong>{lang === 'am' ? 'የሚያቀርቡት፦' : 'Asset:'}</strong> {lang === 'am' ? '1 ባለ 65" ስማርት ቲቪ፣ ፍሪጅ ወይም ስልክ።' : '1 Smart TV / Smartphone bundle.'}
                        <br />
                        <strong>{lang === 'am' ? 'የሚያገኙት፦' : 'Return:'}</strong> {lang === 'am' ? 'ወጣቱ ትውልድ የእቃውን ጥራት እንዲያውቅ ማድረግ እና የሾውሩም ሽያጭን በእጥፍ ማሳደግ።' : 'High youth traction, showroom traffic, and brand loyalty.'}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3.3 Comparative ROI Table */}
                <div className="mt-6">
                  <table className="w-full text-left text-xs font-mono border border-[#D4AF37]/40 print:border-slate-300">
                    <thead className="bg-[#060A17] print:bg-slate-200 text-[#D4AF37] print:text-[#0A1128]">
                      <tr>
                        <th className="p-2.5 border-b border-[#D4AF37]/30">{lang === 'am' ? 'የማስታወቂያ አይነት' : 'Marketing Channel'}</th>
                        <th className="p-2.5 border-b border-[#D4AF37]/30">{lang === 'am' ? 'የተለመደው የቢልቦርድ / የቲቪ ማስታወቂያ' : 'Traditional TV & Billboards'}</th>
                        <th className="p-2.5 border-b border-[#D4AF37]/30 text-[#D4AF37] print:text-black font-extrabold">{lang === 'am' ? 'የሚኒቢድ የ1 ምርት ስፖንሰርሺፕ' : 'MiniBid 1-Asset Showcase Deal'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4AF37]/20 print:divide-slate-200 text-zinc-300 print:text-zinc-800 text-[11px]">
                      <tr>
                        <td className="p-2.5 font-bold text-white print:text-black">{lang === 'am' ? 'የተጠቃሚዎች ትኩረት' : 'Customer Engagement'}</td>
                        <td className="p-2.5 text-zinc-400">{lang === 'am' ? 'ያለፈውን የሚረሳ፣ ተመልካች የማይቆይበት' : 'Passive, quickly skipped'}</td>
                        <td className="p-2.5 text-emerald-400 print:text-emerald-700 font-bold">{lang === 'am' ? 'በቀን 4.8 ጊዜ ተመልሶ የሚታይ ንቁ ተሳትፎ' : 'Active, 4.8x daily repeat app check-ins'}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white print:text-black">{lang === 'am' ? 'የወጪ እና የትርፍ ተመጣጣኝነት' : 'Cost-to-Value ROI'}</td>
                        <td className="p-2.5 text-zinc-400">{lang === 'am' ? 'በሚሊዮን የሚቆጠር የማይመለስ ወጪ' : 'Millions spent with zero verifiable attribution'}</td>
                        <td className="p-2.5 text-emerald-400 print:text-emerald-700 font-bold">{lang === 'am' ? 'የአንድ ምርት ዋጋ ለ20 እጥፍ ማስታወቂያ ዋጋ ይውላል' : 'Cost of 1 asset yields 20x measurable media exposure'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Page Footer */}
                <div className="mt-8 pt-4 border-t border-[#D4AF37]/40 flex items-center justify-between text-[11px] font-mono text-zinc-400 print:text-zinc-500">
                  <span className="text-[#D4AF37] font-semibold">{lang === 'am' ? 'ሚኒቢድ ይፋዊ የስፖንሰርሺፕ ሰነድ • ሚስጥራዊ' : 'MiniBid Strategic Partnership Proposal • Confidential'}</span>
                  <span>{lang === 'am' ? 'ገጽ 3 ከ 4' : 'Page 3 of 4'}</span>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================================
              PAGE 4: PARTNERSHIP TIERS, GOVERNANCE & FORMAL SIGNING
              ========================================================================= */}
          {(viewMode === 'full' || currentPage === 4) && (
            <section className="proposal-page p-6 sm:p-10 rounded-2xl bg-[#0A1128] border-2 border-[#D4AF37]/70 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-8">
              <div className="proposal-page-content">
                {/* Header Letterhead */}
                <div className="border-b-2 border-[#D4AF37] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37] font-black flex items-center gap-1.5 mb-1.5">
                      <Target className="w-4 h-4 text-[#D4AF37]" />
                      <span>{lang === 'am' ? 'የአጋርነት ደረጃዎች እና ህጋዊ ስምምነት' : 'PARTNERSHIP TIERS & EXECUTION PROTOCOL'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white print:text-[#0A1128] tracking-tight">
                      {lang === 'am'
                        ? 'የስፖንሰርሺፕ ደረጃዎች፣ ህጋዊ አሰራር እና ቀጣይ እርምጃዎች'
                        : 'Partnership Framework, Compliance & Next Steps'}
                    </h1>
                    <p className="text-xs text-zinc-300 print:text-zinc-600 mt-1.5 font-mono">
                      {lang === 'am'
                        ? `ከ${sponsorName} ጋር በጋራ ለመስራት የተዘጋጁ አማራጮች`
                        : `Structured Engagement Models Tailored for ${sponsorName}`}
                    </p>
                  </div>
                  <div className="text-right sm:border-l sm:border-[#D4AF37]/40 sm:pl-6 shrink-0">
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 uppercase font-semibold">{lang === 'am' ? 'የስምምነት ማዕቀፍ' : 'Framework'}</div>
                    <div className="font-mono text-xs font-bold text-[#D4AF37] print:text-black">{lang === 'am' ? 'ይፋዊ የመግባቢያ ሰነድ (MoU)' : 'Tiered Strategic MoU'}</div>
                    <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 mt-0.5">{lang === 'am' ? 'በህግ ፊት ፀንቶ የሚቆም' : 'Legally Enforced'}</div>
                  </div>
                </div>

                {/* 4.1 Partnership Tiers */}
                <div className="mt-8">
                  <h2 className="text-lg font-serif font-bold text-[#D4AF37] print:text-[#0A1128] flex items-center gap-2 border-b border-[#D4AF37]/30 pb-2">
                    <Award className="w-5 h-5 text-[#D4AF37]" />
                    <span>{lang === 'am' ? '4.0 ሶስቱ የአጋርነት ደረጃዎች' : '4.0 Three Strategic Partnership Models'}</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Tier 1 */}
                    <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border-2 border-[#D4AF37] flex flex-col justify-between">
                      <div>
                        <div className="px-2 py-0.5 rounded bg-[#D4AF37] text-black font-mono font-black text-[10px] uppercase inline-block mb-2">
                          {lang === 'am' ? 'ደረጃ 1 • ዋና ስፖንሰር' : 'Tier 1 • Title Partner'}
                        </div>
                        <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                          {lang === 'am' ? 'ዋና መስራች ስትራቴጂክ አጋር' : 'Founding Title Strategic Partner'}
                        </h3>
                        <p className="text-xs text-zinc-300 print:text-zinc-600 mt-2 leading-relaxed">
                          {lang === 'am'
                            ? `የኩባንያዎ ስም በመተግበሪያው አናት ላይ "ሚኒቢድ — ከ${sponsorName} ጋር በመተባበር የቀረበ" ተብሎ የሚቀመጥ ሲሆን፣ በሁሉም የማስታወቂያ ቦርዶች ላይ የበላይ ተጠቃሽ ይሆናል።`
                            : `Exclusive co-branding: "MiniBid — Powered by ${sponsorName}". Prime permanent billboard positioning and national media launch events.`}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 text-[11px] font-mono text-[#D4AF37] font-bold">
                        {lang === 'am' ? 'ከፍተኛ የገበያ ተደራሽነት' : 'Maximum Strategic Footprint'}
                      </div>
                    </div>

                    {/* Tier 2 */}
                    <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-blue-500/50 flex flex-col justify-between">
                      <div>
                        <div className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-black text-[10px] uppercase inline-block mb-2">
                          {lang === 'am' ? 'ደረጃ 2 • የዘርፍ ስፖንሰር' : 'Tier 2 • Category Sponsor'}
                        </div>
                        <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                          {lang === 'am' ? 'የተመረጠ ምርት ብቸኛ ስፖንሰር' : 'Premier Category Asset Sponsor'}
                        </h3>
                        <p className="text-xs text-zinc-300 print:text-zinc-600 mt-2 leading-relaxed">
                          {lang === 'am'
                            ? 'በአንድ የተመረጠ ዘርፍ (ለምሳሌ የመኪና ወይም የሪል እስቴት ወይም የስልክ) ብቸኛ ስፖንሰር በመሆን የራስዎን ምርቶች ብቻ በልዩ ገጽ ላይ ማስተዋወቅ።'
                            : 'Exclusive category ownership (e.g., sole automotive or sole real estate sponsor), spotlighting your company’s distributor showroom.'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 text-[11px] font-mono text-blue-400 font-bold">
                        {lang === 'am' ? 'የተወሰነ ዘርፍ የበላይነት' : 'Targeted Product Marketing'}
                      </div>
                    </div>

                    {/* Tier 3 */}
                    <div className="p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-50 border border-emerald-500/50 flex flex-col justify-between">
                      <div>
                        <div className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-black text-[10px] uppercase inline-block mb-2">
                          {lang === 'am' ? 'ደረጃ 3 • የስራ ዕድል ስፖንሰር' : 'Tier 3 • Workforce Sponsor'}
                        </div>
                        <h3 className="font-bold text-sm text-white print:text-[#0A1128]">
                          {lang === 'am' ? 'የወጣቶች ስራ ዕድል ደጋፊ (CSR)' : 'Workforce & CSR Job Sponsor'}
                        </h3>
                        <p className="text-xs text-zinc-300 print:text-zinc-600 mt-2 leading-relaxed">
                          {lang === 'am'
                            ? 'በተለያዩ ክልሎች የሚቋቋሙትን የኦፕሬሽን እና የማረጋገጫ ማዕከላት በስፖንሰርሺፕ በመደገፍ የወጣቶችን የስራ ዕድል ማስፋፋት።'
                            : 'Directly underwrites regional operations hubs and adult verification desks, co-branded with prominent CSR recognition.'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 text-[11px] font-mono text-emerald-400 font-bold">
                        {lang === 'am' ? 'የማህበረሰብ አጋርነት እውቅና' : 'Direct Community Impact'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4.2 Regulatory Rigor & Governance */}
                <div className="mt-8 p-4 rounded-xl bg-[#0F1B3B] print:bg-slate-100 border border-[#D4AF37]/40">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#D4AF37] print:text-black uppercase font-mono mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'am' ? 'የህግ እና የፋይናንስ ጥበቃ ማረጋገጫዎች' : 'Institutional Governance & Legal Safeguards'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300 print:text-zinc-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{lang === 'am' ? 'በኢትዮጵያ የቴሌኮም እና የፋይናንስ ህግጋት መሰረት የተረጋገጠ የደንበኞች ማንነት (KYC)።' : 'Strict KYC validation adhering to Ethiopian telecom rules.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{lang === 'am' ? 'በብሔራዊ ባንክ የታገዘ ደህንነቱ የተጠበቀ የዲጂታል ክፍያ ስርዓት።' : 'Auditable bank verification with double-credit protection.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{lang === 'am' ? 'የስፖንሰር አድራጊው ምርት በአግባቡ እና በህጋዊ መንገድ ለአሸናፊው መድረሱን የሚያረጋግጥ የርክክብ ሰነድ።' : 'Physical asset authenticity inspection prior to handover.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{lang === 'am' ? 'የሁለቱን ወገኖች ጥቅም የሚያስከብር ህጋዊ የስምምነት ማዕቀፍ።' : 'Transparent winner audit trails and mutual legal protection.'}</span>
                    </div>
                  </div>
                </div>

                {/* 4.3 Action Protocol & Sign-off Block */}
                <div className="mt-8 pt-6 border-t-2 border-[#D4AF37]">
                  <h3 className="font-serif font-bold text-white print:text-[#0A1128] text-base mb-2">
                    {lang === 'am' ? 'ቀጣይ ተግባራዊ እርምጃዎች፦' : 'Recommended Immediate Next Steps:'}
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-300 print:text-zinc-800 font-mono">
                    <li>{lang === 'am' ? 'የምስጢራዊነት ስምምነት (Mutual Non-Disclosure Agreement) መፈራረም።' : 'Execution of standard Mutual Non-Disclosure Agreement (M-NDA).'}</li>
                    <li>{lang === 'am' ? 'የመተግበሪያውን እና የቁጥጥር ስርዓቱን የቀጥታ የቴክኒክ ገለጻ መመልከት።' : 'Live private technical walkthrough of the Administrative Platform.'}</li>
                    <li>{lang === 'am' ? 'የስፖንሰርሺፕ የመግባቢያ ሰነድ (MoU) ማዘጋጀት እና መፈረም።' : 'Drafting of the Strategic Sponsorship Memorandum of Understanding (MoU).'}</li>
                    <li>{lang === 'am' ? 'የምርቱን የሽልማት ማስተዋወቂያ ፕሮግራም በይፋ መክፈት።' : 'Nationwide co-marketing and commercial public launch scheduling.'}</li>
                  </ol>

                  {/* Formal Signature Box */}
                  <div className="mt-8 pt-6 border-t border-[#D4AF37]/40 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs font-mono">
                    <div>
                      <div className="text-zinc-400 print:text-zinc-600 mb-6">
                        {lang === 'am' ? 'በሚኒቢድ ቴክኖሎጂስ ስም የቀረበው፦' : 'SUBMITTED ON BEHALF OF:'}
                      </div>
                      <div className="font-bold text-white print:text-[#0A1128] text-sm">MiniBid Technologies Enterprise</div>
                      <div className="text-zinc-400 print:text-zinc-600 text-[11px]">
                        {lang === 'am' ? 'የስራ አስፈጻሚ ቦርድ ዳይሬክቶሬት' : 'Executive Commercial Directorate'}
                      </div>
                      <div className="mt-6 pt-2 border-t border-zinc-600 print:border-zinc-400 w-48 text-[10px] text-zinc-400 print:text-zinc-500">
                        {lang === 'am' ? 'ህጋዊ ፊርማ እና ማህተም' : 'Authorized Signature & Seal'}
                      </div>
                    </div>

                    <div>
                      <div className="text-zinc-400 print:text-zinc-600 mb-6">
                        {lang === 'am' ? 'በስፖንሰር አድራጊው ኩባንያ ስም የተቀበለው፦' : 'RECEIVED & ACKNOWLEDGED BY:'}
                      </div>
                      <div className="font-bold text-white print:text-[#0A1128] text-sm">{sponsorName}</div>
                      <div className="text-zinc-400 print:text-zinc-600 text-[11px]">
                        {lang === 'am' ? 'የኮርፖሬት ስትራቴጂ እና ሽርክና ክፍል' : 'Corporate Partnerships & Strategy'}
                      </div>
                      <div className="mt-6 pt-2 border-t border-zinc-600 print:border-zinc-400 w-48 text-[10px] text-zinc-400 print:text-zinc-500">
                        {lang === 'am' ? 'የስራ ኃላፊ ፊርማ እና ማህተም' : 'Executive Signature & Seal'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page Footer */}
                <div className="mt-8 pt-4 border-t border-[#D4AF37]/40 flex items-center justify-between text-[11px] font-mono text-zinc-400 print:text-zinc-500">
                  <span className="text-[#D4AF37] font-semibold">{lang === 'am' ? 'ሚኒቢድ ይፋዊ የስፖንሰርሺፕ ሰነድ • ሚስጥራዊ' : 'MiniBid Strategic Partnership Proposal • Confidential'}</span>
                  <span>{lang === 'am' ? 'ገጽ 4 ከ 4 (የሰነዱ ማጠቃለያ)' : 'Page 4 of 4 (End of Proposal)'}</span>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Bottom Bar (Super Admin Only) */}
        <footer className="px-6 py-4 border-t border-[#D4AF37]/30 bg-[#0B132B] rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-zinc-400 print:hidden shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300">
              {lang === 'am'
                ? 'ለስራ አስፈጻሚ ቦርድ እና ለኢትዮጵያ ኩባንያዎች አቀራረብ ዝግጁ የሆነ ይፋዊ ሰነድ'
                : 'Ready for Executive Boardroom Pitch & Corporate Outreach'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDirectDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#B38F26] text-black font-black flex items-center gap-2 transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'am' ? 'PDF ሰነድ አውርድ (Direct PDF)' : 'Download PDF Document'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-[#0A1128] hover:bg-[#1E293B] text-white border border-[#D4AF37]/40 font-bold flex items-center gap-1.5 transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#D4AF37]" />
              <span>{lang === 'am' ? 'አትም / Save PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              {lang === 'am' ? 'ዝጋ' : 'Close'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
