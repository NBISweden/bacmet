import dynamic from 'next/dynamic';
import type { BubblePlotProps } from "./bubble-plot";

const BubblePlot = dynamic(() => import('./bubble-plot'), { ssr: false })

export default function DynamicBubblePlot(props: BubblePlotProps) {
  return <BubblePlot {...props}/>
}
