import React, { useCallback } from 'react';

interface ImageUploaderProps {
  onImagesSelect: (base64Array: string[]) => void;
  className?: string;
  multiple?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelect, className, multiple = true }) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Cast files to FileList to ensure correct inference in Array.from to avoid 'unknown' type errors
      const fileArray = Array.from(files as FileList);
      const readers = fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          // Ensure reader.result is treated as a string for resolve
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(results => {
        onImagesSelect(results);
      });
    }
  }, [onImagesSelect]);

  return (
    <div className={`relative group ${className}`}>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="border-2 border-dashed border-gray-300 group-hover:border-indigo-500 rounded-3xl p-10 transition-all bg-white flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">Upload Property Photos</h3>
        <p className="text-gray-500 text-xs max-w-xs font-medium">
          Select one or multiple rooms to stage at once.
          JPG, PNG supported.
        </p>
      </div>
    </div>
  );
};