import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Respondent } from '../../api-paths/respondentsApi';

interface MemberSelectorProps {
  availableRespondents: Respondent[];
  selectedMemberIds: string[];
  onMembersChange: (memberIds: string[]) => void;
  label?: string;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({
  availableRespondents,
  selectedMemberIds,
  onMembersChange,
  label = 'Add Members',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Filter available respondents (exclude already selected)
  const filteredRespondents = useMemo(() => {
    return availableRespondents.filter(r => {
      const matchesSearch = searchQuery === '' || 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.mail.toLowerCase().includes(searchQuery.toLowerCase());
      
      const notSelected = !selectedMemberIds.includes(r._id);
      
      return matchesSearch && notSelected && !r.isArchived;
    });
  }, [availableRespondents, searchQuery, selectedMemberIds]);

  const selectedMembers = useMemo(() => {
    return availableRespondents.filter(r => selectedMemberIds.includes(r._id));
  }, [availableRespondents, selectedMemberIds]);

  const handleRemove = (memberId: string) => {
    onMembersChange(selectedMemberIds.filter(id => id !== memberId));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for click events
    setTimeout(() => setIsDropdownOpen(false), 300);
  };

  const handleSelectFromDropdown = (respondentId: string) => {
    // Ensure we don't add duplicates
    if (selectedMemberIds.includes(respondentId)) {
      return;
    }
    
    const newSelectedIds = [...selectedMemberIds, respondentId];
    setSearchQuery('');
    setIsDropdownOpen(false);
    onMembersChange(newSelectedIds);
  };

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const scrollToDropdown = () => {
      if (!dropdownRef.current) {
        return;
      }
      dropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const animationFrame = window.requestAnimationFrame(scrollToDropdown);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [isDropdownOpen]);


  return (
    <div className="space-y-4">
      {/* Add Member Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} ({availableRespondents.length} available)
        </label>
        
        <div className="relative">
          {/* Search Input */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="w-full px-3 py-2 border rounded-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-2 focus:border-blue-500"
              />
              
              {/* Dropdown */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredRespondents.length > 0 ? (
                    filteredRespondents.map((respondent) => (
                      <button
                        key={respondent._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectFromDropdown(respondent._id);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {respondent.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {respondent.mail}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {availableRespondents.length === 0 
                        ? 'No respondents available' 
                        : searchQuery 
                          ? 'No respondents found matching your search'
                          : 'All respondents are already selected'
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Helper Text */}
          {filteredRespondents.length === 0 && searchQuery && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No respondents found
            </p>
          )}
        </div>
      </div>

       {/* Selected Members Section */}
       {selectedMembers.length > 0 && (
         <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
             Members ({selectedMembers.length})
           </label>
           <div className="space-y-2">
             {selectedMembers.map((member) => (
               <div
                 key={member._id}
                 className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
               >
                 <div className="flex items-center gap-3 flex-1 min-w-0">
                   <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                     <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                       {member.name.charAt(0).toUpperCase()}
                     </span>
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                       {member.name}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                       {member.mail}
                     </p>
                   </div>
                 </div>
                 <button
                   type="button"
                   onClick={() => handleRemove(member._id)}
                   className="ml-2 px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                 >
                   Remove
                 </button>
               </div>
             ))}
           </div>
         </div>
       )}
       
    </div>
  );
};

export default MemberSelector;

