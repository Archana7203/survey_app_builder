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
    let result = [...surveys];
    result = result.filter((survey) => survey.status !== "archived");
    // Apply search filter (title and status only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((survey) => {
        return (
          survey.title.toLowerCase().includes(query) ||
          survey.status.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (filterBy === "status" && statusValue) {
      result = result.filter((survey) => survey.status === statusValue);
    } // ✅ Added closing brace

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

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "closeDate":
          aValue = a.closeDate ? new Date(a.closeDate).getTime() : 0;
          bValue = b.closeDate ? new Date(b.closeDate).getTime() : 0;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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
