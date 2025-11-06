// hooks/useSurveyFilters.ts
import { useState, useEffect } from "react";

interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status: "draft" | "published" | "closed" | "live" | "archived";
  closeDate?: string;
  createdAt: string;
  updatedAt: string;
  responseCount?: number;
  locked?: boolean;
}

export const useSurveyFilters = (surveys: Survey[]) => {
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterBy, setFilterBy] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusValue, setStatusValue] = useState("");

  useEffect(() => {
    applyFiltersAndSearch();
  }, [surveys, searchQuery, sortBy, sortOrder, filterBy, dateFrom, dateTo, statusValue]); // ✅ Added statusValue

  const applyFiltersAndSearch = () => {
    let result = [...surveys].filter(survey => survey && survey.title);    // Filter out invalid surveys first
    
    // Apply search filter (title and status only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((survey) => {
        return (
          survey?.title?.toLowerCase().includes(query) ||
          survey?.status?.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (filterBy === "status" && statusValue) {
      result = result.filter((survey) => survey.status === statusValue);
    } 

    // Apply date range filter
    if (dateFrom && (filterBy === "createdAt" || filterBy === "closeDate")) {
      result = result.filter((survey) => {
        const dateField =
          filterBy === "createdAt" ? survey.createdAt : survey.closeDate;
        if (!dateField) return false;
        return new Date(dateField) >= new Date(dateFrom);
      });
    }

    if (dateTo && (filterBy === "createdAt" || filterBy === "closeDate")) {
      result = result.filter((survey) => {
        const dateField =
          filterBy === "createdAt" ? survey.createdAt : survey.closeDate;
        if (!dateField) return false;
        return new Date(dateField) <= new Date(dateTo);
      });
    }
    setFilteredSurveys(result);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setFilterBy("all");
    setDateFrom("");
    setDateTo("");
    setStatusValue(""); 
  };

  return {
    filteredSurveys,
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
    clearFilters,
    statusValue,
    setStatusValue,
  };
};
