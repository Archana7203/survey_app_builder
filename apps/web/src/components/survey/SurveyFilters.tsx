import React from "react"; 
import Button from "../ui/Button";
import Card from "../ui/Card";

interface SurveyFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
  filterBy: string;
  setFilterBy: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  onClearFilters: () => void;
  statusValue: string; 
  setStatusValue: (value: string) => void; 
  onSearchTrigger?: () => void;
}

const SurveyFilters: React.FC<SurveyFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  filterBy,
  setFilterBy,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onClearFilters,
  statusValue, 
  setStatusValue,
  onSearchTrigger,
}) => {
  // When filterBy changes, reset statusValue
  React.useEffect(() => {
    if (filterBy !== "status") setStatusValue("");
    if (filterBy !== "createdAt" && filterBy !== "closeDate") {
      setDateFrom("");
      setDateTo("");
    }
  }, [filterBy, setDateFrom, setDateTo, setStatusValue]);

  return (
    <Card className="p-3">
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search surveys by title or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSearchTrigger) {
                onSearchTrigger();
              }
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {/* Sort By */}
          <div className="flex-1 min-w-[150px]">
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="closeDate">Close Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-gray-700"
                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* First Dropdown: Filter Type */}
          <div className="flex-1 min-w-[150px]">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">No Filter</option>
              <option value="status">Status</option>
              <option value="createdAt">Created Date</option>
              <option value="closeDate">Close Date</option>
            </select>
          </div>

          {/* Second Dropdown: Status (only if status is selected) */}
          {filterBy === "status" && (
            <div className="flex-1 min-w-[150px]">
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              >
                <option value="">Select Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="live">Live</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}

          {/* Date Range Inputs */}
          {(filterBy === "createdAt" || filterBy === "closeDate") && (
            <>
              <div className="flex-1 min-w-[120px]">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
            </>
          )}

          {/* Clear Filters Button */}
          <Button variant="outline" onClick={onClearFilters} className="whitespace-nowrap px-3 py-1.5 text-sm" title="Clear all filters">
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SurveyFilters;
