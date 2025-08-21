import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import React from "react";
import Image from "next/image";


export default function About() {
    const filePath = path.join(process.cwd(), "public/markdown-content/about.md");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContent);

  return (
    <div className="text-center pt-3">
      <ReactMarkdown>{data.text}</ReactMarkdown>
      <Image
        src={data.bacmetImage}
        alt={data.bacmetImageAlt}
        className="img-fluid mt-3 mb-3"
        width={575}
        height={539}
      />
    </div>
  );
}



