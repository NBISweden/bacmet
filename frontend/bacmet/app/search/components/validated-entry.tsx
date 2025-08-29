import React from "react";
import { Validated } from "../types";

export default function ValidatedEntry({entry}: {entry: Validated | Record<keyof Validated, React.ReactNode>}) {
  return (
    <table className="table">
      <tbody>
        <tr><th scope="row">BacMet ID:</th><td>{ entry.bacmet_id }</td></tr>
        <tr><th scope="row">Code for:</th><td>{ entry.code_for }</td></tr>
        <tr><th scope="row">Family:</th><td>{ entry.family }</td></tr>
        <tr><th scope="row">Sequence:</th><td>...</td></tr>
        <tr><th scope="row">Cross-database information:</th><td>...</td></tr>
        <tr><th scope="row">Organism:</th><td><em>{ entry.organism }</em></td></tr>
        <tr><th scope="row">Location:</th><td>{ entry.location }</td></tr>
        <tr><th scope="row">Compound:</th><td>{Array.isArray(entry.compounds) ? entry.compounds.map(c => c.compound_name).join(", ") : entry.compounds}</td></tr>
        <tr><th scope="row">Description:</th><td>{ entry.description }</td></tr>
        <tr><th scope="row">Length (amino acid):</th><td>{ entry.length_aa }</td></tr>
        <tr><th scope="row">Reference:</th><td>{ entry.reference }</td></tr>
      </tbody>
    </table>
  )
}
