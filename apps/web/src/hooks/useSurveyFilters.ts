// hooks/useSurveyFilters.ts
import { useMemo, useState } from "react";

interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status: "draft" | "published" | "closed" | "live" | "archived";
  closeDate?: string;
  endDate?: string;
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

  // NOTE: Server-side filters handle status/date/sort. We perform lightweight client-side
  // validation and search to avoid unnecessary network requests while typing.
  const filteredSurveys = useMemo(() => {
    const validSurveys = surveys.filter((survey) => survey && survey.title);
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return validSurveys;
    }

    return validSurveys.filter((survey) => {
      const titleMatch = survey.title.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = survey.description
        ? survey.description.toLowerCase().includes(normalizedQuery)
        : false;

      return titleMatch || descriptionMatch;
    });
  }, [surveys, searchQuery]);

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
