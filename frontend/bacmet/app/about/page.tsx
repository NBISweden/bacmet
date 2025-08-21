import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import React from "react";

export default function About() {
    const filePath = path.join(process.cwd(), "public/markdown-content/about.md");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { content } = matter(fileContent);

  return (
    <div className="text-center pt-3">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}



