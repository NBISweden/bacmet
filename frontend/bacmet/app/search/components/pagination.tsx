import {Link} from "../types";

export const Pagination = (
  {pages, currentPage, label, onNavigate}: {pages: Link[], currentPage?: string, label?: string, onNavigate: (page: Link) => void}
) => {
  const maxPages = 5;
  const first: Link = pages[0]
  const last: Link = pages[pages.length - 1]
  const currentIndex = pages.findIndex((link) => link.href === currentPage);
  const firstIndex = Math.ceil(Math.max(1, currentIndex - maxPages / 2));
  const lastIndex = Math.min(pages.length - 1, firstIndex + maxPages);
  const pageList = [
    ...(first === undefined ? [] : [{...first, rel: "First"}]),
    ...pages.slice(firstIndex, lastIndex),
    ...(last === undefined ? [] : [{...last, rel: `Last (${last.rel})`}])
  ]
  return (
    <nav aria-label={label || "Pagination"}>
      <ul className="pagination">
        {pageList.map((page, index) => (
          <li key={index} className={`page-item ${ page.href === currentPage ? "active" : "" }`}>
            <span className="page-link" onClick={() => onNavigate(page)}>{ page.rel }</span>
          </li>
        ))}
      </ul>
    </nav>
  )
}
