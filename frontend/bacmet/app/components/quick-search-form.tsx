'use client'
import React, { useRef } from "react";
import { useRouter } from "next/navigation";

export default function QuickSearchForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleQuickSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) {
      router.push(`/search?free_text=${encodeURIComponent(value)}`);
    }
  }

  return (
    <form className="mb-4" onSubmit={handleQuickSearchSubmit}>
      <label className="form-label" htmlFor="quick-search-input">Free text search:</label>
      <input
        ref={inputRef}
        className="form-control"
        type="text"
        name="free_text"
        id="quick-search-input"
        placeholder="ex. gene name, compound name, chemical class"
      />
      <button className="btn btn-primary mt-2" type="submit">
        Search
      </button>
    </form>
  );
}