
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ImageUploader } from './components/ImageUploader';
import { StyleCard } from './components/StyleCard';
import { STAGING_STYLES } from './constants';
import { StagingStyle, GeneratedImage, Listing, ViewMode } from './types';
import { stageRoom } from './services/geminiService';

const ROOM_LABELS = ['Living Room', 'Kitchen', 'Master Bedroom', 'Bedroom', 'Bathroom', 'Dining Room', 'Home Office', 'Exterior', 'Other'];

interface PendingImage {
  url: string;
  label: string;
  styleId?: string;
}

const App: React.FC = () => {
  // Navigation & Persistence
  const [view, setView] = useState<ViewMode>('dashboard');
  const [listings, setListings] = useState<Listing[]>(() => {
    const saved = localStorage.getItem('visionstage_listings');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentListingId, setCurrentListingId] = useState<string | null>(null);

  // Custom Styles Persistence
  const [userStyles, setUserStyles] = useState<StagingStyle[]>(() => {
    const saved = localStorage.getItem('visionstage_custom_styles');
    return saved ? JSON.parse(saved) : [];
  });

  // Combine built-in and user styles
  const allStyles = useMemo(() => [...STAGING_STYLES, ...userStyles], [userStyles]);

  // Bulk Staging State
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  
  // Modal State
  const [isNewListingModalOpen, setIsNewListingModalOpen] = useState(false);
  const [isCreateStyleModalOpen, setIsCreateStyleModalOpen] = useState(false);
  const [saveAsStyleData, setSaveAsStyleData] = useState<{url: string, styleId: string} | null>(null);
  
  // New Listing Form
  const [newListingName, setNewListingName] = useState('');
  const [newListingStyleId, setNewListingStyleId] = useState(STAGING_STYLES[0].id);

  // New Custom Style Form
  const [newStyleName, setNewStyleName] = useState('');
  const [newStylePrompt, setNewStylePrompt] = useState('');
  const [newStyleIcon, setNewStyleIcon] = useState('✨');

  const activeListing = listings.find(l => l.id === currentListingId);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('visionstage_listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('visionstage_custom_styles', JSON.stringify(userStyles));
  }, [userStyles]);

  const handleCreateListing = () => {
    if (!newListingName.trim()) return;
    const newListing: Listing = {
      id: Math.random().toString(36).substr(2, 9),
      address: newListingName,
      targetStyleId: newListingStyleId,
      images: [],
      createdAt: Date.now()
    };
    setListings([newListing, ...listings]);
    setNewListingName('');
    setIsNewListingModalOpen(false);
    setCurrentListingId(newListing.id);
    setView('listing_detail');
  };

  const handleCreateCustomStyle = () => {
    if (!newStyleName.trim() || !newStylePrompt.trim()) return;
    const newStyle: StagingStyle = {
      id: 'custom-' + Math.random().toString(36).substr(2, 9),
      name: newStyleName,
      description: 'Personalized staging aesthetic.',
      prompt: newStylePrompt,
      icon: newStyleIcon,
      isCustom: true
    };
    setUserStyles([...userStyles, newStyle]);
    setNewStyleName('');
    setNewStylePrompt('');
    setIsCreateStyleModalOpen(false);
    setSaveAsStyleData(null);
  };

  const handleSaveOutputAsStyle = (image: GeneratedImage) => {
    const baseStyle = allStyles.find(s => s.id === image.styleId);
    setNewStyleName(`Variant of ${baseStyle?.name || 'Custom'}`);
    setNewStylePrompt(baseStyle?.prompt || '');
    setSaveAsStyleData({ url: image.url, styleId: image.styleId });
    setIsCreateStyleModalOpen(true);
  };

  const updateImageFeedback = (imageId: string, rating: number, feedback?: string) => {
    setListings(prev => prev.map(l => {
      if (l.id !== currentListingId) return l;
      return {
        ...l,
        images: l.images.map(img => img.id === imageId ? { ...img, rating, feedback: feedback !== undefined ? feedback : img.feedback } : img)
      };
    }));
  };

  const processBulkStaging = async () => {
    if (pendingImages.length === 0 || !activeListing) return;

    setIsBulkProcessing(true);

    const masterStyle = allStyles.find(s => s.id === activeListing.targetStyleId) || STAGING_STYLES[0];
    
    for (let i = 0; i < pendingImages.length; i++) {
      setCurrentProcessingIndex(i);
      
      const item = pendingImages[i];
      const itemStyleId = item.styleId || activeListing.targetStyleId;
      const itemStyle = allStyles.find(s => s.id === itemStyleId) || masterStyle;

      // Consistency reinforcement prompt
      const consistencyInstruction = `Maintain strict visual consistency with the '${masterStyle.name}' aesthetic used throughout the rest of this property listing at ${activeListing.address}. Ensure lighting and materials match the established theme.`;

      const finalPrompt = isCustomMode && customPrompt.trim() 
        ? `Room type: ${item.label}. ${customPrompt}. ${consistencyInstruction}`
        : `Room type: ${item.label}. ${itemStyle.prompt}. ${consistencyInstruction}`;

      try {
        const resultUrl = await stageRoom(item.url, finalPrompt);
        const newImg: GeneratedImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: resultUrl,
          originalUrl: item.url,
          styleId: itemStyleId,
          label: item.label,
          timestamp: Date.now()
        };
        
        setListings(prev => prev.map(l => 
          l.id === activeListing.id 
            ? { ...l, images: [newImg, ...l.images] } 
            : l
        ));
      } catch (err: any) {
        console.error(`Failed to stage image ${i}:`, err);
      }
    }

    setPendingImages([]);
    setIsBulkProcessing(false);
    setCurrentProcessingIndex(-1);
    
    setTimeout(() => {
      spotlightRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  const handleRefineImage = (img: GeneratedImage) => {
    setPendingImages([{ url: img.url, label: img.label || 'Room', styleId: img.styleId }]);
    setIsCustomMode(true);
    setCustomPrompt("Refine this staged room by adjusting: ");
    spotlightRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `VisionStage-${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Active Portfolio</h2>
                <p className="text-gray-500 font-medium">Hyper-realistic virtual staging for high-performance listings.</p>
              </div>
              <button 
                onClick={() => setIsNewListingModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl transition-all active:scale-95"
              >
                Add Property Listing
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-24 text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner text-4xl">🏢</div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Portfolio Empty</h3>
                <p className="text-gray-400 max-w-sm mx-auto mb-10 font-medium">Create a listing to maintain visual style consistency across all room photos.</p>
                <button onClick={() => setIsNewListingModalOpen(true)} className="text-indigo-600 font-black hover:underline uppercase tracking-widest text-[10px]">Initialize First Project &rarr;</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {listings.map(listing => (
                  <div 
                    key={listing.id}
                    onClick={() => { setCurrentListingId(listing.id); setView('listing_detail'); }}
                    className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
                      {listing.images.length > 0 ? (
                        <img src={listing.images[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200 font-black text-xs uppercase">No Photos</div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-indigo-600/90 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                          {listing.images.length} ROOMS
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="text-xl font-black text-gray-900 truncate mb-1">{listing.address}</h4>
                      <p className="text-[10px] bg-indigo-50 text-indigo-600 font-black px-2 py-0.5 rounded inline-block uppercase">
                        {allStyles.find(s => s.id === listing.targetStyleId)?.name} Aesthetic
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LISTING DETAIL VIEW */}
        {view === 'listing_detail' && activeListing && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <button onClick={() => setView('dashboard')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2 hover:translate-x-1 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" /></svg>
                   Back to Portfolio
                </button>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{activeListing.address}</h2>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Style:</span>
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-indigo-100">
                    {allStyles.find(s => s.id === activeListing.targetStyleId)?.name}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                 <button 
                  onClick={() => handleDownload(activeListing.images[0]?.url, activeListing.address)}
                  disabled={activeListing.images.length === 0}
                  className="bg-gray-900 px-8 py-4 rounded-2xl font-black text-sm text-white hover:bg-black shadow-xl disabled:opacity-30 transition-all active:scale-95"
                 >
                    Download Featured Asset
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* STAGING PANEL (Workflow) */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Workflow Queue</h3>

                  {pendingImages.length === 0 ? (
                    <ImageUploader onImagesSelect={(urls) => setPendingImages(urls.map(url => ({ url, label: 'Living Room' })))} />
                  ) : (
                    <div className="space-y-4">
                      {/* Batch Labeling */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {pendingImages.map((item, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${idx === currentProcessingIndex ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-50 bg-gray-50'}`}>
                            <div className="flex gap-4">
                              <img src={item.url} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-white" />
                              <div className="flex-1 space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Room Label</label>
                                <select 
                                  value={item.label}
                                  onChange={(e) => {
                                    const newBatch = [...pendingImages];
                                    newBatch[idx].label = e.target.value;
                                    setPendingImages(newBatch);
                                  }}
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-900 focus:border-indigo-600 outline-none"
                                >
                                  {ROOM_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 space-y-4 border-t border-gray-50">
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 cursor-pointer" onClick={() => setIsCustomMode(!isCustomMode)}>
                          <input type="checkbox" checked={isCustomMode} readOnly className="w-5 h-5 text-indigo-600 rounded-lg" />
                          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer">Refine Batch Instructions</label>
                        </div>
                        
                        {isCustomMode && (
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Add specific details (e.g., 'Add a large monstera plant' or 'Make walls light gray')..."
                            className="w-full h-24 p-4 text-xs bg-indigo-50/20 border-2 border-indigo-100 rounded-2xl focus:border-indigo-600 outline-none resize-none font-bold text-gray-900"
                          />
                        )}

                        <button
                          disabled={isBulkProcessing}
                          onClick={processBulkStaging}
                          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-gray-300"
                        >
                          {isBulkProcessing ? (
                            <>Processing {currentProcessingIndex + 1}/{pendingImages.length}...</>
                          ) : (
                            <>Transform {pendingImages.length} Photos</>
                          )}
                        </button>
                        <button onClick={() => setPendingImages([])} className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">Discard Batch</button>
                      </div>
                    </div>
                  )}
                </section>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                   <h4 className="font-black text-xl flex items-center gap-3 uppercase tracking-tight">
                     <span className="text-3xl">🏠</span>
                     Property Cohesion
                   </h4>
                   <p className="text-xs text-indigo-100 font-medium opacity-80 leading-relaxed">VisionStage AI explicitly cross-references your Master Style across every room type in this listing for professional visual consistency.</p>
                </div>
              </div>

              {/* RESULTS GALLERY */}
              <div className="lg:col-span-8 space-y-10">
                
                {/* Spotlight Display (Main View) */}
                <div ref={spotlightRef} className="min-h-[400px]">
                  {isBulkProcessing ? (
                    <div className="bg-white p-4 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
                      <div className="aspect-[16/10] rounded-[2.5rem] overflow-hidden relative bg-gray-950">
                         <img src={pendingImages[currentProcessingIndex]?.url} className="w-full h-full object-cover opacity-30 blur-md scale-105" alt="Processing" />
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">AI Designing...</h3>
                            <p className="text-indigo-300 font-bold mt-2 text-[10px] uppercase tracking-widest">{pendingImages[currentProcessingIndex]?.label}</p>
                         </div>
                      </div>
                    </div>
                  ) : activeListing.images.length > 0 ? (
                    <div className="space-y-4 animate-in fade-in duration-700">
                      <div className="flex items-center justify-between px-6">
                         <div className="flex items-center gap-3">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Latest Result</h3>
                            <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase">{activeListing.images[0].label}</span>
                         </div>
                         <div className="flex gap-4">
                           <button onClick={() => handleRefineImage(activeListing.images[0])} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Edit/Refine Output</button>
                           <button onClick={() => handleSaveOutputAsStyle(activeListing.images[0])} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Save as Custom Aesthetic</button>
                         </div>
                      </div>
                      <div className="bg-white p-4 rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden group">
                        <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden">
                          <img src={activeListing.images[0].url} className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105" />
                          
                          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                             <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl w-full">
                               <div className="flex justify-between items-start mb-6">
                                 <div>
                                   <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">{activeListing.images[0].label} • {allStyles.find(s => s.id === activeListing.images[0].styleId)?.name}</p>
                                   <h4 className="text-white text-3xl font-black tracking-tighter leading-none">Transformation Complete</h4>
                                 </div>
                                 <button onClick={() => handleDownload(activeListing.images[0].url, activeListing.address)} className="bg-white text-indigo-600 p-4 rounded-2xl shadow-xl hover:scale-105 transition-transform active:scale-90">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                 </button>
                               </div>
                               <div className="flex gap-4">
                                  <button onClick={() => handleRefineImage(activeListing.images[0])} className="flex-1 bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black text-xs shadow-xl transition-all hover:scale-105">Refine Staging</button>
                                  <button onClick={() => handleSaveOutputAsStyle(activeListing.images[0])} className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-xl transition-all hover:scale-105">Save Aesthetic</button>
                               </div>
                             </div>
                          </div>
                        </div>

                        {/* FEEDBACK SECTION */}
                        <div className="p-8 space-y-6">
                           <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate Staging Quality</h4>
                              <div className="flex gap-1">
                                 {[1,2,3,4,5].map(star => (
                                    <button 
                                      key={star} 
                                      onClick={() => updateImageFeedback(activeListing.images[0].id, star)}
                                      className={`text-2xl transition-all hover:scale-125 ${activeListing.images[0].rating && activeListing.images[0].rating >= star ? 'grayscale-0' : 'grayscale opacity-30'}`}
                                    >
                                      ⭐
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <textarea 
                             placeholder="Internal notes or improvement feedback..."
                             value={activeListing.images[0].feedback || ''}
                             onChange={(e) => updateImageFeedback(activeListing.images[0].id, activeListing.images[0].rating || 0, e.target.value)}
                             className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold text-gray-900 outline-none focus:border-indigo-600 resize-none h-20"
                           />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-32 text-center shadow-sm">
                       <span className="text-6xl mb-6 block opacity-20">📸</span>
                       <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Portfolio Asset Portal</h3>
                       <p className="text-gray-400 font-medium text-sm max-w-sm mx-auto">Upload room photos to begin the hyper-realistic virtual staging process. Our consistency engine handles the rest.</p>
                    </div>
                  )}
                </div>

                {/* History Gallery */}
                {activeListing.images.length > 1 && (
                  <div className="space-y-6 pt-10 border-t border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Asset History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {activeListing.images.slice(1).map(img => (
                        <div key={img.id} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all">
                           <div className="aspect-[16/10] relative overflow-hidden bg-gray-50">
                              <img src={img.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                 <button onClick={() => handleDownload(img.url, activeListing.address)} className="bg-white px-6 py-2 rounded-xl text-indigo-600 font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all">Download</button>
                                 <button onClick={() => handleRefineImage(img)} className="bg-indigo-600 px-6 py-2 rounded-xl text-white font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all">Iterate</button>
                              </div>
                              <div className="absolute top-4 left-4">
                                 <span className="bg-black/40 backdrop-blur text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">{img.label}</span>
                              </div>
                           </div>
                           <div className="p-5 flex items-center justify-between">
                              <div className="flex gap-1">
                                 {img.rating ? Array(img.rating).fill(0).map((_, i) => <span key={i} className="text-[10px]">⭐</span>) : <span className="text-[8px] font-bold text-gray-300 uppercase">Unrated</span>}
                              </div>
                              <span className="text-[9px] font-bold text-gray-300 uppercase">{new Date(img.timestamp).toLocaleDateString()}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NEW LISTING */}
        {isNewListingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
              <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Initialize Listing</h3>
                <button onClick={() => setIsNewListingModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest">Discard</button>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2">Property Identity</label>
                  <input 
                    autoFocus
                    value={newListingName}
                    onChange={e => setNewListingName(e.target.value)}
                    placeholder="e.g. 202 Sunset Strip, Suite 10"
                    className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] text-2xl font-black outline-none transition-all shadow-inner text-gray-900 placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-2">Master Staging Aesthetic</label>
                  <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-2 scrollbar-hide border border-gray-50 rounded-2xl bg-gray-50/30">
                    {allStyles.map(style => (
                      <StyleCard 
                        key={style.id}
                        style={style}
                        isSelected={newListingStyleId === style.id}
                        onSelect={s => setNewListingStyleId(s.id)}
                      />
                    ))}
                  </div>
                </div>

                <button onClick={handleCreateListing} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-[2rem] shadow-2xl transition-all active:scale-[0.98]">
                  Start Project Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE CUSTOM STYLE / SAVE AS STYLE */}
        {isCreateStyleModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20">
              <div className="p-10 border-b border-gray-100 bg-indigo-50/50 flex gap-6 items-center">
                {saveAsStyleData && <img src={saveAsStyleData.url} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />}
                <div className="flex-1">
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">{saveAsStyleData ? 'Save Output as Aesthetic' : 'Design New Aesthetic'}</h3>
                   <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Scale your vision across future projects.</p>
                </div>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Aesthetic Identity</label>
                  <input 
                    value={newStyleName}
                    onChange={e => setNewStyleName(e.target.value)}
                    placeholder="e.g. Desert Modern Loft"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-900 outline-none focus:border-indigo-600 placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Staging Recipe</label>
                  <textarea 
                    value={newStylePrompt}
                    onChange={e => setNewStylePrompt(e.target.value)}
                    placeholder="Describe the furniture, lighting, and palette..."
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-900 outline-none focus:border-indigo-600 resize-none placeholder:text-gray-300"
                  />
                </div>
                <div className="flex gap-4">
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Aesthetic Avatar</label>
                      <input 
                        value={newStyleIcon}
                        onChange={e => setNewStyleIcon(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xl font-bold text-gray-900 outline-none"
                      />
                   </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => { setIsCreateStyleModalOpen(false); setSaveAsStyleData(null); }} className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl uppercase tracking-widest text-[10px]">Discard</button>
                  <button onClick={handleCreateCustomStyle} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100">Register Aesthetic</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
