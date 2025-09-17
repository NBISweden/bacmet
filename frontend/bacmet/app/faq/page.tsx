import fs from "fs";
import path from "path";
import matter from "gray-matter";
import React from "react";
import Markdown from "../components/markdown-util";
import Sidebar from "../components/sidebar/sidebar";
import type { FAQItem } from "../types";

function parseFAQData(value: unknown): FAQItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FAQItem =>
    item && 
    typeof item === "object" &&
    typeof item.question === "string" && 
    typeof item.answer === "string"
  );
}

export default function FAQPage() {
  const filePath = path.join(process.cwd(), "public/markdown-content/faq.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent);

  const faqData = parseFAQData(data.faqData);

  return (
    <>
      <div className="py-3">
        <Markdown>{content}</Markdown>
      </div>
      <div className="row row-gap-3">
        <div className="col-md-4 order-md-last">
          <Sidebar>
            <div className="list-group">
              {faqData.map((item, index) => (
                <a
                  key={index}
                  className="list-group-item list-group-item-action"
                  href={`#question-${index + 1}`}
                >
                  {`${index + 1}. ${item.question}`}
                </a>
              ))}
            </div>
          </Sidebar>
        </div>
        <div className="col-md-8 order-md-first">
          {faqData.map((item, index) => (
            <article key={index} id={`question-${index + 1}`} className="mb-4">
              <h2 className="h5">{`${index + 1}. ${item.question}`}</h2>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
