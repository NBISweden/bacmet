import type { Metadata } from "next";
import Image from "next/image";
import NavBarCore from "./components/nav-bar-core";
import NavBar from "./components/navbar";
import { Suspense } from "react";

export const metadata: Metadata = {
  description: "BacMet is an easy-to-use bioinformatics resource of antibacterial biocide- and metal-resistance genes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const title = "BacMet";
  const brandName = "BacMet";
  const copyright = "Copyright © 2013-2018 All rights reserved";
  const contact = "info@example.com";
  const attribution = "BacMet database/website was developed and designed by Chandan Pal and currently maintained by Joakim Larsson's team";
  const navigation: ({ label: string, href?: string, dropdown?: { label: string, href: string }[] })[] = [
    { label: "Search", href: "/search/" },
    { label: "Sensitivity Distributions",
      dropdown: [
        { label: "For species", href: "/sensitivity-distributions/species/" },
        { label: "For biocides", href: "/sensitivity-distributions/biocide/" },
      ]
    },
    { label: "BLAST", href: "#" },
    { label: "Download", href: "#" },
    { label: "FAQ", href: "/faq/" },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" },
  ];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link href="/vendor/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="/vendor/bootstrap-icons.min.css" />
        <link href="/main.css" rel="stylesheet" />
        <script src="/vendor/bootstrap.bundle.min.js"></script>
      </head>
      <body>
        <header>
          {navigation.length > 0 ? (
            <Suspense fallback={<NavBarCore navigation={navigation} brandName={brandName} /> }>
              <NavBar navigation={navigation} brandName={brandName} />
            </Suspense>
          ) : <></>}
        </header>
        <main className="container">
          {children}
        </main>
        <footer className="container-fluid">
          <div className="row small d-flex justify-content-between">
            <div className="col-sm p-2">
              <p className="mb-1 text-uppercase"><strong>{brandName}</strong></p>
              {copyright}
            </div>
            <div className="col-sm p-2">
              <p className="mb-1"><strong>CONTACT</strong></p>
              <i className="bi bi-envelope-fill me-2"></i>
              {contact}
            </div>
            <div className="col-sm p-2 fst-italic">
              {attribution}
            </div>
            <div className="col-sm p-2 d-flex align-items-center justify-content-end">
              <Image
                src="/img/Chalmers_GU.png"
                alt="Chalmers and Gothenburg university logo"
                width={400}
                height={64}
                className="img-fluid" style={{ maxHeight: "32px" }}
              />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
