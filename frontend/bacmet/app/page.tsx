import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import React from "react";

type IndexProps = {
  heroText: string;
  heroImage: string;
  quickSearchDescription: string;
}

function parseIndexData(data: unknown): IndexProps {
  const fallback: IndexProps = {
    heroText: "Welcome to BacMet Database",
    heroImage: "/img/hero-image.jpg",
    quickSearchDescription: "Quick search for antibacterial biocide- and metal-resistance genes.",
  };

  const getString = (key: keyof IndexProps) =>
    data && typeof data === "object" && typeof (data as IndexProps)[key] === "string"
      ? (data as IndexProps)[key]
      : fallback[key];

  return {
    heroText: getString("heroText"),
    heroImage: getString("heroImage"),
    quickSearchDescription: getString("quickSearchDescription"),
  };
}

export default function Home() {
  const filePath = path.join(process.cwd(), "public/markdown-content/index.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent);
  const indexProps = parseIndexData(data);

  return (
    <>
      <div className="text-center bg-image position-relative" style={{ backgroundImage: `url('${indexProps.heroImage}')` }}>
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="bg-dark bg-opacity-75 px-4 py-3">
            <p className="hero-image-text">{indexProps.heroText}</p>
          </div>
        </div>
      </div>
      <div className="container my-5">
        <div className="row gx-5">
          <div className="col-12 col-lg-8 order-1">
            <div className="p-3">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
          <div className="col-12 col-lg-4 order-2">
            <div className="p-3 border bg-white">
              <ReactMarkdown>{indexProps.quickSearchDescription}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}