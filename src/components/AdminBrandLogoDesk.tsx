import React, { useState } from 'react';
import {
  Crown,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Sparkles,
  Check,
  ShieldAlert,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useBrandLogo, BRAND_LOGO_PRESETS } from '../utils/brandLogo.js';
import { useTranslation } from '../utils/i18n.js';

export const AdminBrandLogoDesk: React.FC = () => {
  const { language } = useTranslation();
  const { logoUrl, isCustom, uploadCustomLogo, setCustomLogoUrl, resetToDefault } = useBrandLogo();

  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const previewUrl =
    activeTab === 'upload' && filePreview
      ? filePreview
      : activeTab === 'url' && urlInput.trim()
      ? urlInput.trim()
      : activeTab === 'presets' && selectedPresetUrl
      ? selectedPresetUrl
      : logoUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(language === 'am' ? 'እባክዎ ትክክለኛ የምስል ፋይል ይምረጡ' : 'Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(language === 'am' ? 'የምስሉ መጠን ከ 5MB መብለጥ የለበትም' : 'Image size cannot exceed 5MB');
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      let success = false;
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setErrorMsg(language === 'am' ? 'እባክዎ መጀመሪያ የምስል ፋይል ይምረጡ' : 'Please select an image file first');
          setIsSaving(false);
          return;
        }
        success = await uploadCustomLogo(selectedFile);
      } else if (activeTab === 'url') {
        if (!urlInput.trim()) {
          setErrorMsg(language === 'am' ? 'እባክዎ ትክክለኛ የድረ-ገጽ አድራሻ (URL) ያስገቡ' : 'Please enter an image URL');
          setIsSaving(false);
          return;
        }
        success = await setCustomLogoUrl(urlInput.trim());
      } else if (activeTab === 'presets') {
        if (!selectedPresetUrl) {
          setErrorMsg(language === 'am' ? 'እባክዎ አርማ ይምረጡ' : 'Please select a preset logo');
          setIsSaving(false);
          return;
        }
        success = await setCustomLogoUrl(selectedPresetUrl);
      }

      if (success) {
        setSuccessMsg(
          language === 'am'
            ? 'የብራንድ ሎጎው በስኬት ተቀይሯል! በመላው ፕላትፎርሙ ተፈፃሚ ሆኗል::'
            : 'Brand logo updated successfully! Changes are live across all headers, intros, and footers.'
        );
      } else {
        setErrorMsg(language === 'am' ? 'ሎጎውን መቀየር አልተቻለም:: እባክዎ እንደገና ይሞክሩ::' : 'Failed to update logo. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error updating brand logo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      language === 'am'
        ? 'የድረ-ገፁን ሎጎ ወደ መጀመሪያው ይፋዊ የሰንፋየር አርማ መመለስ ይፈልጋሉ?'
        : 'Reset website logo back to official Sunfyre default crest?'
    );
    if (!confirmReset) return;

    setIsSaving(true);
    const success = await resetToDefault();
    setIsSaving(false);
    if (success) {
      setSelectedFile(null);
      setFilePreview(null);
      setUrlInput('');
      setSelectedPresetUrl(null);
      setSuccessMsg(
        language === 'am'
          ? 'ሎጎው ወደ ዋናው የሰንፋየር አርማ ተመልሷል::'
          : 'Logo successfully restored to default official crest.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#141208] via-[#1c180e] to-[#0f0e0c] border border-[#E5B842]/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E5B842] to-amber-600 p-0.5 flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-black text-white">
                  {language === 'am' ? 'የብራንድ ሎጎ አስተዳደር' : 'Platform Brand & Logo Manager'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E5B842]/20 border border-[#E5B842]/40 text-[#E5B842] font-mono text-[10px] uppercase font-bold">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                {language === 'am'
                  ? 'በመላው ድረ-ገጽ ላይ (ራስጌ፣ መግቢያ፣ እግርጌ) የሚታየውን ይፋዊ አርማ በቅጽበት ይለውጡ'
                  : 'Dynamically update the official platform emblem rendered across all public and admin views'}
              </p>
            </div>
          </div>

          {isCustom && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-700/50 text-zinc-300 hover:text-red-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ወደ መጀመሪያው አርማ መልስ' : 'Reset to Default Crest'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-[#121217] border border-zinc-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#E5B842]" />
                <span>{language === 'am' ? 'የቀጥታ ቅድመ እይታ (Live Preview)' : 'Live Display Preview'}</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                {isCustom ? 'Custom Logo' : 'Default Crest'}
              </span>
            </div>

            {/* Intro Centerpiece Style Preview */}
            <div className="p-6 rounded-2xl bg-black border border-zinc-800/80 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              <div className="relative group mb-3">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#946e1a] via-[#f7d779] to-[#80590a] shadow-[0_0_30px_rgba(229,184,66,0.35)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Brand Emblem Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              <div className="text-base font-serif font-black text-amber-200">MiniBid</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#E5B842]">
                Powered by Sunfyre General Trading
              </div>
              <span className="mt-2 text-[9px] font-mono text-zinc-500">
                Rendered on Intro Modal
              </span>
            </div>

            {/* Header Style Preview */}
            <div className="p-4 rounded-2xl bg-black border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E5B842] to-amber-700 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full bg-[#09090b] rounded-[9px] overflow-hidden flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Header Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-serif font-bold text-white">MINIBID</div>
                  <div className="text-[9px] font-mono text-zinc-400">Header Emblem (40px)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Responsive
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Customizer Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-[#121217] border border-zinc-800 space-y-6">
            {/* Tabs */}
            <div className="flex rounded-2xl bg-black/60 p-1.5 border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-[#E5B842] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{language === 'am' ? 'ምስል ስቀል' : 'File Upload'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-[#E5B842] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>{language === 'am' ? 'የምስል አድራሻ (URL)' : 'Web URL'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-[#E5B842] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>{language === 'am' ? 'የተዘጋጁ አርማዎች' : 'Luxury Presets'}</span>
              </button>
            </div>

            {/* Tab 1: Upload */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-[#E5B842] rounded-3xl p-8 bg-black/40 hover:bg-black/60 transition-all cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 group-hover:bg-[#E5B842]/20 border border-zinc-800 group-hover:border-[#E5B842]/40 flex items-center justify-center mb-3 transition-all">
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-[#E5B842] transition-colors" />
                  </div>
                  <span className="text-sm font-mono text-zinc-200 font-semibold mb-1">
                    {selectedFile
                      ? selectedFile.name
                      : language === 'am'
                      ? 'ምስል ለመስቀል እዚህ ይጫኑ'
                      : 'Click or drop logo image here'}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono text-center max-w-sm">
                    Supports PNG, JPG, WEBP, and SVG formats up to 5MB. Transparent PNG or circular medallion recommended.
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {selectedFile && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between">
                    <span>
                      Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <span className="text-emerald-400">Ready to save</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <label className="block text-xs font-mono text-zinc-300 font-semibold">
                  {language === 'am' ? 'የቀጥታ ምስል አድራሻ (Direct Image URL)' : 'Direct Web Image URL'}
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/branding/custom_logo.png"
                  className="w-full px-4 py-3 rounded-2xl bg-black border border-zinc-700 focus:border-[#E5B842] text-xs font-mono text-white placeholder-zinc-600 outline-none transition-colors"
                />
                <p className="text-[11px] font-mono text-zinc-500">
                  Enter any HTTPS URL pointing to an image file. The platform will immediately render it across all sessions.
                </p>
              </div>
            )}

            {/* Tab 3: Presets */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BRAND_LOGO_PRESETS.map((preset) => {
                  const isSelected = previewUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetUrl(preset.url)}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#E5B842]/15 border-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.3)]'
                          : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E5B842] text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <div className="w-16 h-16 rounded-full mx-auto p-1 bg-gradient-to-tr from-[#946e1a] to-amber-500 mb-2">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div className="text-xs font-bold text-white mb-0.5">
                        {language === 'am' ? preset.nameAm : preset.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-sans leading-tight">
                        {preset.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5B842] via-[#F3C34F] to-[#D4AF37] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSaving
                    ? language === 'am'
                      ? 'በማስቀመጥ ላይ...'
                      : 'Applying Brand Logo...'
                    : language === 'am'
                    ? 'አዲሱን ሎጎ በመላው ድረ-ገጹ ላይ ተግብር'
                    : 'Save & Deploy Brand Logo Globally'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
