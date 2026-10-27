import React, { useState } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Sparkles,
  Check,
  ShieldAlert,
  Crown,
  Eye,
} from 'lucide-react';
import { useBrandLogo, BRAND_LOGO_PRESETS, DEFAULT_LOGO } from '../utils/brandLogo.js';
import { useTranslation } from '../utils/i18n.js';

interface BrandLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandLogoModal: React.FC<BrandLogoModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  // Active preview candidate
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
            : 'Brand logo updated successfully! Changes are live across the entire platform.'
        );
        setTimeout(() => {
          onClose();
        }, 1200);
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
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0e0e12] border border-[#E5B842]/40 rounded-3xl shadow-[0_0_60px_rgba(229,184,66,0.25)] overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className="px-5 sm:px-7 py-4 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-black via-zinc-900 to-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E5B842] to-amber-600 p-0.5 flex items-center justify-center shadow-md">
              <Crown className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>{language === 'am' ? 'የብራንድ ሎጎ አስተዳደር' : 'Brand Logo Manager'}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/40">
                  Super Admin
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                {language === 'am'
                  ? 'በመላው ድረ-ገጽ ላይ የሚታየውን ይፋዊ ሎጎ ይቀይሩ'
                  : 'Customize the official logo rendered across all platform pages'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Notifications */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Preview Display Card */}
          <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Circular Emblem Preview */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#946e1a] via-[#f7d779] to-[#80590a] shadow-[0_0_20px_rgba(229,184,66,0.3)] shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Brand Logo Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-black/90 border border-[#E5B842]/50 text-[9px] font-mono text-[#E5B842]">
                  Intro
                </span>
              </div>

              {/* Header Icon Preview */}
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E5B842] to-amber-700 p-0.5 shadow-md">
                  <div className="w-full h-full bg-[#09090b] rounded-[10px] overflow-hidden flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Header Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-black/90 border border-zinc-700 text-[9px] font-mono text-zinc-400">
                  Header
                </span>
              </div>

              <div className="text-left space-y-0.5">
                <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{language === 'am' ? 'ቅድመ እይታ (Live Preview)' : 'Live Preview'}</span>
                </div>
                <div className="text-sm font-serif font-bold text-white">MINIBID ETHIOPIA</div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {isCustom ? 'Custom Logo Selected' : 'Official Luxury Crest Active'}
                </div>
              </div>
            </div>

            {isCustom && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-700/50 text-zinc-400 hover:text-red-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                title="Reset to default luxury crest"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ወደ ቀደመው መልስ' : 'Reset Default'}</span>
              </button>
            )}
          </div>

          {/* Source Tabs */}
          <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#E5B842] text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ምስል ስቀል (Upload)' : 'Upload File'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-[#E5B842] text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'የምስል አድራሻ (URL)' : 'Image URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-[#E5B842] text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'የተዘጋጁ አርማዎች' : 'Luxury Presets'}</span>
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-[#E5B842] rounded-2xl p-6 bg-zinc-950/60 hover:bg-zinc-900/60 transition-all cursor-pointer group">
                <Upload className="w-8 h-8 text-zinc-500 group-hover:text-[#E5B842] mb-2 transition-colors" />
                <span className="text-xs font-mono text-zinc-300 font-semibold mb-1">
                  {selectedFile ? selectedFile.name : language === 'am' ? 'ምስል ለመምረጥ እዚህ ይጫኑ' : 'Click or drag image file here'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  PNG, JPG, WEBP, or SVG • Max 5MB • High resolution recommended
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {selectedFile && (
                <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5 justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Image URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                  {language === 'am' ? 'የቀጥታ ምስል አድራሻ (Direct Image URL)' : 'Direct Web Image URL'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-[#E5B842] text-xs font-mono text-white placeholder-zinc-600 outline-none transition-colors"
                  />
                  {urlInput && (
                    <button
                      type="button"
                      onClick={() => setUrlInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] font-mono text-zinc-500">
                Paste any publicly accessible image link (Cloudinary, AWS S3, Imgur, or official site).
              </p>
            </div>
          )}

          {/* Tab 3: Curated Luxury Presets */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BRAND_LOGO_PRESETS.map((preset) => {
                const isSelected = previewUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetUrl(preset.url)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#E5B842]/10 border-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.3)]'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
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
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-7 py-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            {language === 'am' ? 'ይቅር (Cancel)' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E5B842] via-[#F3C34F] to-[#D4AF37] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isSaving
                ? language === 'am'
                  ? 'በማስቀመጥ ላይ...'
                  : 'Saving Global Logo...'
                : language === 'am'
                ? 'ሎጎውን አጽድቅና ተግብር'
                : 'Save & Apply Logo'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
