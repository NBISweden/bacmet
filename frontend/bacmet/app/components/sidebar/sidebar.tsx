import styles from "./sidebar.module.css";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className={`position-sticky ${styles.sidebar}`}>
      {children}
    </div>
  );
}
