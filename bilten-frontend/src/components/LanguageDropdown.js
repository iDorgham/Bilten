import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

const LanguageDropdown = () => {
  const { currentLanguage, changeLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
             <button
         onClick={() => setIsOpen(!isOpen)}
         className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
       >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline ml-2 rtl:mr-2 rtl:ml-0">{currentLang.name}</span>
        <ChevronDownIcon className={`w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

             {isOpen && (
         <div className="absolute left-0 rtl:right-0 rtl:left-auto bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                                 className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left rtl:text-right hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                   currentLanguage === language.code
                     ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                     : 'text-gray-700 dark:text-gray-300'
                 }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                                 {currentLanguage === language.code && (
                   <div className="ml-auto rtl:mr-auto rtl:ml-0 w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
                 )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
