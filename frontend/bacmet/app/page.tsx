import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import React from "react";

export default function Home() {
  const filePath = path.join(process.cwd(), "public/markdown-content/index.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent);

  return (
    <>
      <div className="text-center bg-image position-relative" style={{ backgroundImage: `url('${data.heroImage || "/img/hero-image.jpg"}')`}}>
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="bg-dark bg-opacity-75 px-4 py-3">
            <p className="hero-image-text">{data.heroText}</p>
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
              <ReactMarkdown>{data.sidebar[0].text}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}