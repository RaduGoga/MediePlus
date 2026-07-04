// Se remontează la fiecare schimbare de rută → fade scurt, doar pe opacitate.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
