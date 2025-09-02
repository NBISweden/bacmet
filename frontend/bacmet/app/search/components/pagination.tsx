import {Link} from "../types";

export const Pagination = (
  {pages, currentPage, label, pageCount, onNavigate}: {
    pages: Link[],
    currentPage?: string,
    label?: string,
    onNavigate: (page: Link) => void,
    pageCount?: number
  }
) => {
  const first: Link = pages.filter(p => p.rel === "first")[0]
  const last: Link = pages.filter(p => p.rel === "last")[0]
  const otherPages = pages.filter(p => !["first", "last"].includes(p.rel))
  const pageList = [
    ...(first === undefined ? [] : [{...first, rel: "First"}]),
    ...otherPages,
    ...(last === undefined ? [] : [{...last, rel: pageCount ? `Last (${pageCount})` : "Last"}])
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
