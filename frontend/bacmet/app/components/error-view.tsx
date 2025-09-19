export default function ErrorView({children}: {children: React.ReactNode}) {
    return <p className="alert alert-danger">{children}</p>
}
