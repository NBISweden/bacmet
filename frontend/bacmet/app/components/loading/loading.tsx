import styles from "./loading.module.css";

export function LineLoading({children}: {children: React.ReactNode}) {
    return (
        <span className={styles.loading}>{children}<span className={styles.loader}></span></span>
    )
}
