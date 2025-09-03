import fs from "fs";
import path from "path";
import matter from "gray-matter";
import React from "react";
import Markdown from "../components/markdown-util";

export default function About() {
  const filePath = path.join(process.cwd(), "public/markdown-content/about.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContent);

  return (
    <div className="text-center pt-3">
      <Markdown>{content}</Markdown>
    </div>
  );
}