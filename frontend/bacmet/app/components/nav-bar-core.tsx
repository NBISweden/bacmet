import Link from "next/link";

export interface NavBarProps {
  navigation: { label: string, href?: string, dropdown?: { label: string, href: string }[] }[];
  brandName: string;
  pathname?: string;
}

export default function NavBarCore({ navigation, brandName, pathname }: NavBarProps) {
  return (
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
            {navigation.map((item, index) =>
              item.dropdown ? (
                <li key={index} className="nav-item dropdown me-2">
                  <button
                    className={`nav-link dropdown-toggle text-white${pathname && pathname.startsWith("/sensitivity-distributions/") ? " active" : ""}`}
                    id={`navbarDropdown-${index}`}
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {item.label}
                  </button>
                  <ul className="dropdown-menu bg-primary" aria-labelledby={`navbarDropdown-${index}`}>
                    {item.dropdown.map((dropItem, dropIndex) => (
                      <li key={dropIndex}>
                        <Link className={`dropdown-item text-white${pathname === dropItem.href ? " active" : ""}`} href={dropItem.href}>
                          {dropItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : item.href ? (
                <li key={index} className="nav-item me-2">
                  <Link className={`nav-link text-white${pathname === item.href ? " active" : ""}`} href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}