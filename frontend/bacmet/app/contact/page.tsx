import fs from "fs";
import path from "path";
import matter from "gray-matter";
import React from "react";
import ReactMarkdown from "react-markdown";
import ContactCard from "../components/contact-card";
import type { Contact } from "../types";

export default function Contact() {

  const filePath = path.join(process.cwd(), "public/markdown-content/contact.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent);

  const contacts = data.contact_info as Contact[];

  return (
    <>
      <div className="text-center pt-3">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      <div className="row justify-content-center">
        {contacts.map((contact, index) => (
          <ContactCard contact={contact} key={index} />
        ))}
      </div>
    </>
  );
}
