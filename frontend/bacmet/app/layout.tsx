import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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
  const navigation: { label: string, href: string }[] = [
    ["Browse & Search", "/search"],
    ["Advanced search", "#"],
    ["BLAST", "#"],
    ["Download", "#"],
    ["FAQ", "/faq"],
    ["About BacMet", "/about"],
    ["Contact", "/contact"],
  ].map(([label, href]) => ({ label, href }));
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
            <nav className="navbar navbar-expand-lg navbar-light bg-primary">
              <div className="container-fluid justify-content-between">
                <div>
                  <Link className="navbar-brand text-white me-1" href="/">{brandName}</Link> <i className="bi bi-virus text-white"></i>
                </div>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                  aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto">
                    {navigation.map((item, index) => (
                      <li key={index} className="nav-item me-2"><Link className="nav-link text-white" href={item.href}>{item.label}</Link></li>
                    ))}
                  </ul>
                </div>
              </div>
            </nav>
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
