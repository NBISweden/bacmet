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
        <tr><th scope="row">Organism:</th><td><em>{ entry.organism }</em></td></tr>
        <tr><th scope="row">Location:</th><td>{ entry.location }</td></tr>
        <tr><th scope="row">Compound:</th><td>{Array.isArray(entry.compounds) ? entry.compounds.map(c => c.compound_name).join(", ") : entry.compounds}</td></tr>
        <tr><th scope="row">Description:</th><td>{ entry.description }</td></tr>
        <tr><th scope="row">Length (amino acid):</th><td>{ entry.length_aa }</td></tr>
        <tr><th scope="row">Reference:</th><td>{ Array.isArray(entry.reference) ? (
          entry.reference.map((ref, index, refs) => (
            <span key={index}>{ref.description}; <a href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pubMedId}/`}>Pubmed-{ref.pubMedId}</a>{index < refs.length - 1 ? ", " : ""}</span>
          ))
        ) : entry.reference }</td></tr>
        <tr><th scope="row">Protein accession (NCBI)</th><td>{
          typeof entry.protein_accession_ncbi === "string" ? (
            <a href={`https://www.ncbi.nlm.nih.gov/protein/${entry.protein_accession_ncbi}`} >{ entry.protein_accession_ncbi }</a>
          ) : entry.protein_accession_ncbi
        }</td></tr>
        <tr><th scope="row">Protein accession (Uniprot)</th><td>{
          typeof entry.protein_accession_uniprot === "string" ? (
            <a href={`https://www.uniprot.org/uniprotkb/${entry.protein_accession_uniprot}/entry`}>{ entry.protein_accession_uniprot }</a>
          ) : entry.protein_accession_uniprot
        }</td></tr>
        <tr><th scope="row">Nucleotide accession (ENA-EMBL)</th><td>{
          typeof entry.nucleotide_accession_ena_embl === "string" ? (
            <a href={`https://www.ebi.ac.uk/ena/browser/view/${entry.nucleotide_accession_ena_embl}`}>{ entry.nucleotide_accession_ena_embl }</a>
          ) : entry.nucleotide_accession_ena_embl
        }</td></tr>
      </tbody>
    </table>
  )
}
