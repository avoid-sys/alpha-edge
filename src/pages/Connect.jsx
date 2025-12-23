import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { NeumorphicButton } from '@/components/NeumorphicUI';
import { Upload } from 'lucide-react';

export default function Connect() {

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3">Upload Trading Files</h1>
        <p className="text-gray-500 text-sm sm:text-base">Upload your trading statements to start tracking your performance.</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div>
          <Link to={createPageUrl('ImportTrades')}>
            <NeumorphicButton className="w-full flex items-center justify-center bg-white">
              <Upload size={20} className="mr-2" />
              Import HTML Statement
            </NeumorphicButton>
          </Link>
          <p className="text-xs text-gray-500 mt-1 text-center">Upload trading statements from any broker</p>
        </div>
      </div>

    </div>
  );
}
