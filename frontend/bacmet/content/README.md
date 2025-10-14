# How update text and static information on BacMet website

This is a simple instruction on how to update text on the static information on the Bacmet website using markdown.

`NOTE:` In order for any of the changes in the markdown or static information to take effect the system needs to be rebuilt and redeployed.

Documentation on markdown: https://www.markdownguide.org/basic-syntax/

## Basic structures
The static pages are: 
- About page: `content/about.md`
- Contact page: `content/contact.md` 
- Download page: `content/download.md`
- FAQ page: `content/faq.md`
- Index (Homepage) page: `content/index.md`
- General site information: `content/site-info.json`

The markdown files can differ a little in terms of structure. Some of them have a section in the beginning that looks like this (the example below is the `index.md` used in the Homepage): 
```
---
heroText: BacMet is an easy-to-use bioinformatics resource of antibacterial biocide- and metal-resistance genes.
heroImage: /img/hero-image.jpg
quickSearchDescription: |
  ## Quick search
  You can search the BacMet database using any full term, including for example gene names (e.g. copA), name of biocides (e.g. Triclosan), metals (e.g. Arsenic) or chemical classes (e.g. Acridine). You will be redirected to the search page. The search also supports wildcard like this (e.g. Ar*nic for Arsenic or *ine for Diamidine)
---

# Bacmet Database
...
```

The first section (within the ---) contains some metadata that will allow some special information to be rendered on the page. In the printscreen above it shows the text on top of the image on the Homepage, the path to the image and the description used in the Quick search-box on the homepage. Other places where this is used is the Contact-page and the FAQ-page. This information can also be altered but the structure needs to be the same. 

Other pages (like About-page) use no metadata and this works as a normal markdown file. 

## Metadata on FAQ-page and Contact-page
On the FAQ-page and the Contact-page the metadata consists of a list of objects. In the FAQ-page it's the questions and answers and on the Contact-page it's the contact information for the people in the Bacmet-project. Objects can be added and removed from these lists as you want, as long as the structure of the objects are the same.

The expected types of the FAQ-meta data can be described as follows:
```ts
type FAQMeta = {
    faq_data: {
        question: string,
        answer: string
    }[]
}
```

The expected types of the contact meta data can be described as follows
```ts
type ContactMeta = {
    contact_info: {
        image?: string;
        name: string;
        job_title: string;
        workplace: string;
        university: string;
        email: string;
        phone?: string;
    }[]
}
```

## Images
You can add images to the markdown files, as long as you provide the path for that image in your markdown file. The images are stored in the img-folder (`bacmet/frontend/bacmet/public/img`). When you're adding a path to an image in the markdown file you can write: `/img/image-name.jpg`. This is of course as long as the folder structure stays the same. 

It can be good to know that some images are styled in specific way. The images on the index-page (Homepage) and the Contact-page have specific styling. In the Contact-page there is also fallback image (avatar.png) that will be added if there is no image added in the metadata and img-folder.

## General site information
Some general site information properties are easily accessible in a json file, `content/site-info.json`. The content of the file can be described with the following type:
```ts
type SiteInfo = {
    "description": string; // Used as metadata description content in the generated html
    "title": string; // Used as the main title of the site
    "brandName": string; // Used as the brand name in the navigation bar
    "copyright": string; // Used as copyright string in the footer
    "contact": string; // Used as contact information in the footer
    "attribution": string; // Used as attribution information in the footer
}
```
