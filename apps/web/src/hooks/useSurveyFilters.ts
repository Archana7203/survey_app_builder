// hooks/useSurveyFilters.ts
import { useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterBy, setFilterBy] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusValue, setStatusValue] = useState("");

  // NOTE: All filtering (search, status, dates, sorting) is handled server-side via API
  // The surveys array already contains the filtered results from the server
  // We only filter out invalid surveys (those without titles) for display purposes
  const filteredSurveys = surveys.filter(survey => survey && survey.title);

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
